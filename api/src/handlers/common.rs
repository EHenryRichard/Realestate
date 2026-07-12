use actix_web::HttpResponse;
use serde::Serialize;
use serde_json::json;

use crate::response::PaginationMeta;

pub fn ok<T: Serialize>(message: &str, data: T) -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": message,
        "data": data
    }))
}

pub fn list<T: Serialize>(message: &str, data: T, meta: PaginationMeta) -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "success": true,
        "message": message,
        "data": data,
        "meta": meta
    }))
}

pub fn created<T: Serialize>(message: &str, data: T) -> HttpResponse {
    HttpResponse::Created().json(json!({
        "success": true,
        "message": message,
        "data": data
    }))
}

pub fn bad_request(message: &str) -> HttpResponse {
    HttpResponse::BadRequest().json(json!({
        "success": false,
        "message": message
    }))
}

pub fn unauthorized(message: &str) -> HttpResponse {
    HttpResponse::Unauthorized().json(json!({
        "success": false,
        "message": message
    }))
}

pub fn forbidden(message: &str) -> HttpResponse {
    HttpResponse::Forbidden().json(json!({
        "success": false,
        "message": message
    }))
}

pub fn not_found(message: &str) -> HttpResponse {
    HttpResponse::NotFound().json(json!({
        "success": false,
        "message": message
    }))
}

pub fn server_error(error: impl std::fmt::Display) -> HttpResponse {
    HttpResponse::InternalServerError().json(json!({
        "success": false,
        "message": "Internal server error",
        "error": error.to_string()
    }))
}
