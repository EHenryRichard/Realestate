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
    dto::auth_dto::{AdminResponse, AuthSessionResponse, LoginRequest, RegisterAdminRequest},
    handlers::common,
    models::admin_user::AdminUser,
    utils::{
        jwt::{create_access_token, create_refresh_token, expiry_seconds, verify_token},
        pagination::{PaginationQuery, make_pagination_meta},
        password::{hash_password, verify_password},
    },
};

const REFRESH_COOKIE_NAME: &str = "sureboy_refresh_token";

const ADMIN_COLUMNS: &str = r#"
    id,
    full_name,
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
"#;

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

async fn insert_admin_user(
    pool: &DbPool,
    payload: RegisterAdminRequest,
    default_role: &str,
) -> Result<AdminUser, sqlx::Error> {
    let password_hash = hash_password(&payload.password)
        .map_err(|error| sqlx::Error::Protocol(error.to_string()))?;
    let role = payload
        .role
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| default_role.to_string())
        .trim()
        .to_lowercase();
    let query = format!(
        r#"
        INSERT INTO admin_users (id, full_name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING {ADMIN_COLUMNS}
        "#
    );

    sqlx::query_as::<_, AdminUser>(&query)
        .bind(Uuid::new_v4())
        .bind(payload.full_name.trim())
        .bind(payload.email.trim().to_lowercase())
        .bind(password_hash)
        .bind(role)
        .fetch_one(pool)
        .await
}

fn auth_response(config: &AppConfig, admin: AdminUser, message: &str) -> actix_web::HttpResponse {
    let access_token = create_access_token(
        admin.id,
        &admin.email,
        &admin.role,
        &config.jwt_secret,
        &config.jwt_access_expires_in,
    );
    let refresh_token = create_refresh_token(
        admin.id,
        &admin.email,
        &admin.role,
        &config.jwt_secret,
        &config.jwt_refresh_expires_in,
    );

    match (access_token, refresh_token) {
        (Ok(access_token), Ok(refresh_token)) => {
            let data = AuthSessionResponse {
                access_token,
                admin: AdminResponse::from(&admin),
            };

            HttpResponse::Ok()
                .cookie(refresh_cookie(config, refresh_token))
                .json(json!({
                    "success": true,
                    "message": message,
                    "data": data
                }))
        }
        (Err(error), _) | (_, Err(error)) => common::server_error(error),
    }
}

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

fn clear_refresh_cookie(config: &AppConfig) -> Cookie<'static> {
    Cookie::build(REFRESH_COOKIE_NAME, "")
        .http_only(true)
        .secure(config.refresh_cookie_secure)
        .same_site(SameSite::Lax)
        .path(admin_auth_cookie_path(config))
        .max_age(CookieDuration::seconds(0))
        .finish()
}

fn admin_auth_cookie_path(config: &AppConfig) -> String {
    format!("/api{}/auth", config.admin_api_path)
}

fn require_access_claims(
    config: &AppConfig,
    request: &HttpRequest,
) -> Result<crate::utils::jwt::JwtClaims, actix_web::HttpResponse> {
    let Some(token) = bearer_token(request) else {
        return Err(common::unauthorized("Missing admin token"));
    };
    let claims = verify_token(&token, &config.jwt_secret)
        .map_err(|_| common::unauthorized("Invalid admin token"))?;

    if claims.token_type != "access" {
        return Err(common::unauthorized("Invalid admin access token"));
    }

    Ok(claims)
}

fn require_admin_token(
    config: &AppConfig,
    request: &HttpRequest,
) -> Result<(), actix_web::HttpResponse> {
    let claims = require_access_claims(config, request)?;

    if claims.role != "admin" {
        return Err(common::unauthorized("Only admins can manage agents"));
    }

    Ok(())
}

pub async fn signup(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<RegisterAdminRequest>,
) -> impl Responder {
    let existing_admins = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM admin_users")
        .fetch_one(pool.get_ref())
        .await;

    match existing_admins {
        Ok(count) if count > 0 => {
            return common::bad_request(
                "Initial admin already exists. Login and register agents from the dashboard.",
            );
        }
        Err(error) => return common::server_error(error),
        _ => {}
    }

    let mut request = payload.into_inner();
    request.role = Some("admin".to_string());

    match insert_admin_user(pool.get_ref(), request, "admin").await {
        Ok(admin) => auth_response(&config, admin, "Admin signup successful"),
        Err(error) => common::server_error(error),
    }
}

pub async fn login(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<LoginRequest>,
) -> impl Responder {
    if payload.email.trim().is_empty() || payload.password.trim().is_empty() {
        return common::bad_request("Email and password are required");
    }

    let query = format!(
        r#"
        SELECT {ADMIN_COLUMNS}
        FROM admin_users
        WHERE email = $1
        LIMIT 1
        "#
    );
    let admin = sqlx::query_as::<_, AdminUser>(&query)
        .bind(payload.email.trim().to_lowercase())
        .fetch_optional(pool.get_ref())
        .await;

    match admin {
        Ok(Some(admin))
            if admin.is_active
                && verify_password(payload.password.trim(), &admin.password_hash) =>
        {
            auth_response(&config, admin, "Login successful")
        }
        Ok(_) => common::unauthorized("Invalid admin credentials"),
        Err(error) => common::server_error(error),
    }
}

pub async fn me(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let claims = match require_access_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => common::ok("Admin profile fetched", AdminResponse::from(admin)),
        Ok(None) => common::unauthorized("Admin account not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn refresh(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let Some(refresh_cookie) = request.cookie(REFRESH_COOKIE_NAME) else {
        return common::unauthorized("Missing refresh token");
    };
    let claims = match verify_token(refresh_cookie.value().trim(), &config.jwt_secret) {
        Ok(claims) if claims.token_type == "refresh" => claims,
        Ok(_) => return common::unauthorized("Invalid refresh token type"),
        Err(_) => return common::unauthorized("Invalid refresh token"),
    };
    let query = format!(
        "SELECT {ADMIN_COLUMNS} FROM admin_users WHERE id = $1 AND is_active = TRUE LIMIT 1"
    );

    match sqlx::query_as::<_, AdminUser>(&query)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(admin)) => auth_response(&config, admin, "Session refreshed successfully"),
        Ok(None) => common::unauthorized("Admin account not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn list_agents(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    let params = query.into_inner();
    let search = params.search_pattern();
    let role = params
        .role
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let count_query = r#"
        SELECT COUNT(*)
        FROM admin_users
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
        SELECT {ADMIN_COLUMNS}
        FROM admin_users
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1)
          AND ($2::TEXT IS NULL OR role = $2)
          AND ($3::BOOLEAN IS NULL OR is_active = $3)
        ORDER BY created_at DESC
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
            "Agents fetched successfully",
            agents
                .into_iter()
                .map(AdminResponse::from)
                .collect::<Vec<AdminResponse>>(),
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn register_agent(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<RegisterAdminRequest>,
) -> impl Responder {
    if let Err(response) = require_admin_token(&config, &request) {
        return response;
    }

    match insert_admin_user(pool.get_ref(), payload.into_inner(), "agent").await {
        Ok(agent) => common::created("Agent registered successfully", AdminResponse::from(agent)),
        Err(error) => common::server_error(error),
    }
}

pub async fn logout(config: web::Data<AppConfig>) -> impl Responder {
    HttpResponse::Ok()
        .cookie(clear_refresh_cookie(&config))
        .json(json!({
            "success": true,
            "message": "Logout successful",
            "data": {}
        }))
}
