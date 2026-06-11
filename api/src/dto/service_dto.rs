use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ServiceRequest {
    #[validate(length(min = 1))]
    pub title: String,
    pub slug: Option<String>,
    pub short_description: String,
    pub full_description: String,
    pub icon_key: Option<String>,
    pub image: Option<String>,
    pub features: Option<Vec<String>>,
    pub cta_text: Option<String>,
    pub link: Option<String>,
    pub is_active: Option<bool>,
}
