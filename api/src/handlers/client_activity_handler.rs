// client_activity_handler.rs
// ─────────────────────────────────────────────────────────────────────────────
// The data behind the client dashboard: saved properties, recently viewed, and
// inquiries ("contact an agent"). Every handler is client-only — it reuses
// `require_client_claims` from client_auth_handler to authenticate and to learn
// which client (`claims.sub`) is acting.
// ─────────────────────────────────────────────────────────────────────────────

use actix_web::{HttpRequest, Responder, web};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::{
        client_dto::CreateInquiryRequest,
        notification_dto::{PushSubscriptionRequest, PushUnsubscribeRequest},
    },
    handlers::{
        client_auth_handler::{require_client_claims, require_verified_client},
        common,
    },
    models::client_user::ClientUser,
};

/// A compact property summary for the dashboard lists. `at` is the save/view
/// timestamp. Note `price::float8` is cast in the queries so the NUMERIC column
/// decodes cleanly into `f64`.
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct PropertyCard {
    id: Uuid,
    title: String,
    slug: String,
    location: String,
    price: f64,
    currency: String,
    property_type: String,
    bedrooms: Option<i32>,
    bathrooms: Option<i32>,
    main_image: Option<String>,
    at: DateTime<Utc>,
}

/// A client's inquiry with the related property's title/slug (if still present).
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct InquiryItem {
    id: Uuid,
    property_id: Option<Uuid>,
    property_title: Option<String>,
    property_slug: Option<String>,
    message: String,
    status: String,
    created_at: DateTime<Utc>,
}

/// Small helper: authenticate the client (verified accounts only) and parse the
/// `{property_id}` path. Returns the client id and property id, or an error
/// response.
async fn client_and_property(
    config: &AppConfig,
    pool: &crate::db::DbPool,
    request: &HttpRequest,
    path: web::Path<String>,
) -> Result<(Uuid, Uuid), actix_web::HttpResponse> {
    let claims = require_verified_client(config, pool, request).await?;
    let property_id =
        Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid property id"))?;
    Ok((claims.sub, property_id))
}

// ─── Saved properties ───────────────────────────────────────────────────────────

/// POST /client/saved/{property_id} — bookmark a property. Idempotent: saving an
/// already-saved property is a no-op (ON CONFLICT DO NOTHING).
pub async fn save_property(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    let (client_id, property_id) = match client_and_property(&config, pool.get_ref(), &request, path).await {
        Ok(pair) => pair,
        Err(response) => return response,
    };

    match sqlx::query(
        "INSERT INTO saved_properties (client_id, property_id) VALUES ($1, $2) \
         ON CONFLICT (client_id, property_id) DO NOTHING",
    )
    .bind(client_id)
    .bind(property_id)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => common::ok("Property saved", serde_json::json!({ "propertyId": property_id })),
        Err(error) => common::server_error(error),
    }
}

/// DELETE /client/saved/{property_id} — remove a bookmark.
pub async fn unsave_property(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    let (client_id, property_id) = match client_and_property(&config, pool.get_ref(), &request, path).await {
        Ok(pair) => pair,
        Err(response) => return response,
    };

    match sqlx::query("DELETE FROM saved_properties WHERE client_id = $1 AND property_id = $2")
        .bind(client_id)
        .bind(property_id)
        .execute(pool.get_ref())
        .await
    {
        Ok(_) => common::ok("Property removed", serde_json::json!({ "propertyId": property_id })),
        Err(error) => common::server_error(error),
    }
}

/// GET /client/saved — the client's saved properties, newest first.
pub async fn list_saved(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };

    let query = r#"
        SELECT p.id, p.title, p.slug, p.location, p.price::float8 AS price, p.currency,
               p.property_type, p.bedrooms, p.bathrooms, p.main_image, s.created_at AS at
        FROM saved_properties s
        JOIN properties p ON p.id = s.property_id
        WHERE s.client_id = $1 AND p.is_visible = TRUE
        ORDER BY s.created_at DESC
    "#;
    match sqlx::query_as::<_, PropertyCard>(query)
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(items) => common::ok("Saved properties fetched", items),
        Err(error) => common::server_error(error),
    }
}

// ─── Recently viewed ────────────────────────────────────────────────────────────

/// POST /client/views/{property_id} — record that the client opened a property.
/// Upserts the timestamp so each property appears once, most-recent-first.
pub async fn record_view(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    path: web::Path<String>,
) -> impl Responder {
    let (client_id, property_id) = match client_and_property(&config, pool.get_ref(), &request, path).await {
        Ok(pair) => pair,
        Err(response) => return response,
    };

    match sqlx::query(
        "INSERT INTO property_views (client_id, property_id) VALUES ($1, $2) \
         ON CONFLICT (client_id, property_id) DO UPDATE SET viewed_at = now()",
    )
    .bind(client_id)
    .bind(property_id)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => common::ok("View recorded", serde_json::json!({})),
        Err(error) => common::server_error(error),
    }
}

/// GET /client/views — recently viewed properties (latest 50).
pub async fn list_viewed(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };

    let query = r#"
        SELECT p.id, p.title, p.slug, p.location, p.price::float8 AS price, p.currency,
               p.property_type, p.bedrooms, p.bathrooms, p.main_image, v.viewed_at AS at
        FROM property_views v
        JOIN properties p ON p.id = v.property_id
        WHERE v.client_id = $1 AND p.is_visible = TRUE
        ORDER BY v.viewed_at DESC
        LIMIT 50
    "#;
    match sqlx::query_as::<_, PropertyCard>(query)
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(items) => common::ok("Recently viewed fetched", items),
        Err(error) => common::server_error(error),
    }
}

// ─── Inquiries (contact an agent) ────────────────────────────────────────────────

/// POST /client/inquiries — send a message to the team about a property. Name and
/// email are taken from the client's own profile, so the form only needs a message.
pub async fn create_inquiry(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<CreateInquiryRequest>,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let req = payload.into_inner();
    if req.message.trim().is_empty() {
        return common::bad_request("Message is required");
    }

    // Pull the client's name/email so the agent knows who's asking.
    let client = match sqlx::query_as::<_, ClientUser>(
        "SELECT id, full_name, email, password_hash, phone, email_verified, phone_verified, \
         is_active, avatar, search_preferences, created_at, updated_at \
         FROM client_users WHERE id = $1 LIMIT 1",
    )
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    {
        Ok(Some(client)) => client,
        Ok(None) => return common::unauthorized("Account not found"),
        Err(error) => return common::server_error(error),
    };

    // Prefer the phone from the form, fall back to the profile's phone.
    let phone = req
        .phone
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .or(client.phone.clone());

    match sqlx::query(
        "INSERT INTO inquiries (client_id, property_id, name, email, phone, message) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(client.id)
    .bind(req.property_id)
    .bind(&client.full_name)
    .bind(&client.email)
    .bind(phone)
    .bind(req.message.trim())
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => common::created("Your message has been sent.", serde_json::json!({})),
        Err(error) => common::server_error(error),
    }
}

/// GET /client/inquiries — the client's own inquiries, newest first.
pub async fn list_inquiries(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };

    let query = r#"
        SELECT i.id, i.property_id, p.title AS property_title, p.slug AS property_slug,
               i.message, i.status, i.created_at
        FROM inquiries i
        LEFT JOIN properties p ON p.id = i.property_id
        WHERE i.client_id = $1
        ORDER BY i.created_at DESC
    "#;
    match sqlx::query_as::<_, InquiryItem>(query)
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(items) => common::ok("Inquiries fetched", items),
        Err(error) => common::server_error(error),
    }
}

// ─── Web push subscriptions ──────────────────────────────────────────────────────

/// POST /client/notifications/subscribe — register this browser to receive push
/// alerts for the signed-in client. Upserts by endpoint and tags it with the
/// client's id so property alerts reach the right person.
pub async fn subscribe_push(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<PushSubscriptionRequest>,
) -> impl Responder {
    let claims = match require_verified_client(&config, pool.get_ref(), &request).await {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    if !config.push_notifications_configured() {
        return common::bad_request("Push notifications are not configured");
    }

    let req = payload.into_inner();
    let endpoint = req.endpoint.trim().to_string();
    let p256dh = req.keys.p256dh.trim().to_string();
    let auth = req.keys.auth.trim().to_string();

    if endpoint.is_empty() || p256dh.is_empty() || auth.is_empty() {
        return common::bad_request("Push subscription endpoint and keys are required");
    }
    if !endpoint.starts_with("https://") {
        return common::bad_request("Push subscription endpoint must be HTTPS");
    }

    match sqlx::query(
        "INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, client_id) \
         VALUES ($1, $2, $3, $4, $5) \
         ON CONFLICT (endpoint) DO UPDATE \
         SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, client_id = EXCLUDED.client_id",
    )
    .bind(Uuid::new_v4())
    .bind(&endpoint)
    .bind(p256dh)
    .bind(auth)
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    {
        Ok(_) => common::created("Push alerts enabled for this browser", serde_json::json!({})),
        Err(error) => common::server_error(error),
    }
}

/// DELETE /client/notifications/subscribe — turn off push on this browser.
pub async fn unsubscribe_push(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    request: HttpRequest,
    payload: web::Json<PushUnsubscribeRequest>,
) -> impl Responder {
    let claims = match require_client_claims(&config, &request) {
        Ok(claims) => claims,
        Err(response) => return response,
    };
    let endpoint = payload.endpoint.trim().to_string();
    if endpoint.is_empty() {
        return common::bad_request("Push subscription endpoint is required");
    }

    match sqlx::query("DELETE FROM push_subscriptions WHERE endpoint = $1 AND client_id = $2")
        .bind(&endpoint)
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) => common::ok(
            "Push alerts disabled for this browser",
            serde_json::json!({ "removed": result.rows_affected() }),
        ),
        Err(error) => common::server_error(error),
    }
}
