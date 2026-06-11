use actix_web::Responder;
use serde_json::json;

use crate::handlers::common;

pub async fn health() -> impl Responder {
    common::ok(
        "Sureboy Realty API is healthy",
        json!({
            "status": "ok",
            "service": "sureboy-realty-api"
        }),
    )
}
