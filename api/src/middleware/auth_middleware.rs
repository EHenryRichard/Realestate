use actix_web::{
    Error, HttpMessage, HttpResponse,
    body::{EitherBody, MessageBody},
    dev::{ServiceRequest, ServiceResponse},
    http::Method,
    middleware::Next,
    web,
};
use serde_json::json;

use crate::{config::AppConfig, utils::jwt::verify_token};

fn admin_api_path(admin_api_path: &str, suffix: &str) -> String {
    format!("/api{}{}", admin_api_path, suffix)
}

fn admin_api_suffix<'a>(path: &'a str, admin_api_prefix: &str) -> Option<&'a str> {
    path.strip_prefix(&format!("/api{admin_api_prefix}"))
}

/// The admin API is otherwise locked behind `require_admin_access`. These few
/// auth endpoints must stay reachable *without* a token — you can't log in or
/// reset a password if you're required to already be logged in. This returns
/// true for exactly those public POST endpoints so the guard lets them through.
fn is_public_admin_auth_path(method: &Method, path: &str, admin_api_prefix: &str) -> bool {
    // All of these are POSTs; anything else stays protected.
    if method != Method::POST {
        return false;
    }

    // `admin_api_suffix` strips the secret admin prefix so we compare the stable
    // tail (e.g. "/auth/login"). forgot/reset-password were added for the
    // password-reset flow, which must work while logged out.
    matches!(
        admin_api_suffix(path, admin_api_prefix),
        Some(
            "/auth/signup"
                | "/auth/login"
                | "/auth/refresh"
                | "/auth/logout"
                | "/auth/forgot-password"
                | "/auth/reset-password"
        )
    )
}

fn bearer_token(request: &ServiceRequest) -> Option<String> {
    request
        .headers()
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn unauthorized_response(message: &str) -> HttpResponse {
    HttpResponse::Unauthorized().json(json!({
        "success": false,
        "message": message
    }))
}

fn forbidden_response(message: &str) -> HttpResponse {
    HttpResponse::Forbidden().json(json!({
        "success": false,
        "message": message
    }))
}

fn agent_can_access(method: &Method, path: &str, admin_api_prefix: &str) -> bool {
    if method == Method::GET
        && (path == admin_api_path(admin_api_prefix, "/auth/me")
            || path == admin_api_path(admin_api_prefix, "/dashboard"))
    {
        return true;
    }

    if path.starts_with(&admin_api_path(admin_api_prefix, "/properties")) {
        return true;
    }

    if path.starts_with(&admin_api_path(admin_api_prefix, "/uploads")) {
        return method == Method::POST || method == Method::DELETE;
    }

    if path.starts_with(&admin_api_path(admin_api_prefix, "/messages")) {
        return method == Method::GET || method == Method::PATCH;
    }

    false
}

pub async fn require_admin_access<B>(
    req: ServiceRequest,
    next: Next<B>,
) -> Result<ServiceResponse<EitherBody<B>>, Error>
where
    B: MessageBody + 'static,
{
    if req.method() == Method::OPTIONS {
        return next
            .call(req)
            .await
            .map(ServiceResponse::map_into_left_body);
    }

    let Some(config) = req.app_data::<web::Data<AppConfig>>().cloned() else {
        let response =
            unauthorized_response("Admin auth configuration is missing").map_into_right_body();
        return Ok(req.into_response(response));
    };

    if is_public_admin_auth_path(req.method(), req.path(), &config.admin_api_path) {
        return next
            .call(req)
            .await
            .map(ServiceResponse::map_into_left_body);
    }

    let Some(token) = bearer_token(&req) else {
        let response = unauthorized_response("Missing admin token").map_into_right_body();
        return Ok(req.into_response(response));
    };

    match verify_token(&token, &config.jwt_secret) {
        Ok(claims) if claims.token_type == "access" => {
            if claims.role != "admin"
                && !agent_can_access(req.method(), req.path(), &config.admin_api_path)
            {
                let response = forbidden_response("This admin role cannot access this resource")
                    .map_into_right_body();
                return Ok(req.into_response(response));
            }

            req.extensions_mut().insert(claims);
            next.call(req)
                .await
                .map(ServiceResponse::map_into_left_body)
        }
        Ok(_) => {
            let response =
                unauthorized_response("Invalid admin access token").map_into_right_body();
            Ok(req.into_response(response))
        }
        Err(_) => {
            let response = unauthorized_response("Invalid admin token").map_into_right_body();
            Ok(req.into_response(response))
        }
    }
}
