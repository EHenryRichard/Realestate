use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ContactMessageRequest {
    #[validate(length(min = 1))]
    pub full_name: String,
    #[validate(email)]
    pub email: String,
    pub phone: Option<String>,
    pub service_interested_in: Option<String>,
    pub message: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageStatusRequest {
    pub status: String,
}
