use actix_web::{Responder, web};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    config::AppConfig, db::DbPool, dto::about_dto::AboutContentRequest, handlers::common,
    models::about_content::AboutContent, utils::media_cleanup::cleanup_unused_uploads,
};

const ABOUT_SELECT: &str = "SELECT id, content, created_at, updated_at FROM about_content";

// The uploaded images referenced inside the About JSON blob, so replaced files
// can be cleaned up when the admin swaps them out.
fn about_media_refs(content: &Value) -> Vec<String> {
    let mut refs = Vec::new();
    if let Some(image) = content.pointer("/hero/image").and_then(Value::as_str) {
        refs.push(image.to_string());
    }
    if let Some(photo) = content.pointer("/founder/photo").and_then(Value::as_str) {
        refs.push(photo.to_string());
    }
    if let Some(og) = content.pointer("/seo/ogImage").and_then(Value::as_str) {
        refs.push(og.to_string());
    }
    refs
}

async fn fetch_about(pool: &DbPool) -> Result<Option<AboutContent>, sqlx::Error> {
    let query = format!("{ABOUT_SELECT} ORDER BY created_at ASC LIMIT 1");
    sqlx::query_as::<_, AboutContent>(&query)
        .fetch_optional(pool)
        .await
}

pub async fn get_public(pool: web::Data<DbPool>) -> impl Responder {
    match fetch_about(pool.get_ref()).await {
        Ok(Some(about)) => common::ok("About content fetched successfully", about),
        // No row yet: return null so the frontend falls back to its bundled copy.
        Ok(None) => common::ok("About content not set", serde_json::Value::Null),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin(pool: web::Data<DbPool>) -> impl Responder {
    match fetch_about(pool.get_ref()).await {
        Ok(Some(about)) => common::ok("About content fetched successfully", about),
        Ok(None) => common::ok("About content not set", serde_json::Value::Null),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<AboutContentRequest>,
) -> impl Responder {
    let request = payload.into_inner();

    let existing = match fetch_about(pool.get_ref()).await {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let old_refs = existing
        .as_ref()
        .map(|about| about_media_refs(&about.content))
        .unwrap_or_default();

    let saved = if let Some(existing) = existing {
        let query = "UPDATE about_content SET content = $2, updated_at = now() WHERE id = $1 RETURNING id, content, created_at, updated_at";
        sqlx::query_as::<_, AboutContent>(query)
            .bind(existing.id)
            .bind(request.content)
            .fetch_one(pool.get_ref())
            .await
    } else {
        let query = "INSERT INTO about_content (id, content) VALUES ($1, $2) RETURNING id, content, created_at, updated_at";
        sqlx::query_as::<_, AboutContent>(query)
            .bind(Uuid::new_v4())
            .bind(request.content)
            .fetch_one(pool.get_ref())
            .await
    };

    match saved {
        Ok(about) => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                old_refs,
                about_media_refs(&about.content),
            )
            .await;
            common::ok("About content saved successfully", about)
        }
        Err(error) => common::server_error(error),
    }
}
