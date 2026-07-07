use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A public/client account (someone who signed up on the website). Mirrors a row
/// in the `client_users` table. `#[sqlx(FromRow)]` lets sqlx build this straight
/// from a query result; the field order must match the `CLIENT_COLUMNS` select.
#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ClientUser {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    // Never serialised out to the client — kept server-side only.
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub phone: Option<String>,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub is_active: bool,
    pub avatar: Option<String>,
    /// Saved search filters (JSONB) used later to send targeted property alerts.
    pub search_preferences: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
