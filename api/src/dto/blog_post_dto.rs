use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct BlogPostRequest {
    #[validate(length(min = 1))]
    pub title: String,
    #[validate(length(min = 1))]
    pub slug: String,
    #[validate(length(min = 1))]
    pub excerpt: String,
    pub content: String,
    pub cover_image: Option<String>,
    pub category: Option<String>,
    pub author: Option<String>,
    pub is_published: Option<bool>,
}
