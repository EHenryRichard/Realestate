use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct PropertyRequest {
    #[validate(length(min = 1))]
    pub title: String,
    pub slug: Option<String>,
    #[validate(length(min = 1))]
    pub location: String,
    #[validate(range(min = 1.0))]
    pub price: f64,
    pub currency: Option<String>,
    #[serde(alias = "type")]
    pub property_type: String,
    pub status: String,
    pub bedrooms: Option<i32>,
    pub bathrooms: Option<i32>,
    pub area: Option<String>,
    pub main_image: Option<String>,
    pub image_alt: Option<String>,
    pub videos: Option<Vec<PropertyVideoRequest>>,
    pub gallery_images: Option<Vec<String>>,
    pub description: String,
    pub features: Option<Vec<String>>,
    pub is_featured: Option<bool>,
    pub is_visible: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PropertyVideoRequest {
    pub url: String,
    pub poster: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PropertyStatusRequest {
    pub status: String,
}
