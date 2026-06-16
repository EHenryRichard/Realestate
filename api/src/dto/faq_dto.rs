use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct FaqRequest {
    #[validate(length(min = 1))]
    pub question: String,
    pub answer: Option<String>,
    pub sort_order: Option<i32>,
    pub is_visible: Option<bool>,
}
