use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::notification_dto::{PushSubscriptionRequest, PushUnsubscribeRequest},
    handlers::common,
    models::push_subscription::PushSubscription,
};

const PUSH_SUBSCRIPTION_COLUMNS: &str = r#"
    id,
    endpoint,
    p256dh,
    auth,
    created_at
"#;

fn is_blank(value: &str) -> bool {
    value.trim().is_empty()
}

pub async fn subscribe_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<PushSubscriptionRequest>,
) -> impl Responder {
    if !config.push_notifications_configured() {
        return common::bad_request("Push notifications are not configured");
    }

    let request = payload.into_inner();
    let endpoint = request.endpoint.trim().to_string();
    let p256dh = request.keys.p256dh.trim().to_string();
    let auth = request.keys.auth.trim().to_string();

    if is_blank(&endpoint) || is_blank(&p256dh) || is_blank(&auth) {
        return common::bad_request("Push subscription endpoint and keys are required");
    }

    if !endpoint.starts_with("https://") {
        return common::bad_request("Push subscription endpoint must be HTTPS");
    }

    let query = format!(
        r#"
        INSERT INTO push_subscriptions (id, endpoint, p256dh, auth)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (endpoint) DO UPDATE
        SET p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth
        RETURNING {PUSH_SUBSCRIPTION_COLUMNS}
        "#
    );

    match sqlx::query_as::<_, PushSubscription>(&query)
        .bind(Uuid::new_v4())
        .bind(endpoint)
        .bind(p256dh)
        .bind(auth)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(subscription) => common::created("Push alerts enabled for this browser", subscription),
        Err(error) => common::server_error(error),
    }
}

pub async fn unsubscribe_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<PushUnsubscribeRequest>,
) -> impl Responder {
    let endpoint = payload.endpoint.trim().to_string();

    if endpoint.is_empty() {
        return common::bad_request("Push subscription endpoint is required");
    }

    match sqlx::query("DELETE FROM push_subscriptions WHERE endpoint = $1")
        .bind(&endpoint)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) => common::ok(
            "Push alerts disabled for this browser",
            json!({ "endpoint": endpoint, "removed": result.rows_affected() }),
        ),
        Err(error) => common::server_error(error),
    }
}
