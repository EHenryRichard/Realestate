use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::testimonial_dto::TestimonialRequest,
    handlers::common,
    models::testimonial::Testimonial,
    utils::{
        media_cleanup::cleanup_unused_uploads,
        pagination::{PaginationQuery, make_pagination_meta},
    },
};

const TESTIMONIAL_COLUMNS: &str = r#"
    id,
    client_name,
    client_role,
    service_used,
    rating,
    quote,
    avatar,
    is_visible,
    created_at,
    updated_at
"#;

fn testimonial_select() -> String {
    format!("SELECT {TESTIMONIAL_COLUMNS} FROM testimonials")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid testimonial id"))
}

async fn fetch_testimonial_by_id(
    pool: &DbPool,
    id: Uuid,
) -> Result<Option<Testimonial>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", testimonial_select());

    sqlx::query_as::<_, Testimonial>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

fn testimonial_media_refs(testimonial: &Testimonial) -> Vec<String> {
    testimonial.avatar.clone().into_iter().collect()
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE ORDER BY created_at DESC",
        testimonial_select()
    );

    match sqlx::query_as::<_, Testimonial>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(testimonials) => common::ok("Visible testimonials fetched successfully", testimonials),
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
        FROM testimonials
        WHERE ($1::TEXT IS NULL OR client_name ILIKE $1 OR quote ILIKE $1 OR service_used ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_visible = $2)
    "#;
    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(params.is_visible)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };
    let list_query = format!(
        r#"
        {}
        WHERE ($1::TEXT IS NULL OR client_name ILIKE $1 OR quote ILIKE $1 OR service_used ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_visible = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        testimonial_select()
    );

    match sqlx::query_as::<_, Testimonial>(&list_query)
        .bind(search)
        .bind(params.is_visible)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(testimonials) => common::list(
            "Admin testimonials fetched successfully",
            testimonials,
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
    let query = format!("{} WHERE id = $1 LIMIT 1", testimonial_select());

    match sqlx::query_as::<_, Testimonial>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(testimonial)) => common::ok("Admin testimonial fetched successfully", testimonial),
        Ok(None) => common::not_found("Testimonial not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<TestimonialRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO testimonials (
          id, client_name, client_role, service_used, rating, quote, avatar, is_visible
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING {TESTIMONIAL_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Testimonial>(&query)
        .bind(id)
        .bind(request.client_name)
        .bind(request.client_role)
        .bind(request.service_used)
        .bind(request.rating)
        .bind(request.quote)
        .bind(request.avatar)
        .bind(request.is_visible.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(testimonial) => common::created("Testimonial created successfully", testimonial),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<TestimonialRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_testimonial = match fetch_testimonial_by_id(pool.get_ref(), id).await {
        Ok(Some(testimonial)) => testimonial,
        Ok(None) => return common::not_found("Testimonial not found"),
        Err(error) => return common::server_error(error),
    };
    let request = payload.into_inner();
    let query = format!(
        r#"
        UPDATE testimonials
        SET client_name = $2,
            client_role = $3,
            service_used = $4,
            rating = $5,
            quote = $6,
            avatar = $7,
            is_visible = $8,
            updated_at = now()
        WHERE id = $1
        RETURNING {TESTIMONIAL_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Testimonial>(&query)
        .bind(id)
        .bind(request.client_name)
        .bind(request.client_role)
        .bind(request.service_used)
        .bind(request.rating)
        .bind(request.quote)
        .bind(request.avatar)
        .bind(request.is_visible.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(testimonial)) => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                testimonial_media_refs(&old_testimonial),
                testimonial_media_refs(&testimonial),
            )
            .await;
            common::ok("Testimonial updated successfully", testimonial)
        }
        Ok(None) => common::not_found("Testimonial not found"),
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
    let old_testimonial = match fetch_testimonial_by_id(pool.get_ref(), id).await {
        Ok(Some(testimonial)) => testimonial,
        Ok(None) => return common::not_found("Testimonial not found"),
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("DELETE FROM testimonials WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                testimonial_media_refs(&old_testimonial),
                Vec::new(),
            )
            .await;
            common::ok("Testimonial deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Testimonial not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn toggle_visible_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE testimonials
        SET is_visible = NOT is_visible,
            updated_at = now()
        WHERE id = $1
        RETURNING {TESTIMONIAL_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Testimonial>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(testimonial)) => common::ok("Testimonial visible status updated", testimonial),
        Ok(None) => common::not_found("Testimonial not found"),
        Err(error) => common::server_error(error),
    }
}
