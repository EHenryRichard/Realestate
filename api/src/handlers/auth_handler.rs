// auth_handler.rs
// ─────────────────────────────────────────────────────────────────────────────
// Every admin/agent authentication + team-management endpoint lives here. A
// "handler" is just an async function Actix calls when a matching request comes
// in (the URL → handler wiring is in routes/auth_routes.rs).
//
// Handlers receive their inputs as typed arguments and Actix injects them:
//   • web::Data<T>  — app-wide shared state (config, DB pool, the mailer).
//   • web::Json<T>  — the request body, already parsed into a struct.
//   • web::Path<T>  — pieces of the URL (e.g. the `{id}` in /agents/{id}).
//   • HttpRequest   — the raw request, used here to read the Authorization header.
// Each returns `impl Responder`, i.e. an HTTP response. We build those via the
// small helpers in handlers::common (ok / created / bad_request / unauthorized…).
//
// Two token types flow through here (both signed JWTs, see utils/jwt.rs):
//   • access token  — short-lived, sent as `Authorization: Bearer …` on requests.
//   • refresh token — longer-lived, stored in an httpOnly cookie, used to mint a
//                     fresh access token without re-entering the password.
// ─────────────────────────────────────────────────────────────────────────────

use actix_web::{
    cookie::{time::Duration as CookieDuration, Cookie, SameSite},
    web, HttpRequest, HttpResponse, Responder,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::auth_dto::{
        AdminResponse, AuthSessionResponse, ChangePasswordRequest, ForgotPasswordRequest,
        LoginRequest, RegisterAdminRequest, ResetPasswordRequest, UpdateAgentRequest,
        UpdateProfileRequest,
    },
    handlers::common,
    models::admin_user::AdminUser,
    services::email_service::Mailer,
    utils::{
        jwt::{
            create_access_token, create_password_reset_token, create_refresh_token, expiry_seconds,
            verify_password_reset_token, verify_token,
        },
        pagination::{make_pagination_meta, PaginationQuery},
        password::{hash_password, password_fingerprint, verify_password},
    },
};

/// Hard cap on the number of `admin` (super admin) accounts.
const MAX_ADMINS: i64 = 2;

/// Name of the httpOnly cookie that carries the refresh token in the browser.
const REFRESH_COOKIE_NAME: &str = "sureboy_refresh_token";

/// The exact set of columns we read back for an admin. Defined once so every
/// query returns the same shape (and matches the `AdminUser` struct field order).
/// `r#"…"#` is a Rust raw string — no escaping needed for the newlines/commas.
const ADMIN_COLUMNS: &str = r#"
    id,
    full_name,
    email,
    password_hash,
    role,
    is_active,
    is_primary,
    phone,
    photo,
    bio,
    title,
    slug,
    created_at,
    updated_at
"#;

/// Pulls the raw JWT out of an `Authorization: Bearer <token>` header.
/// Returns `None` if the header is missing, unreadable, not a Bearer token, or
/// empty. The chain of `.and_then`/`.filter` short-circuits to `None` on any of
/// those failures, so the caller only ever gets a real, non-empty token.
fn bearer_token(request: &HttpRequest) -> Option<String> {
    request
        .headers()
        .get("authorization") // Option<&HeaderValue>
        .and_then(|value| value.to_str().ok()) // → &str (None if non-UTF8)
        .and_then(|value| value.strip_prefix("Bearer ")) // require the scheme
        .map(str::trim) // drop stray whitespace
        .filter(|value| !value.is_empty()) // reject "Bearer " with nothing after
        .map(str::to_string) // own the string so we can return it
}

/// Shared "create a team member" routine used by both signup (the first admin)
/// and register-agent (everyone after). `is_primary` marks the protected founder
/// — only the bootstrap signup passes `true`.
async fn insert_admin_user(
    pool: &DbPool,
    payload: RegisterAdminRequest,
    default_role: &str,
    is_primary: bool,
) -> Result<AdminUser, sqlx::Error> {
    // Never store the raw password — hash it with Argon2 first.
    let password_hash = hash_password(&payload.password)
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?;
    // Use the caller's role if they sent a non-empty one, else the default.
    // Normalised to lowercase so "Admin"/"admin" are the same everywhere.
    let role = payload
        .role
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| default_role.to_string())
        .trim()
        .to_lowercase();
    // `$1..$9` are placeholders bound below — this is a parameterised query, so
    // user input can never be interpreted as SQL (no injection). `RETURNING`
    // hands back the freshly-inserted row so we can respond with it.
    let query = format!(
        r#"
        INSERT INTO admin_users (id, full_name, email, password_hash, role, is_active, phone, title, bio, is_primary)
        VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9)
        RETURNING {ADMIN_COLUMNS}
        "#
    );

    sqlx::query_as::<_, AdminUser>(&query)
        .bind(Uuid::new_v4())
        .bind(payload.full_name.trim())
        .bind(payload.email.trim().to_lowercase())
        .bind(password_hash)
        .bind(role)
        .bind(payload.phone.as_deref())
        .bind(payload.title.as_deref())
        .bind(payload.bio.as_deref())
        .bind(is_primary)
        .fetch_one(pool)
        .await
}

/// Number of `admin`-role accounts currently in the system.
async fn count_admins(pool: &DbPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM admin_users WHERE role = 'admin'")
        .fetch_one(pool)
        .await
}

/// Whether the account identified by `id` is the protected primary super admin.
async fn is_primary_admin(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
    Ok(
        sqlx::query_scalar::<_, bool>("SELECT is_primary FROM admin_users WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?
            .unwrap_or(false),
    )
}

/// Builds the "you're logged in" response shared by signup, login, and refresh.
/// It mints a fresh access + refresh token pair, sends the access token in the
/// JSON body (the SPA keeps it in memory) and the refresh token in an httpOnly
/// cookie (JavaScript can't read it, which limits token theft).
fn auth_response(config: &AppConfig, admin: AdminUser, message: &str) -> actix_web::HttpResponse {
    // Short-lived token the frontend attaches to every admin API call.
    let access_token = create_access_token(
        admin.id,
        &admin.email,
        &admin.role,
        &config.jwt_secret,
        &config.jwt_access_expires_in,
    );
    // Longer-lived token used only to obtain new access tokens.
    let refresh_token = create_refresh_token(
        admin.id,
        &admin.email,
        &admin.role,
        &config.jwt_secret,
        &config.jwt_refresh_expires_in,
    );

    // Both tokens must encode successfully; if either failed it's a server error.
    match (access_token, refresh_token) {
        (Ok(access_token), Ok(refresh_token)) => {
            // `AdminResponse::from` strips secret fields (e.g. password_hash) so
            // only safe profile data reaches the client.
            let data = AuthSessionResponse {
                access_token,
                admin: AdminResponse::from(&admin),
            };

            HttpResponse::Ok()
                .cookie(refresh_cookie(config, refresh_token)) // Set-Cookie header
                .json(json!({
                    "success": true,
                    "message": message,
                    "data": data
                }))
        }
        // `(Err(e), _) | (_, Err(e))` = "if either result is an Err, grab it".
        (Err(error), _) | (_, Err(error)) => common::server_error(error),
    }
}

/// Constructs the refresh-token cookie. The security attributes matter:
///   • http_only — unreadable from JavaScript (mitigates XSS token theft).
///   • secure    — only sent over HTTPS (driven by REFRESH_COOKIE_SECURE).
///   • same_site Lax — not sent on cross-site requests (mitigates CSRF).
///   • path      — scoped to the admin auth routes so it isn't sent elsewhere.
///   • max_age   — matches the refresh token's own lifetime.
fn refresh_cookie(config: &AppConfig, refresh_token: String) -> Cookie<'static> {
    Cookie::build(REFRESH_COOKIE_NAME, refresh_token)
        .http_only(true)
        .secure(config.refresh_cookie_secure)
        .same_site(SameSite::Lax)
        .path(admin_auth_cookie_path(config))
        .max_age(CookieDuration::seconds(expiry_seconds(
            &config.jwt_refresh_expires_in,
        )))
        .finish()
}

/// Logout's counterpart: an empty cookie with the same name/path but `max_age = 0`,
/// which tells the browser to delete it immediately. The attributes must match
/// the original or the browser won't recognise it as the same cookie.
fn clear_refresh_cookie(config: &AppConfig) -> Cookie<'static> {
    Cookie::build(REFRESH_COOKIE_NAME, "")
        .http_only(true)
        .secure(config.refresh_cookie_secure)
        .same_site(SameSite::Lax)
        .path(admin_auth_cookie_path(config))
        .max_age(CookieDuration::seconds(0)) // expire now → delete
        .finish()
}

/// The URL path the refresh cookie is scoped to, e.g. `/api/core-xxxx/auth`.
/// The browser only attaches the cookie to requests under this path.
fn admin_auth_cookie_path(config: &AppConfig) -> String {
    format!("/api{}/auth", config.admin_api_path)
}

/// Gatekeeper used by the "must be logged in" handlers. It extracts and verifies
/// the access token and returns the decoded claims (who the caller is). On any
/// problem it returns `Err(HttpResponse)` — a ready-made 401 the handler can
/// return directly. Using `Result<Claims, HttpResponse>` lets callers write
/// `let claims = match require_access_claims(...) { Ok(c) => c, Err(r) => return r };`.
fn require_access_claims(
    config: &AppConfig,
    request: &HttpRequest,
) -> Result<crate::utils::jwt::JwtClaims, actix_web::HttpResponse> {
    // 1. There must be a Bearer token at all.
    let Some(token) = bearer_token(request) else {
        return Err(common::unauthorized("Missing admin token"));
    };
    // 2. It must be validly signed and unexpired (`?` bubbles up the 401).
    let claims = verify_token(&token, &config.jwt_secret)
        .map_err(|_| common::unauthorized("Invalid admin token"))?;

    // 3. It must be an *access* token — reject refresh/reset tokens used here.
    if claims.token_type != "access" {
        return Err(common::unauthorized("Invalid admin access token"));
    }

    Ok(claims)
}

/// Stricter guard for admin-only actions (managing the team). Builds on the check
/// above and then additionally requires the caller's role to be `admin`, so
/// agents are turned away.
fn require_admin_token(
    config: &AppConfig,
    request: &HttpRequest,
) -> Result<(), actix_web::HttpResponse> {
    let claims = require_access_claims(config, request)?;

    if claims.role != "admin" {
        return Err(common::unauthorized("Only admins can manage team members"));
    }

    Ok(())
}

// ─── Public handlers ──────────────────────────────────────────────────────────

/// POST /auth/signup — one-time bootstrap of the very first admin.
/// This endpoint deliberately works only once: once any admin exists it locks
/// itself, and all future accounts are created from the dashboard instead.
pub async fn signup(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<RegisterAdminRequest>,
) -> impl Responder {
    // Count existing admins. `query_scalar` returns a single value (the COUNT).
    let existing_admins = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM admin_users")
        .fetch_one(pool.get_ref())
        .await;

    match existing_admins {
        // Already bootstrapped → refuse. This is why a second signup 400s.
        Ok(count) if count > 0 => {
            return common::bad_request(
                "Initial admin already exists. Login and register agents from the dashboard.",
            );
        }
        Err(error) => return common::server_error(error),
        _ => {} // count == 0 → proceed to create the founder
    }

    // Force the role to admin regardless of what was posted.
    let mut request = payload.into_inner();
    request.role = Some("admin".to_string());

    // `is_primary = true`: the bootstrap admin is the protected founder. On
    // success we immediately log them in via `auth_response` (tokens + cookie).
    match insert_admin_user(pool.get_ref(), request, "admin", true).await {
        Ok(admin) => auth_response(&config, admin, "Admin signup successful"),
        Err(error) => common::server_error(error),
    }
}

/// POST /auth/login — exchange email + password for a session.

pub async fn login(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<LoginRequest>,
) -> impl Responder {
    // Basic presence check before touching the database.
    if payload.email.trim().is_empty() || payload.password.trim().is_empty() {
        return common::bad_request("Email and password are required");
    }

    // Look the user up by email (lowercased so logins are case-insensitive).
    // `fetch_optional` → Ok(None) when no row matches, instead of an error.
    let query = format!("SELECT {ADMIN_COLUMNS} FROM admin_users WHERE email = $1 LIMIT 1");
    let admin = sqlx::query_as::<_, AdminUser>(&query)
        .bind(payload.email.trim().to_lowercase())
        .fetch_optional(pool.get_ref())
        .await;

    match admin {
        // Success requires ALL of: a row exists, the account is active, AND the
        // password verifies against the stored Argon2 hash. The `if` guard on the
        // match arm expresses that in one place.
        Ok(Some(admin))
            if admin.is_active
                && verify_password(payload.password.trim(), &admin.password_hash) =>
        {
            auth_response(&config, admin, "Login successful")
        }
        // Any other Ok (no user, inactive, or wrong password) → the SAME vague
        // message, so attackers can't tell which of those it was.
        Ok(_) => common::unauthorized("Invalid credentials"),
        Err(error) => common::server_error(error),
    }
}

/// POST /auth/refresh — issue a new session using the refresh cookie.
/// The SPA calls this on page load (its access token lives only in memory) and
/// whenever an access token expires. No password needed; the cookie is the proof.
pub async fn refresh(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    // The refresh token rides in a cookie, not the Authorization header.
    let Some(refresh_cookie) = request.cookie(REFRESH_COOKIE_NAME) else {
        return common::unauthorized("Missing refresh token");
    };
    // Verify it and insist it's specifically a *refresh* token.
    let claims = match verify_token(refresh_cookie.value().trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "refresh" => claims,
        Ok(_) => return common::unauthorized("Invalid refresh token type"),
        Err(_) => return common::unauthorized("Invalid refresh token"),
    };

    // Re-load the account (and require it's still active) so a deactivated user
    // can't keep refreshing forever. `claims.sub` is their id from the token.
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => auth_response(&config, admin, "Session refreshed successfully"),
        Ok(None) => common::unauthorized("Account not found or deactivated"),
        Err(error) => common::server_error(error),
    }
}

/// POST /auth/logout — clear the refresh cookie. There's no server-side session
/// to destroy (JWTs are stateless), so logging out just deletes the cookie; the
/// in-memory access token is dropped by the frontend.
pub async fn logout(config: web::Data<AppConfig>) -> impl Responder {
    HttpResponse::Ok()
        .cookie(clear_refresh_cookie(&config))
        .json(json!({ "success": true, "message": "Logout successful", "data": {} }))
}

/// Builds the link that goes in the email, e.g.
/// `https://yourdomain/control-xxxx/reset-password?token=...`. It stitches the
/// public site URL + the (secret) admin base path + the token.
fn build_reset_url(config: &AppConfig, token: &str) -> String {
    let base = config.frontend_url.trim_end_matches('/'); // avoid a double slash
    format!(
        "{base}{}/reset-password?token={token}",
        config.admin_base_path
    )
}

// One reply used whether or not the email exists (see below).
const FORGOT_PASSWORD_GENERIC: &str =
    "If that email belongs to an admin account, a password reset link has been sent.";

/// STEP 1 of the reset flow. The user submits their email; if it matches an admin
/// we email them a link. Security note: we return the **same** message either way
/// so an attacker can't use this endpoint to discover which emails are admins.
pub async fn forgot_password(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>, // the shared Mailer we registered in main.rs
    payload: web::Json<ForgotPasswordRequest>,
) -> impl Responder {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() {
        return common::bad_request("Email is required");
    }

    // Look up an active admin with this email.
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE email = $1 AND is_active = TRUE LIMIT 1"
    );
    let admin = match sqlx::query_as::<_, AdminUser>(&query)
        .bind(&email)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => admin,
        // No such admin: return the generic success anyway (don't leak existence).
        Ok(None) => return common::ok(FORGOT_PASSWORD_GENERIC, json!({})),
        Err(error) => return common::server_error(error),
    };

    // Fingerprint the current password + mint a short-lived signed token.
    let fingerprint = password_fingerprint(&admin.password_hash);
    let token = match create_password_reset_token(
        admin.id,
        &admin.email,
        &fingerprint,
        &config.jwt_secret,
        &config.password_reset_expires_in,
    ) {
        Ok(token) => token,
        Err(error) => return common::server_error(error),
    };

    // Send the email. If sending fails we log it but STILL return the generic
    // success — again, to avoid leaking whether the address exists.
    let reset_url = build_reset_url(&config, &token);
    if let Err(error) = mailer
        .send_password_reset(&admin.email, &admin.full_name, &reset_url)
        .await
    {
        tracing::error!(
            "Failed to send password reset email to {}: {error}",
            admin.email
        );
    }

    common::ok(FORGOT_PASSWORD_GENERIC, json!({}))
}

/// STEP 2 of the reset flow. The reset page posts the token from the link plus the
/// new password. We validate the token, confirm it hasn't been used, then save
/// the new password.
pub async fn reset_password(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<ResetPasswordRequest>,
) -> impl Responder {
    let req = payload.into_inner();
    if req.new_password.trim().len() < 6 {
        return common::bad_request("Password must be at least 6 characters");
    }

    // Verify signature + expiry, and make sure it's actually a reset token
    // (not, say, an access token someone tried to reuse here).
    let claims = match verify_password_reset_token(req.token.trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "password_reset" => claims,
        _ => return common::bad_request("This reset link is invalid or has expired"),
    };

    // `claims.sub` tells us which admin the token belongs to.
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );
    let admin = match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => admin,
        Ok(None) => return common::bad_request("This reset link is invalid or has expired"),
        Err(error) => return common::server_error(error),
    };

    // Single-use check: the token carries the fingerprint of the password that was
    // active when it was issued. If the current password's fingerprint differs,
    // the password already changed and this link is spent.
    if password_fingerprint(&admin.password_hash) != claims.fingerprint {
        return common::bad_request("This reset link has already been used or is no longer valid");
    }

    // Hash the new password before storing it.
    let new_hash = match hash_password(req.new_password.trim()) {
        Ok(hash) => hash,
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("UPDATE admin_users SET password_hash = $2, updated_at = now() WHERE id = $1")
        .bind(admin.id)
        .bind(new_hash)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => common::ok(
            "Password reset successfully. You can now log in.",
            json!({}),
        ),
        Err(error) => common::server_error(error),
    }
}

// ─── Own profile ──────────────────────────────────────────────────────────────

/// GET /auth/me — returns the logged-in user's own profile. The SPA calls this to
/// know who is signed in. `require_access_claims` both authenticates the request
/// and tells us *which* account to load (via `claims.sub`).
pub async fn me(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    // Reject anyone without a valid access token; otherwise get their claims.
    let claims = match require_access_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub) // the caller's own id, straight from their token
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => common::ok("Profile fetched", AdminResponse::from(admin)),
        Ok(None) => common::unauthorized("Account not found"), // token valid but user gone
        Err(error) => common::server_error(error),
    }
}

/// PATCH /auth/me — lets a signed-in user edit their own profile fields.

pub async fn update_me(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<UpdateProfileRequest>,
) -> impl Responder {
    let claims = match require_access_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let req = payload.into_inner();
    // `COALESCE($n, column)` keeps the existing value when a field is omitted, so
    // this one statement handles any subset of profile fields. `WHERE id = $1`
    // ties the update to the caller — you can only edit your *own* profile here.
    let query = format!(
        r#"
        UPDATE admin_users
        SET full_name  = COALESCE($2, full_name),
            phone      = COALESCE($3, phone),
            photo      = COALESCE($4, photo),
            bio        = COALESCE($5, bio),
            title      = COALESCE($6, title),
            slug       = COALESCE($7, slug),
            updated_at = now()
        WHERE id = $1 AND is_active = TRUE
        RETURNING {ADMIN_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .bind(req.full_name.as_deref())
        .bind(req.phone.as_deref())
        .bind(req.photo.as_deref())
        .bind(req.bio.as_deref())
        .bind(req.title.as_deref())
        .bind(req.slug.as_deref())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => common::ok("Profile updated", AdminResponse::from(admin)),
        Ok(None) => common::not_found("Account not found"),
        Err(error) => common::server_error(error),
    }
}

/// POST /auth/me/change-password — change your own password *while logged in*.
/// Unlike the reset flow, this proves ownership by requiring the current password
/// (defence against someone using an unlocked/hijacked session to lock the owner out).
pub async fn change_password(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<ChangePasswordRequest>,
) -> impl Responder {
    // Must be logged in; `claims.sub` identifies whose password to change.
    let claims = match require_access_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let req = payload.into_inner();

    // Load the account so we can check the current password against its hash.
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );
    let admin = match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => admin,
        Ok(None) => return common::not_found("Account not found"),
        Err(error) => return common::server_error(error),
    };

    // Verify the supplied current password before allowing the change.
    if !verify_password(req.current_password.trim(), &admin.password_hash) {
        return common::bad_request("Current password is incorrect");
    }

    // Hash the new password (never store plaintext).
    let new_hash = match hash_password(req.new_password.trim()) {
        Ok(hash) => hash,
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("UPDATE admin_users SET password_hash = $2, updated_at = now() WHERE id = $1")
        .bind(admin.id)
        .bind(new_hash)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => common::ok("Password changed successfully", json!({})),
        Err(error) => common::server_error(error),
    }
}

// ─── Admin: manage agents ─────────────────────────────────────────────────────

/// GET /auth/agents — paginated, searchable list of team members for the Team
/// page. Admin-only. Reads filters (search text, role, active flag, page/limit)
/// from the query string via `web::Query<PaginationQuery>`.
pub async fn list_agents(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    // Two queries: one COUNT for the total (used to build pagination metadata)
    // and one page of rows. Both share the same WHERE filters below, where each
    // `$n::TYPE IS NULL OR …` means "ignore this filter when it wasn't provided".
    let params = query.into_inner();
    let search = params.search_pattern();
    let role = params
        .role
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_string);

    let count_query = r#"
        SELECT COUNT(*) FROM admin_users
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1)
          AND ($2::TEXT IS NULL OR role = $2)
          AND ($3::BOOLEAN IS NULL OR is_active = $3)
    "#;
    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(role.clone())
        .bind(params.is_active)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };

    let list_query = format!(
        r#"
        SELECT {ADMIN_COLUMNS} FROM admin_users
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1)
          AND ($2::TEXT IS NULL OR role = $2)
          AND ($3::BOOLEAN IS NULL OR is_active = $3)
        ORDER BY role ASC, created_at DESC
        LIMIT $4 OFFSET $5
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&list_query)
        .bind(search)
        .bind(role)
        .bind(params.is_active)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(agents) => common::list(
            "Team fetched successfully",
            agents
                .into_iter()
                .map(AdminResponse::from)
                .collect::<Vec<_>>(),
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

/// Creates a new team member (agent by default, or a second admin). Called from
/// the "Add Member" page. `require_admin_token` at the top means only a logged-in
/// admin can reach this — agents can't create accounts.
pub async fn register_agent(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<RegisterAdminRequest>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    let req = payload.into_inner();
    // Figure out the role being requested (defaulting to "agent"), normalised.
    let requested_role = req
        .role
        .as_deref()
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "agent".to_string());

    // Business rule: at most two super admins. If they're trying to add an admin
    // and we already have the max, refuse before touching the database.
    if requested_role == "admin" {
        match count_admins(pool.get_ref()).await {
            Ok(count) if count >= MAX_ADMINS => {
                return common::bad_request(
                    "There can only be two super admins. Remove the second admin before adding another.",
                );
            }
            Err(error) => return common::server_error(error),
            _ => {} // under the cap — allowed
        }
    }

    // New members are never the primary founder, hence `is_primary = false`.
    match insert_admin_user(pool.get_ref(), req, "agent", false).await {
        Ok(agent) => common::created(
            "Team member registered successfully",
            AdminResponse::from(agent),
        ),
        Err(error) => common::server_error(error),
    }
}

/// GET /auth/agents/{id} — fetch a single team member (used by the Edit page).
/// Admin-only. The `{id}` path segment arrives as `web::Path<String>`.
pub async fn get_agent(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    // Parse the path string into a real UUID; reject malformed ids early.
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid agent id"),
    };
    let query = format!("SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 LIMIT 1");

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(agent)) => common::ok("Agent fetched", AdminResponse::from(agent)),
        Ok(None) => common::not_found("Agent not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_agent(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
    payload: web::Json<UpdateAgentRequest>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid agent id"),
    };
    let req = payload.into_inner();

    // Load the account being edited first, so we can apply the founder rules
    // and the admin cap *before* running the update.
    let target = match sqlx::query_as::<_, AdminUser>(&format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 LIMIT 1"
    ))
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(target)) => target,
        Ok(None) => return common::not_found("Team member not found"),
        Err(error) => return common::server_error(error),
    };

    // `Some(role)` only if a non-empty role was supplied; `None` means "leave as-is".
    let requested_role = req
        .role
        .as_deref()
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty());

    // The primary founder is untouchable in two ways: can't be demoted from admin,
    // and can't be switched off. This prevents anyone from locking out the owner.
    if target.is_primary {
        if matches!(requested_role.as_deref(), Some(role) if role != "admin") {
            return common::bad_request("The primary super admin cannot be demoted.");
        }
        if req.is_active == Some(false) {
            return common::bad_request("The primary super admin cannot be deactivated.");
        }
    }

    // Promoting a non-admin up to admin must respect the two-admin cap.
    if requested_role.as_deref() == Some("admin") && target.role != "admin" {
        match count_admins(pool.get_ref()).await {
            Ok(count) if count >= MAX_ADMINS => {
                return common::bad_request(
                    "There can only be two super admins. Remove the second admin before promoting another.",
                );
            }
            Err(error) => return common::server_error(error),
            _ => {}
        }
    }

    // `COALESCE($n, column)` = "use the new value if one was sent, otherwise keep
    // the existing column". That's how a partial update works: fields left out of
    // the request (bound as NULL) stay untouched.
    let query = format!(
        r#"
        UPDATE admin_users
        SET full_name  = COALESCE($2, full_name),
            role       = COALESCE($3, role),
            is_active  = COALESCE($4, is_active),
            phone      = COALESCE($5, phone),
            photo      = COALESCE($6, photo),
            bio        = COALESCE($7, bio),
            title      = COALESCE($8, title),
            slug       = COALESCE($9, slug),
            updated_at = now()
        WHERE id = $1
        RETURNING {ADMIN_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(id)
        .bind(req.full_name.as_deref())
        .bind(req.role.as_deref())
        .bind(req.is_active)
        .bind(req.phone.as_deref())
        .bind(req.photo.as_deref())
        .bind(req.bio.as_deref())
        .bind(req.title.as_deref())
        .bind(req.slug.as_deref())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(agent)) => common::ok("Team member updated", AdminResponse::from(agent)),
        Ok(None) => common::not_found("Agent not found"),
        Err(error) => common::server_error(error),
    }
}

/// Flips a member between active/inactive (the little person-toggle button). We
/// block toggling the primary founder so they can never be locked out.
pub async fn toggle_agent_active(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid agent id"),
    };

    // Guard: the founder can't be deactivated.
    match is_primary_admin(pool.get_ref(), id).await {
        Ok(true) => {
            return common::bad_request("The primary super admin cannot be deactivated.");
        }
        Err(error) => return common::server_error(error),
        _ => {} // not the primary — allowed
    }

    // `NOT is_active` flips the boolean directly in the database.
    let query = format!(
        r#"
        UPDATE admin_users
        SET is_active = NOT is_active, updated_at = now()
        WHERE id = $1
        RETURNING {ADMIN_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(agent)) => common::ok("Status updated", AdminResponse::from(agent)),
        Ok(None) => common::not_found("Agent not found"),
        Err(error) => common::server_error(error),
    }
}

/// Permanently removes a team member. This is where the "two super admins, first
/// can delete the second" rule lives:
///   • the primary founder can never be deleted (by anyone);
///   • the second admin can only be deleted by the primary;
///   • ordinary agents can be deleted by any admin.
pub async fn delete_agent(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    // Step 1: confirm the caller is a logged-in admin (agents get rejected).
    let claims = match require_access_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    if claims.role != "admin" {
        return common::unauthorized("Only admins can manage team members");
    }

    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid agent id"),
    };

    // Step 2: load the account being deleted so we can apply the rules to it.
    let target = match sqlx::query_as::<_, AdminUser>(&format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 LIMIT 1"
    ))
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(target)) => target,
        Ok(None) => return common::not_found("Team member not found"),
        Err(error) => return common::server_error(error),
    };

    // Rule A: the founder is protected, full stop.
    if target.is_primary {
        return common::bad_request("The primary super admin cannot be deleted.");
    }

    // Rule B: removing the *other* admin requires the caller to be the primary.
    // (`claims.sub` is the caller's own id, taken from their token.)
    if target.role == "admin" {
        match is_primary_admin(pool.get_ref(), claims.sub).await {
            Ok(true) => {} // caller is the founder — allowed
            Ok(false) => {
                return common::bad_request(
                    "Only the primary super admin can remove another admin.",
                );
            }
            Err(error) => return common::server_error(error),
        }
    }

    // Step 3: passed all checks — delete. `rows_affected() > 0` confirms a row
    // was actually removed (guards against a race where it vanished meanwhile).
    match sqlx::query("DELETE FROM admin_users WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("Team member removed", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Team member not found"),
        Err(error) => common::server_error(error),
    }
}

// ─── Public: team listing + individual profile ─────────────────────────────────
// These two are NOT behind the admin guard — they power the public website's
// "Our Team" / agent-profile pages. They only ever expose active *agents*
// (never admins), and `AdminResponse` still hides sensitive fields.

/// GET (public) — one agent's public profile, looked up by their URL slug.
pub async fn get_public_agent(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let slug = path.into_inner();
    // Note the WHERE: active AND role = 'agent' — admins are never shown publicly.
    let query = format!(
        r#"
        SELECT {ADMIN_COLUMNS} FROM admin_users
        WHERE slug = $1 AND is_active = TRUE AND role = 'agent'
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(&slug)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(agent)) => common::ok("Agent fetched", AdminResponse::from(agent)),
        Ok(None) => common::not_found("Agent not found"),
        Err(error) => common::server_error(error),
    }
}

/// GET (public) — the full list of active agents for the public team page,
/// alphabetised. `fetch_all` returns every matching row; we map each into the
/// safe `AdminResponse` shape before sending.
pub async fn list_public_agents(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        r#"
        SELECT {ADMIN_COLUMNS} FROM admin_users
        WHERE is_active = TRUE AND role = 'agent'
        ORDER BY full_name ASC
        "#
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(agents) => common::ok(
            "Team fetched",
            agents
                .into_iter()
                .map(AdminResponse::from)
                .collect::<Vec<_>>(),
        ),
        Err(error) => common::server_error(error),
    }
}
