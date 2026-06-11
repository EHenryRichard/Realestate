use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Testimonial {
    pub id: Uuid,
    pub client_name: String,
    pub client_role: Option<String>,
    pub service_used: Option<String>,
    pub rating: i32,
    pub quote: String,
    pub avatar: Option<String>,
    pub is_visible: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
