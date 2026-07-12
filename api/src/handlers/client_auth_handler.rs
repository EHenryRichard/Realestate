// client_auth_handler.rs
// ─────────────────────────────────────────────────────────────────────────────
// Authentication for PUBLIC (client) accounts — the people who sign up on the
// website to save properties, get alerts, and contact agents. This is a separate
// world from admin auth (auth_handler.rs): different table (client_users),
// different token role ("client"), and its own refresh cookie.
//
// It reuses the same building blocks as admin auth: JWT access/refresh tokens
// (utils/jwt.rs), Argon2 password hashing (utils/password.rs), and the SMTP
// mailer for the "confirm your email" step.
// ─────────────────────────────────────────────────────────────────────────────

use actix_web::{
    HttpRequest, HttpResponse, Responder,
    cookie::{Cookie, SameSite, time::Duration as CookieDuration},
    web,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::client_dto::{
        ClientLoginRequest, ClientRegisterRequest, ClientResponse, ClientSessionResponse,
        ResendVerificationRequest, UpdateClientProfileRequest, VerifyEmailRequest,
    },
    handlers::common,
    models::client_user::ClientUser,
    services::email_service::Mailer,
    utils::{
        jwt::{
            create_access_token, create_email_verification_token, create_refresh_token,
            expiry_seconds, verify_email_verification_token, verify_token,
        },
        password::{hash_password, verify_password},
    },
};

/// Refresh cookie name for clients (kept distinct from the admin cookie).
const CLIENT_REFRESH_COOKIE_NAME: &str = "sureboy_client_refresh_token";

/// The columns we read for a client, in the same order as the `ClientUser` struct.
const CLIENT_COLUMNS: &str = r#"
    id,
    full_name,
    email,
    password_hash,
    phone,
    email_verified,
    phone_verified,
    is_active,
    avatar,
    search_preferences,
    created_at,
    updated_at
"#;

// ─── Small local helpers ───────────────────────────────────────────────────────

/// Extracts the JWT from an `Authorization: Bearer …` header (or `None`).
fn bearer_token(request: &HttpRequest) -> Option<String> {
    request
        .headers()
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

/// Where the client refresh cookie is scoped to. The browser only sends it back
/// on client-auth requests, never to admin or public content routes.
fn client_cookie_path() -> String {
    "/api/client/auth".to_string()
}

/// Builds the httpOnly refresh cookie (see the admin version for the reasoning
/// behind each security attribute).
fn client_refresh_cookie(config: &AppConfig, refresh_token: String) -> Cookie<'static> {
    Cookie::build(CLIENT_REFRESH_COOKIE_NAME, refresh_token)
        .http_only(true)
        .secure(config.refresh_cookie_secure)
        .same_site(SameSite::Lax)
        .path(client_cookie_path())
        .max_age(CookieDuration::seconds(expiry_seconds(
            &config.jwt_refresh_expires_in,
        )))
        .finish()
}

/// An expired empty cookie that tells the browser to delete the refresh cookie.
fn clear_client_refresh_cookie(config: &AppConfig) -> Cookie<'static> {
    Cookie::build(CLIENT_REFRESH_COOKIE_NAME, "")
        .http_only(true)
        .secure(config.refresh_cookie_secure)
        .same_site(SameSite::Lax)
        .path(client_cookie_path())
        .max_age(CookieDuration::seconds(0))
        .finish()
}

/// The link a new client clicks to confirm their email, e.g.
/// `https://yourdomain/verify-email?token=…` on the public site.
fn build_verify_url(config: &AppConfig, token: &str) -> String {
    let base = config.frontend_url.trim_end_matches('/');
    format!("{base}/verify-email?token={token}")
}

/// Builds the "logged in" response: mints an access + refresh token pair with
/// role `"client"`, returns the access token + profile in the body, and sets the
/// refresh token as an httpOnly cookie.
fn client_session_response(
    config: &AppConfig,
    client: ClientUser,
    message: &str,
    created: bool,
) -> HttpResponse {
    let access_token = create_access_token(
        client.id,
        &client.email,
        "client",
        &config.jwt_secret,
        &config.jwt_access_expires_in,
    );
    let refresh_token = create_refresh_token(
        client.id,
        &client.email,
        "client",
        &config.jwt_secret,
        &config.jwt_refresh_expires_in,
    );

    match (access_token, refresh_token) {
        (Ok(access_token), Ok(refresh_token)) => {
            let data = ClientSessionResponse {
                access_token,
                client: ClientResponse::from(&client),
            };
            let body = json!({ "success": true, "message": message, "data": data });
            // Signup returns 201 Created; login/refresh return 200 OK.
            let mut builder = if created {
                HttpResponse::Created()
            } else {
                HttpResponse::Ok()
            };
            builder
                .cookie(client_refresh_cookie(config, refresh_token))
                .json(body)
        }
        (Err(error), _) | (_, Err(error)) => common::server_error(error),
    }
}

/// Guard for client-only endpoints: verifies the access token and that it belongs
/// to a client (role `"client"`), returning the claims or a ready-made 401.
/// `pub(crate)` so the activity handlers can reuse the same gate.
pub(crate) fn require_client_claims(
    config: &AppConfig,
    request: &HttpRequest,
) -> Result<crate::utils::jwt::JwtClaims, HttpResponse> {
    let Some(token) = bearer_token(request) else {
        return Err(common::unauthorized("Missing token"));
    };
    let claims = verify_token(&token, &config.jwt_secret)
        .map_err(|_| common::unauthorized("Invalid or expired token"))?;

    if claims.token_type != "access" || claims.role != "client" {
        return Err(common::unauthorized("Invalid client token"));
    }
    Ok(claims)
}

/// Stricter guard for feature endpoints: the token must be valid AND the account
/// must be active with a confirmed email. Verification happens after the token
/// is issued, so this checks the database, not the claims. Returns 403 with a
/// plain-English message the frontend can show as-is.
pub(crate) async fn require_verified_client(
    config: &AppConfig,
    pool: &DbPool,
    request: &HttpRequest,
) -> Result<crate::utils::jwt::JwtClaims, HttpResponse> {
    let claims = require_client_claims(config, request)?;
    let status = sqlx::query_scalar::<_, bool>(
        "SELECT email_verified AND is_active FROM client_users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(pool)
    .await
    .map_err(common::server_error)?;

    match status {
        Some(true) => Ok(claims),
        Some(false) => Err(common::forbidden(
            "Please confirm your email address to use this feature.",
        )),
        None => Err(common::unauthorized("Account not found")),
    }
}

/// Generates a fresh verification token and emails it. Logs on failure but never
/// hard-fails the caller — a mail hiccup shouldn't block signup.
async fn send_verification_email(config: &AppConfig, mailer: &Mailer, client: &ClientUser) {
    let token = match create_email_verification_token(
        client.id,
        &client.email,
        &config.jwt_secret,
        &config.email_verification_expires_in,
    ) {
        Ok(token) => token,
        Err(error) => {
            tracing::error!("Failed to create email verification token: {error}");
            return;
        }
    };
    let verify_url = build_verify_url(config, &token);
    if let Err(error) = mailer
        .send_email_verification(&client.email, &client.full_name, &verify_url)
        .await
    {
        tracing::error!("Failed to send verification email to {}: {error}", client.email);
    }
}

// ─── Handlers ───────────────────────────────────────────────────────────────────

/// POST /client/auth/register — create a public account. The user is logged in
/// immediately (so they can start using the site) but `email_verified` stays
/// false until they click the link we email them.
pub async fn register(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>,
    payload: web::Json<ClientRegisterRequest>,
) -> impl Responder {
    let req = payload.into_inner();
    let full_name = req.full_name.trim();
    let email = req.email.trim().to_lowercase();

    if full_name.is_empty() || email.is_empty() || req.password.trim().len() < 6 {
        return common::bad_request("Name, email, and a 6+ character password are required");
    }

    // Reject duplicate emails up front for a clean error (there's also a UNIQUE
    // constraint as the last line of defence).
    match sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM client_users WHERE email = $1")
        .bind(&email)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(count) if count > 0 => {
            return common::bad_request("An account with this email already exists");
        }
        Err(error) => return common::server_error(error),
        _ => {}
    }

    let password_hash = match hash_password(req.password.trim()) {
        Ok(hash) => hash,
        Err(error) => return common::server_error(error),
    };

    let query = format!(
        r#"
        INSERT INTO client_users (id, full_name, email, password_hash, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {CLIENT_COLUMNS}
        "#
    );
    let client = match sqlx::query_as::<_, ClientUser>(&query)
        .bind(Uuid::new_v4())
        .bind(full_name)
        .bind(&email)
        .bind(password_hash)
        .bind(req.phone.as_deref().map(str::trim).filter(|value| !value.is_empty()))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(client) => client,
        Err(error) => return common::server_error(error),
    };

    // Fire off the confirmation email (non-blocking on failure).
    send_verification_email(&config, &mailer, &client).await;

    client_session_response(&config, client, "Account created. Please verify your email.", true)
}

/// POST /client/auth/login — exchange email + password for a session.
pub async fn login(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<ClientLoginRequest>,
) -> impl Responder {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() || payload.password.trim().is_empty() {
        return common::bad_request("Email and password are required");
    }

    let query = format!("SELECT {CLIENT_COLUMNS} FROM client_users WHERE email = $1 LIMIT 1");
    let client = sqlx::query_as::<_, ClientUser>(&query)
        .bind(&email)
        .fetch_optional(pool.get_ref())
        .await;

    match client {
        Ok(Some(client))
            if client.is_active
                && verify_password(payload.password.trim(), &client.password_hash) =>
        {
            client_session_response(&config, client, "Login successful", false)
        }
        // Same vague message for "no user" / "wrong password" / "inactive".
        Ok(_) => common::unauthorized("Invalid credentials"),
        Err(error) => common::server_error(error),
    }
}

/// POST /client/auth/refresh — new session from the refresh cookie (no password).
pub async fn refresh(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let Some(cookie) = request.cookie(CLIENT_REFRESH_COOKIE_NAME) else {
        return common::unauthorized("Missing refresh token");
    };
    let claims = match verify_token(cookie.value().trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "refresh" && claims.role == "client" => claims,
        Ok(_) => return common::unauthorized("Invalid refresh token type"),
        Err(_) => return common::unauthorized("Invalid refresh token"),
    };

    let query = format!(
        "SELECT {CLIENT_COLUMNS} FROM client_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );
    match sqlx::query_as::<_, ClientUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => client_session_response(&config, client, "Session refreshed", false),
        Ok(None) => common::unauthorized("Account not found or deactivated"),
        Err(error) => common::server_error(error),
    }
}

/// POST /client/auth/logout — clear the refresh cookie.
pub async fn logout(config: web::Data<AppConfig>) -> impl Responder {
    HttpResponse::Ok()
        .cookie(clear_client_refresh_cookie(&config))
        .json(json!({ "success": true, "message": "Logout successful", "data": {} }))
}

/// GET /client/auth/me — the signed-in client's own profile.
pub async fn me(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let claims = match require_client_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let query = format!(
        "SELECT {CLIENT_COLUMNS} FROM client_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );
    match sqlx::query_as::<_, ClientUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => common::ok("Profile fetched", ClientResponse::from(client)),
        Ok(None) => common::unauthorized("Account not found"),
        Err(error) => common::server_error(error),
    }
}

/// PATCH /client/auth/me — update the signed-in client's own profile.
pub async fn update_me(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<UpdateClientProfileRequest>,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let req = payload.into_inner();
    let query = format!(
        r#"
        UPDATE client_users
        SET full_name          = COALESCE($2, full_name),
            phone              = COALESCE($3, phone),
            avatar             = COALESCE($4, avatar),
            search_preferences = COALESCE($5, search_preferences),
            updated_at         = now()
        WHERE id = $1 AND is_active = TRUE
        RETURNING {CLIENT_COLUMNS}
        "#
    );
    match sqlx::query_as::<_, ClientUser>(&query)
        .bind(claims.sub)
        .bind(req.full_name.as_deref())
        .bind(req.phone.as_deref())
        .bind(req.avatar.as_deref())
        .bind(req.search_preferences)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => common::ok("Profile updated", ClientResponse::from(client)),
        Ok(None) => common::not_found("Account not found"),
        Err(error) => common::server_error(error),
    }
}

/// POST /client/auth/verify-email — confirm the email using the token from the
/// emailed link. Idempotent: verifying an already-verified account still 200s.
pub async fn verify_email(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<VerifyEmailRequest>,
) -> impl Responder {
    let claims = match verify_email_verification_token(payload.token.trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "email_verify" => claims,
        _ => return common::bad_request("This verification link is invalid or has expired"),
    };

    match sqlx::query(
        "UPDATE client_users SET email_verified = TRUE, updated_at = now() WHERE id = $1",
    )
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("Email verified successfully.", json!({}))
        }
        Ok(_) => common::bad_request("This verification link is invalid or has expired"),
        Err(error) => common::server_error(error),
    }
}

/// POST /client/auth/resend-verification — re-send the confirmation email. Always
/// replies the same way (never reveals whether the email exists).
pub async fn resend_verification(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>,
    payload: web::Json<ResendVerificationRequest>,
) -> impl Responder {
    let email = payload.email.trim().to_lowercase();
    let generic = "If that account exists and is unverified, a new link has been sent.";

    let query = format!(
        "SELECT {CLIENT_COLUMNS} FROM client_users WHERE email = $1 AND is_active = TRUE LIMIT 1"
    );
    match sqlx::query_as::<_, ClientUser>(&query)
        .bind(&email)
        .fetch_optional(pool.get_ref())
        .await
    {
        // Only bother emailing if the account exists and isn't already verified.
        Ok(Some(client)) if !client.email_verified => {
            send_verification_email(&config, &mailer, &client).await;
        }
        Ok(_) => {}
        Err(error) => return common::server_error(error),
    }

    common::ok(generic, json!({}))
}
