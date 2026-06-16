use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BlogPost {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub excerpt: String,
    pub content: String,
    pub cover_image: Option<String>,
    pub category: Option<String>,
    pub author: String,
    pub is_published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
