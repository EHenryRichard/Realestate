use serde::Serialize;
use tracing::{info, warn};
use web_push::{
    ContentEncoding, HyperWebPushClient, SubscriptionInfo, Urgency, VapidSignatureBuilder,
    WebPushClient, WebPushError, WebPushMessageBuilder,
};

use crate::{config::AppConfig, db::DbPool, models::push_subscription::PushSubscription};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PushLeadAlert {
    pub title: String,
    pub body: String,
    pub url: String,
    pub tag: String,
}

impl PushLeadAlert {
    pub fn new(title: impl Into<String>, body: impl Into<String>, url: impl Into<String>) -> Self {
        Self {
            title: title.into(),
            body: body.into(),
            url: url.into(),
            tag: "sureboy-lead-alert".to_string(),
        }
    }
}

pub fn spawn_lead_alert(pool: DbPool, config: AppConfig, alert: PushLeadAlert) {
    if !config.push_notifications_configured() {
        warn!("Skipping lead push alert because VAPID configuration is incomplete");
        return;
    }

    tokio::spawn(async move {
        send_to_all(pool, config, alert).await;
    });
}

/// Admin lead alerts only go to admin devices (`client_id IS NULL`), so client
/// browsers subscribed for property alerts never receive them.
async fn send_to_all(pool: DbPool, config: AppConfig, alert: PushLeadAlert) {
    let subscriptions = match sqlx::query_as::<_, PushSubscription>(
        r#"
        SELECT id, endpoint, p256dh, auth, created_at
        FROM push_subscriptions
        WHERE client_id IS NULL
        ORDER BY created_at ASC
        "#,
    )
    .fetch_all(&pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            warn!(error = %error, "Failed to load push subscriptions");
            return;
        }
    };

    dispatch(&pool, &config, subscriptions, &alert).await;
}

/// Sends a push alert to one client's subscribed browsers. Used by the property
/// alert fan-out. No-ops when push isn't configured or the client has no devices.
pub async fn send_to_client(
    pool: &DbPool,
    config: &AppConfig,
    client_id: uuid::Uuid,
    alert: &PushLeadAlert,
) {
    if !config.push_notifications_configured() {
        return;
    }

    let subscriptions = match sqlx::query_as::<_, PushSubscription>(
        r#"
        SELECT id, endpoint, p256dh, auth, created_at
        FROM push_subscriptions
        WHERE client_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(client_id)
    .fetch_all(pool)
    .await
    {
        Ok(rows) => rows,
        Err(error) => {
            warn!(error = %error, "Failed to load client push subscriptions");
            return;
        }
    };

    dispatch(pool, config, subscriptions, alert).await;
}

/// Shared delivery loop: signs and sends `alert` to every subscription, pruning
/// any that the push service reports as gone.
async fn dispatch(
    pool: &DbPool,
    config: &AppConfig,
    subscriptions: Vec<PushSubscription>,
    alert: &PushLeadAlert,
) {
    if subscriptions.is_empty() {
        return;
    }

    let payload = match serde_json::to_vec(alert) {
        Ok(payload) => payload,
        Err(error) => {
            warn!(error = %error, "Failed to serialize push payload");
            return;
        }
    };
    let vapid_key = match VapidSignatureBuilder::from_base64_no_sub(config.vapid_private_key.trim())
    {
        Ok(builder) => builder,
        Err(error) => {
            warn!(error = %error, "Invalid VAPID private key");
            return;
        }
    };
    let client = HyperWebPushClient::new();
    let mut delivered = 0usize;

    for subscription in subscriptions {
        let subscription_info = SubscriptionInfo::new(
            subscription.endpoint.clone(),
            subscription.p256dh.clone(),
            subscription.auth.clone(),
        );
        let mut signature_builder = vapid_key.clone().add_sub_info(&subscription_info);
        signature_builder.add_claim("sub", config.vapid_subject.trim().to_string());
        let signature = match signature_builder.build() {
            Ok(signature) => signature,
            Err(error) => {
                warn!(
                    error = %error,
                    subscription_id = %subscription.id,
                    "Failed to build VAPID signature"
                );
                continue;
            }
        };
        let mut message_builder = WebPushMessageBuilder::new(&subscription_info);

        message_builder.set_payload(ContentEncoding::Aes128Gcm, &payload);
        message_builder.set_vapid_signature(signature);
        message_builder.set_ttl(24 * 60 * 60);
        message_builder.set_urgency(Urgency::High);

        let message = match message_builder.build() {
            Ok(message) => message,
            Err(error) => {
                warn!(
                    error = %error,
                    subscription_id = %subscription.id,
                    "Failed to build web push message"
                );
                continue;
            }
        };

        match client.send(message).await {
            Ok(()) => {
                delivered += 1;
            }
            Err(WebPushError::EndpointNotValid(_)) | Err(WebPushError::EndpointNotFound(_)) => {
                delete_subscription(pool, subscription.id, &subscription.endpoint).await;
            }
            Err(error) => {
                warn!(
                    error = %error,
                    subscription_id = %subscription.id,
                    "Failed to send web push message"
                );
            }
        }
    }

    info!(delivered, "Lead push alert dispatch finished");
}

async fn delete_subscription(pool: &DbPool, id: uuid::Uuid, endpoint: &str) {
    match sqlx::query("DELETE FROM push_subscriptions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await
    {
        Ok(_) => {
            info!(subscription_id = %id, "Deleted expired push subscription");
        }
        Err(error) => {
            warn!(
                error = %error,
                subscription_id = %id,
                endpoint = %endpoint,
                "Failed to delete expired push subscription"
            );
        }
    }
}
