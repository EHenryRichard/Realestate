use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub short_description: String,
    pub full_description: String,
    pub icon_key: Option<String>,
    pub image: Option<String>,
    pub features: serde_json::Value,
    pub cta_text: Option<String>,
    pub link: Option<String>,
    pub is_active: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
