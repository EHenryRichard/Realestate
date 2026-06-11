use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct TestimonialRequest {
    #[validate(length(min = 1))]
    pub client_name: String,
    pub client_role: Option<String>,
    pub service_used: Option<String>,
    #[validate(range(min = 1, max = 5))]
    pub rating: i32,
    pub quote: String,
    pub avatar: Option<String>,
    pub is_visible: Option<bool>,
}
