// property_alert_service.rs
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 notifications: when an admin publishes a property, email every client
// who opted in AND whose saved search matches it. This runs in the background
// (spawned from the create handler) so publishing a property stays instant.
//
// Matching is deliberately "AND across the filters the client set, ignore the
// ones they left blank" — so an empty preference matches everything, and each
// filter they DO set must pass.
// ─────────────────────────────────────────────────────────────────────────────

use serde::Deserialize;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    models::property::Property,
    services::{
        email_service::Mailer,
        push_notification_service::{self, PushLeadAlert},
    },
};

/// Why an alert is being sent — controls the wording of the email/push. New
/// listings and price drops read differently to the recipient.
#[derive(Debug, Clone, Copy)]
pub enum AlertReason {
    NewListing,
    PriceDrop,
}

/// A client's saved-search preferences, parsed from the `search_preferences`
/// JSONB. Everything is optional; `#[serde(default)]` means missing keys become
/// empty/None rather than failing to parse.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct SearchPrefs {
    locations: Vec<String>,
    property_types: Vec<String>,
    max_price: Option<f64>,
    min_bedrooms: Option<i32>,
    /// Legacy flag from before the channel picker existed.
    email_alerts: bool,
    /// "both" | "email" | "push" | "off" — how the client wants to be told.
    channel: Option<String>,
}

impl SearchPrefs {
    /// The effective channel, honouring accounts saved before the picker
    /// existed: an explicit value wins; legacy `emailAlerts: true` means
    /// email-only; anything else (never chose) defaults to "both" so nobody
    /// misses listings while the choice modal is pending.
    fn effective_channel(&self) -> &str {
        match self.channel.as_deref() {
            Some("email") => "email",
            Some("push") => "push",
            Some("off") => "off",
            Some("both") => "both",
            _ if self.email_alerts => "email",
            _ => "both",
        }
    }

    fn wants_email(&self) -> bool {
        matches!(self.effective_channel(), "email" | "both")
    }

    fn wants_push(&self) -> bool {
        matches!(self.effective_channel(), "push" | "both")
    }
}

/// One recipient row: what we need to decide a match and reach them by email
/// and/or push.
#[derive(Debug, sqlx::FromRow)]
struct AlertRecipient {
    id: Uuid,
    full_name: String,
    email: String,
    search_preferences: Option<serde_json::Value>,
}

/// Does this property satisfy every filter the client actually set?
fn property_matches(property: &Property, prefs: &SearchPrefs) -> bool {
    // Location: property location must contain one of the client's locations.
    if !prefs.locations.is_empty() {
        let haystack = property.location.to_lowercase();
        let hit = prefs
            .locations
            .iter()
            .any(|loc| !loc.trim().is_empty() && haystack.contains(&loc.trim().to_lowercase()));
        if !hit {
            return false;
        }
    }

    // Property type: must be one of the client's chosen types.
    if !prefs.property_types.is_empty() {
        let ptype = property.property_type.to_lowercase();
        let hit = prefs
            .property_types
            .iter()
            .any(|t| t.trim().to_lowercase() == ptype);
        if !hit {
            return false;
        }
    }

    // Budget: price must be at or under the client's ceiling.
    if let Some(max_price) = prefs.max_price {
        if property.price > max_price {
            return false;
        }
    }

    // Size: property must have at least the requested bedrooms.
    if let Some(min_bedrooms) = prefs.min_bedrooms {
        if property.bedrooms.unwrap_or(0) < min_bedrooms {
            return false;
        }
    }

    true
}

/// Emails all opted-in, matching clients about a newly published property.
/// Safe to call unconditionally — it no-ops for hidden listings or when SMTP is off.
pub async fn notify_matching_clients(
    pool: DbPool,
    mailer: Mailer,
    config: AppConfig,
    property: Property,
    reason: AlertReason,
) {
    // Only advertise visible listings. We may still deliver via push even if
    // email (SMTP) is off, so we don't require the mailer here.
    if !property.is_visible {
        return;
    }
    let email_enabled = mailer.is_enabled();

    // Candidates: active + verified clients whose channel isn't "off". A client
    // who never chose ("no preference") counts as "both" and is included. Those
    // on push-only must actually have a subscribed browser to be reachable.
    // DISTINCT because a client can have several push subscriptions. The
    // per-recipient channel check below is the final word — this query only
    // trims the obviously unreachable.
    let recipients = sqlx::query_as::<_, AlertRecipient>(
        "SELECT DISTINCT c.id, c.full_name, c.email, c.search_preferences \
         FROM client_users c \
         LEFT JOIN push_subscriptions ps ON ps.client_id = c.id \
         WHERE c.is_active = TRUE AND c.email_verified = TRUE \
           AND COALESCE(c.search_preferences->>'channel', '') <> 'off' \
           AND (COALESCE(c.search_preferences->>'channel', '') <> 'push' OR ps.id IS NOT NULL)",
    )
    .fetch_all(&pool)
    .await;

    let recipients = match recipients {
        Ok(rows) => rows,
        Err(error) => {
            tracing::error!("Failed to load alert recipients: {error}");
            return;
        }
    };

    let property_url = format!(
        "{}/properties/{}",
        config.frontend_url.trim_end_matches('/'),
        property.slug
    );
    let price = format!("{} {:.0}", property.currency, property.price);

    // Wording depends on why we're alerting (new listing vs. price drop).
    let (subject, heading, intro, push_title) = match reason {
        AlertReason::NewListing => (
            format!("New listing: {}", property.title),
            "A new property for you",
            "a new listing matching your saved search just went live:",
            format!("New property: {}", property.title),
        ),
        AlertReason::PriceDrop => (
            format!("Price drop: {}", property.title),
            "Price drop",
            "the price just dropped on a property matching your saved search:",
            format!("Price drop: {}", property.title),
        ),
    };

    // The push payload is the same for everyone; build it once.
    let push_alert = PushLeadAlert {
        title: push_title,
        body: format!("{} — {}", property.location, price),
        url: property_url.clone(),
        tag: "sureboy-property-alert".to_string(),
    };

    for recipient in recipients {
        // Parse this client's prefs; skip cleanly if the JSON is unexpected.
        let prefs: SearchPrefs = recipient
            .search_preferences
            .as_ref()
            .and_then(|value| serde_json::from_value(value.clone()).ok())
            .unwrap_or_default();

        if !property_matches(&property, &prefs) {
            continue;
        }

        // Email: only if SMTP is on and this client's channel includes email.
        if email_enabled && prefs.wants_email() {
            if let Err(error) = mailer
                .send_property_alert(
                    &recipient.email,
                    &recipient.full_name,
                    &subject,
                    heading,
                    intro,
                    &property.title,
                    &property.location,
                    &price,
                    &property_url,
                )
                .await
            {
                tracing::error!("Failed to send property alert to {}: {error}", recipient.email);
            }
        }

        // Push: only if their channel includes it; still no-ops with no
        // subscribed browsers.
        if prefs.wants_push() {
            push_notification_service::send_to_client(&pool, &config, recipient.id, &push_alert)
                .await;
        }
    }
}
