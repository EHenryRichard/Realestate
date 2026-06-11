use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::service_dto::ServiceRequest,
    handlers::common,
    models::service::Service,
    utils::{
        media_cleanup::cleanup_unused_uploads,
        pagination::{PaginationQuery, make_pagination_meta},
        slug::slugify,
    },
};

const SERVICE_COLUMNS: &str = r#"
    id,
    title,
    slug,
    short_description,
    full_description,
    icon_key,
    image,
    features,
    cta_text,
    link,
    is_active,
    sort_order,
    created_at,
    updated_at
"#;

fn service_select() -> String {
    format!("SELECT {SERVICE_COLUMNS} FROM services")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid service id"))
}

async fn fetch_service_by_id(pool: &DbPool, id: Uuid) -> Result<Option<Service>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", service_select());

    sqlx::query_as::<_, Service>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

fn service_media_refs(service: &Service) -> Vec<String> {
    service.image.clone().into_iter().collect()
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC",
        service_select()
    );

    match sqlx::query_as::<_, Service>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(services) => common::ok("Active services fetched successfully", services),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_public_by_slug(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let query = format!(
        "{} WHERE slug = $1 AND is_active = TRUE LIMIT 1",
        service_select()
    );

    match sqlx::query_as::<_, Service>(&query)
        .bind(path.into_inner())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(service)) => common::ok("Service fetched successfully", service),
        Ok(None) => common::not_found("Service not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn list_admin(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let search = params.search_pattern();
    let count_query = r#"
        SELECT COUNT(*)
        FROM services
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR short_description ILIKE $1 OR full_description ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_active = $2)
    "#;
    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(params.is_active)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };
    let list_query = format!(
        r#"
        {}
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR short_description ILIKE $1 OR full_description ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_active = $2)
        ORDER BY sort_order ASC, created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        service_select()
    );

    match sqlx::query_as::<_, Service>(&list_query)
        .bind(search)
        .bind(params.is_active)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(services) => common::list(
            "Admin services fetched successfully",
            services,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin_by_id(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!("{} WHERE id = $1 LIMIT 1", service_select());

    match sqlx::query_as::<_, Service>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(service)) => common::ok("Admin service fetched successfully", service),
        Ok(None) => common::not_found("Service not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<ServiceRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let slug = request
        .slug
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| slugify(&request.title));
    let features = json!(request.features.unwrap_or_default());
    let query = format!(
        r#"
        INSERT INTO services (
          id, title, slug, short_description, full_description, icon_key, image,
          features, cta_text, link, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING {SERVICE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Service>(&query)
        .bind(id)
        .bind(request.title)
        .bind(slug)
        .bind(request.short_description)
        .bind(request.full_description)
        .bind(request.icon_key)
        .bind(request.image)
        .bind(features)
        .bind(request.cta_text)
        .bind(request.link)
        .bind(request.is_active.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(service) => common::created("Service created successfully", service),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<ServiceRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_service = match fetch_service_by_id(pool.get_ref(), id).await {
        Ok(Some(service)) => service,
        Ok(None) => return common::not_found("Service not found"),
        Err(error) => return common::server_error(error),
    };
    let request = payload.into_inner();
    let slug = request
        .slug
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| slugify(&request.title));
    let features = json!(request.features.unwrap_or_default());
    let query = format!(
        r#"
        UPDATE services
        SET title = $2,
            slug = $3,
            short_description = $4,
            full_description = $5,
            icon_key = $6,
            image = $7,
            features = $8,
            cta_text = $9,
            link = $10,
            is_active = $11,
            updated_at = now()
        WHERE id = $1
        RETURNING {SERVICE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Service>(&query)
        .bind(id)
        .bind(request.title)
        .bind(slug)
        .bind(request.short_description)
        .bind(request.full_description)
        .bind(request.icon_key)
        .bind(request.image)
        .bind(features)
        .bind(request.cta_text)
        .bind(request.link)
        .bind(request.is_active.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(service)) => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                service_media_refs(&old_service),
                service_media_refs(&service),
            )
            .await;
            common::ok("Service updated successfully", service)
        }
        Ok(None) => common::not_found("Service not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_service = match fetch_service_by_id(pool.get_ref(), id).await {
        Ok(Some(service)) => service,
        Ok(None) => return common::not_found("Service not found"),
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("DELETE FROM services WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                service_media_refs(&old_service),
                Vec::new(),
            )
            .await;
            common::ok("Service deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Service not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn toggle_active_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE services
        SET is_active = NOT is_active,
            updated_at = now()
        WHERE id = $1
        RETURNING {SERVICE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Service>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(service)) => common::ok("Service active status updated", service),
        Ok(None) => common::not_found("Service not found"),
        Err(error) => common::server_error(error),
    }
}
