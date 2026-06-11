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

fn is_public_admin_auth_path(method: &Method, path: &str) -> bool {
    if method == Method::OPTIONS {
        return true;
    }

    matches!(
        (method.as_str(), path),
        ("POST", "/api/admin/auth/signup")
            | ("POST", "/api/admin/auth/login")
            | ("POST", "/api/admin/auth/refresh")
            | ("POST", "/api/admin/auth/logout")
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

fn agent_can_access(method: &Method, path: &str) -> bool {
    if method == Method::OPTIONS {
        return true;
    }

    if method == Method::GET && matches!(path, "/api/admin/auth/me" | "/api/admin/dashboard") {
        return true;
    }

    if path.starts_with("/api/admin/properties") {
        return true;
    }

    if path.starts_with("/api/admin/uploads") {
        return method == Method::POST || method == Method::DELETE;
    }

    if path.starts_with("/api/admin/messages") {
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
    if is_public_admin_auth_path(req.method(), req.path()) {
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
    let Some(token) = bearer_token(&req) else {
        let response = unauthorized_response("Missing admin token").map_into_right_body();
        return Ok(req.into_response(response));
    };

    match verify_token(&token, &config.jwt_secret) {
        Ok(claims) if claims.token_type == "access" => {
            if claims.role != "admin" && !agent_can_access(req.method(), req.path()) {
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
