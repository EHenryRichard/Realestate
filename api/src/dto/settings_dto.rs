use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsRequest {
    #[serde(alias = "brandName")]
    pub brand_name: String,
    pub phone: Option<String>,
    pub whatsapp: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tagline: Option<String>,
    pub facebook_url: Option<String>,
    pub instagram_url: Option<String>,
    pub linkedin_url: Option<String>,
    pub twitter_url: Option<String>,
    pub logo_url: Option<String>,
    pub favicon_url: Option<String>,
    pub og_image_url: Option<String>,
}
