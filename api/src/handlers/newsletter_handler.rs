use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::newsletter_dto::{NewsletterRequest, NewsletterStatusRequest},
    handlers::common,
    models::newsletter_subscriber::NewsletterSubscriber,
    services::push_notification_service::{self, PushLeadAlert},
    utils::pagination::{PaginationQuery, make_pagination_meta},
};

const SUBSCRIBER_COLUMNS: &str = r#"
    id,
    email,
    status,
    created_at,
    updated_at
"#;

fn subscriber_select() -> String {
    format!("SELECT {SUBSCRIBER_COLUMNS} FROM newsletter_subscribers")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid subscriber id"))
}

pub async fn subscribe_public(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<NewsletterRequest>,
) -> impl Responder {
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO newsletter_subscribers (id, email, status)
        VALUES ($1, $2, 'active')
        RETURNING {SUBSCRIBER_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, NewsletterSubscriber>(&query)
        .bind(id)
        .bind(payload.email.trim())
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(subscriber) => {
            let alert = PushLeadAlert::new(
                "New newsletter subscriber",
                format!("{} subscribed to Sureboy Realty updates.", subscriber.email),
                format!("{}/newsletter", config.admin_base_path),
            );

            push_notification_service::spawn_lead_alert(
                pool.get_ref().clone(),
                config.get_ref().clone(),
                alert,
            );

            common::created("Newsletter subscription successful", subscriber)
        }
        Err(error) => common::server_error(error),
    }
}

pub async fn list_admin(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let search = params.search_pattern();
    let status = params
        .status
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let count_query = r#"
        SELECT COUNT(*)
        FROM newsletter_subscribers
        WHERE ($1::TEXT IS NULL OR email ILIKE $1)
          AND ($2::TEXT IS NULL OR status = $2)
    "#;
    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(status.clone())
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };
    let list_query = format!(
        r#"
        {}
        WHERE ($1::TEXT IS NULL OR email ILIKE $1)
          AND ($2::TEXT IS NULL OR status = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        subscriber_select()
    );

    match sqlx::query_as::<_, NewsletterSubscriber>(&list_query)
        .bind(search)
        .bind(status)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(subscribers) => common::list(
            "Newsletter subscribers fetched successfully",
            subscribers,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match sqlx::query("DELETE FROM newsletter_subscribers WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("Subscriber deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Subscriber not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_status_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<NewsletterStatusRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE newsletter_subscribers
        SET status = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING {SUBSCRIBER_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, NewsletterSubscriber>(&query)
        .bind(id)
        .bind(payload.status.clone())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(subscriber)) => common::ok("Subscriber status updated successfully", subscriber),
        Ok(None) => common::not_found("Subscriber not found"),
        Err(error) => common::server_error(error),
    }
}
