use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::contact_dto::{ContactMessageRequest, MessageStatusRequest},
    handlers::common,
    models::contact_message::ContactMessage,
    services::push_notification_service::{self, PushLeadAlert},
    utils::pagination::{PaginationQuery, make_pagination_meta},
};

const MESSAGE_COLUMNS: &str = r#"
    id,
    full_name,
    email,
    phone,
    service_interested_in,
    message,
    status,
    created_at,
    updated_at
"#;

fn message_select() -> String {
    format!("SELECT {MESSAGE_COLUMNS} FROM contact_messages")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid message id"))
}

pub async fn create_public(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<ContactMessageRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let query = format!(
        r#"
        INSERT INTO contact_messages (
          id, full_name, email, phone, service_interested_in, message, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'unread')
        RETURNING {MESSAGE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, ContactMessage>(&query)
        .bind(id)
        .bind(request.full_name)
        .bind(request.email)
        .bind(request.phone)
        .bind(request.service_interested_in)
        .bind(request.message)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(message) => {
            let lead_context = message
                .service_interested_in
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(|value| format!(" about {value}"))
                .unwrap_or_default();
            let alert = PushLeadAlert::new(
                "New enquiry on Sureboy Realty",
                format!(
                    "{} sent a contact message{lead_context}.",
                    message.full_name
                ),
                format!("{}/messages/{}", config.admin_base_path, message.id),
            );

            push_notification_service::spawn_lead_alert(
                pool.get_ref().clone(),
                config.get_ref().clone(),
                alert,
            );

            common::created("Contact message sent successfully", message)
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
        FROM contact_messages
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR service_interested_in ILIKE $1 OR message ILIKE $1)
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
        WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR service_interested_in ILIKE $1 OR message ILIKE $1)
          AND ($2::TEXT IS NULL OR status = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#,
        message_select()
    );

    match sqlx::query_as::<_, ContactMessage>(&list_query)
        .bind(search)
        .bind(status)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(messages) => common::list(
            "Admin messages fetched successfully",
            messages,
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
    let query = format!("{} WHERE id = $1 LIMIT 1", message_select());

    match sqlx::query_as::<_, ContactMessage>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(message)) => common::ok("Admin message fetched successfully", message),
        Ok(None) => common::not_found("Message not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn mark_read_admin(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE contact_messages
        SET status = 'read',
            updated_at = now()
        WHERE id = $1
        RETURNING {MESSAGE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, ContactMessage>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(message)) => common::ok("Message marked as read", message),
        Ok(None) => common::not_found("Message not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_status_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<MessageStatusRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE contact_messages
        SET status = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING {MESSAGE_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, ContactMessage>(&query)
        .bind(id)
        .bind(payload.status.clone())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(message)) => common::ok("Message status updated successfully", message),
        Ok(None) => common::not_found("Message not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };

    match sqlx::query("DELETE FROM contact_messages WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("Message deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Message not found"),
        Err(error) => common::server_error(error),
    }
}
