use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::DbPool,
    dto::faq_dto::FaqRequest,
    handlers::common,
    models::faq::Faq,
    utils::pagination::{PaginationQuery, make_pagination_meta},
};

const FAQ_COLUMNS: &str = r#"
    id,
    question,
    answer,
    sort_order,
    is_visible,
    created_at,
    updated_at
"#;

fn faq_select() -> String {
    format!("SELECT {FAQ_COLUMNS} FROM faqs")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid FAQ id"))
}

async fn fetch_faq_by_id(pool: &DbPool, id: Uuid) -> Result<Option<Faq>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", faq_select());
    sqlx::query_as::<_, Faq>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE AND answer IS NOT NULL AND trim(answer) <> '' ORDER BY sort_order ASC, created_at ASC",
        faq_select()
    );

    match sqlx::query_as::<_, Faq>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(faqs) => common::ok("FAQs fetched successfully", faqs),
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
        FROM faqs
        WHERE ($1::TEXT IS NULL OR question ILIKE $1 OR answer ILIKE $1)
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
        WHERE ($1::TEXT IS NULL OR question ILIKE $1 OR answer ILIKE $1)
          AND ($2::BOOLEAN IS NULL OR is_visible = $2)
        ORDER BY sort_order ASC, created_at ASC
        LIMIT $3 OFFSET $4
        "#,
        faq_select()
    );

    match sqlx::query_as::<_, Faq>(&list_query)
        .bind(search)
        .bind(params.is_visible)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(faqs) => common::list(
            "Admin FAQs fetched successfully",
            faqs,
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

    match fetch_faq_by_id(pool.get_ref(), id).await {
        Ok(Some(faq)) => common::ok("FAQ fetched successfully", faq),
        Ok(None) => common::not_found("FAQ not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<FaqRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO faqs (id, question, answer, sort_order, is_visible)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING {FAQ_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Faq>(&query)
        .bind(id)
        .bind(request.question)
        .bind(request.answer)
        .bind(request.sort_order.unwrap_or(0))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(faq) => common::created("FAQ created successfully", faq),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<FaqRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match fetch_faq_by_id(pool.get_ref(), id).await {
        Ok(None) => return common::not_found("FAQ not found"),
        Err(error) => return common::server_error(error),
        Ok(Some(_)) => {}
    }

    let request = payload.into_inner();
    let query = format!(
        r#"
        UPDATE faqs
        SET question    = $2,
            answer      = $3,
            sort_order  = $4,
            is_visible  = $5,
            updated_at  = now()
        WHERE id = $1
        RETURNING {FAQ_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Faq>(&query)
        .bind(id)
        .bind(request.question)
        .bind(request.answer)
        .bind(request.sort_order.unwrap_or(0))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(faq)) => common::ok("FAQ updated successfully", faq),
        Ok(None) => common::not_found("FAQ not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match fetch_faq_by_id(pool.get_ref(), id).await {
        Ok(None) => return common::not_found("FAQ not found"),
        Err(error) => return common::server_error(error),
        Ok(Some(_)) => {}
    }

    match sqlx::query("DELETE FROM faqs WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("FAQ deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("FAQ not found"),
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
        UPDATE faqs
        SET is_visible = NOT is_visible,
            updated_at = now()
        WHERE id = $1
        RETURNING {FAQ_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, Faq>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(faq)) => common::ok("FAQ visibility toggled", faq),
        Ok(None) => common::not_found("FAQ not found"),
        Err(error) => common::server_error(error),
    }
}
