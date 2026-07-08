// admin_client_handler.rs
// ─────────────────────────────────────────────────────────────────────────────
// Admin-side management of PUBLIC (client) accounts — the people who sign up on
// the website. Lets admins list, view, edit, activate/deactivate, and delete
// client users. Mounted under the admin scope, so the auth middleware already
// restricts these to admins (agents are blocked). Both super admins have access.
// ─────────────────────────────────────────────────────────────────────────────

use actix_web::{Responder, web};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    db::DbPool,
    dto::client_dto::AdminUpdateClientRequest,
    handlers::common,
    utils::pagination::{PaginationQuery, make_pagination_meta},
};

/// One row in the admin users table.
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct AdminClientListItem {
    id: Uuid,
    full_name: String,
    email: String,
    phone: Option<String>,
    email_verified: bool,
    is_active: bool,
    created_at: DateTime<Utc>,
}

/// A single client with their activity counts (for the detail view).
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct AdminClientDetail {
    id: Uuid,
    full_name: String,
    email: String,
    phone: Option<String>,
    email_verified: bool,
    phone_verified: bool,
    is_active: bool,
    avatar: Option<String>,
    created_at: DateTime<Utc>,
    saved_count: i64,
    viewed_count: i64,
    inquiry_count: i64,
    /// Number of browsers/devices this user has subscribed for push (0 = not subscribed).
    push_count: i64,
}

const LIST_COLUMNS: &str = "id, full_name, email, phone, email_verified, is_active, created_at";

/// GET /users — paginated, searchable list of client accounts.
pub async fn list_clients(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let search = params.search_pattern(); // "%term%" or None

    // Total (for pagination). `$1::TEXT IS NULL` = no search → match everything.
    let total = match sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM client_users \
         WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1)",
    )
    .bind(search.clone())
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };

    let list_query = format!(
        "SELECT {LIST_COLUMNS} FROM client_users \
         WHERE ($1::TEXT IS NULL OR full_name ILIKE $1 OR email ILIKE $1) \
         ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    );
    match sqlx::query_as::<_, AdminClientListItem>(&list_query)
        .bind(search)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(rows) => common::list(
            "Users fetched",
            rows,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

/// GET /users/{id} — one client plus their saved / viewed / inquiry counts.
pub async fn get_client(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid user id"),
    };

    let query = r#"
        SELECT c.id, c.full_name, c.email, c.phone, c.email_verified, c.phone_verified,
               c.is_active, c.avatar, c.created_at,
               (SELECT COUNT(*) FROM saved_properties  s WHERE s.client_id = c.id) AS saved_count,
               (SELECT COUNT(*) FROM property_views    v WHERE v.client_id = c.id) AS viewed_count,
               (SELECT COUNT(*) FROM inquiries         i WHERE i.client_id = c.id) AS inquiry_count,
               (SELECT COUNT(*) FROM push_subscriptions p WHERE p.client_id = c.id) AS push_count
        FROM client_users c
        WHERE c.id = $1
        LIMIT 1
    "#;
    match sqlx::query_as::<_, AdminClientDetail>(query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => common::ok("User fetched", client),
        Ok(None) => common::not_found("User not found"),
        Err(error) => common::server_error(error),
    }
}

/// PATCH /users/{id} — edit a client (name, phone, active, verified flags).
pub async fn update_client(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<AdminUpdateClientRequest>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid user id"),
    };
    let req = payload.into_inner();

    // COALESCE keeps existing values for fields the admin didn't send.
    let query = format!(
        "UPDATE client_users SET \
            full_name      = COALESCE($2, full_name), \
            phone          = COALESCE($3, phone), \
            is_active      = COALESCE($4, is_active), \
            email_verified = COALESCE($5, email_verified), \
            updated_at     = now() \
         WHERE id = $1 \
         RETURNING {LIST_COLUMNS}"
    );
    match sqlx::query_as::<_, AdminClientListItem>(&query)
        .bind(id)
        .bind(req.full_name.as_deref())
        .bind(req.phone.as_deref())
        .bind(req.is_active)
        .bind(req.email_verified)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => common::ok("User updated", client),
        Ok(None) => common::not_found("User not found"),
        Err(error) => common::server_error(error),
    }
}

/// PATCH /users/{id}/toggle — flip a client between active and inactive.
pub async fn toggle_client_active(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid user id"),
    };

    let query = format!(
        "UPDATE client_users SET is_active = NOT is_active, updated_at = now() \
         WHERE id = $1 RETURNING {LIST_COLUMNS}"
    );
    match sqlx::query_as::<_, AdminClientListItem>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(client)) => common::ok("Status updated", client),
        Ok(None) => common::not_found("User not found"),
        Err(error) => common::server_error(error),
    }
}

/// DELETE /users/{id} — permanently remove a client. Their saved/viewed rows
/// cascade-delete; inquiries keep the record but null out the client link.
pub async fn delete_client(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match Uuid::parse_str(&path.into_inner()) {
        Ok(id) => id,
        Err(_) => return common::bad_request("Invalid user id"),
    };

    match sqlx::query("DELETE FROM client_users WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            common::ok("User removed", serde_json::json!({ "id": id }))
        }
        Ok(_) => common::not_found("User not found"),
        Err(error) => common::server_error(error),
    }
}
