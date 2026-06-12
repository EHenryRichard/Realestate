use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Property {
    pub id: Uuid,
    pub title: String,
    pub slug: String,
    pub location: String,
    pub price: f64,
    pub currency: String,
    pub property_type: String,
    pub status: String,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub area: Option<String>,
    pub main_image: Option<String>,
    pub image_alt: Option<String>,
    pub videos: serde_json::Value,
    pub gallery_images: serde_json::Value,
    pub description: String,
    pub features: serde_json::Value,
    pub is_featured: bool,
    pub is_visible: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PropertyGalleryImage {
    pub id: Uuid,
    pub property_id: Uuid,
    pub image_url: String,
    pub image_alt: Option<String>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}
