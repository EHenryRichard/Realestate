use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct TeamMemberRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub full_name: String,
    pub title: Option<String>,
    pub bio: Option<String>,
    pub photo: Option<String>,
    pub phone: Option<String>,
    pub whatsapp: Option<String>,
    pub email: Option<String>,
    // Optional custom page link; auto-generated from the name when blank.
    pub slug: Option<String>,
    pub sort_order: Option<i32>,
    pub is_visible: Option<bool>,
}
