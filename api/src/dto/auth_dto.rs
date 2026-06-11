use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::models::admin_user::AdminUser;

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct RegisterAdminRequest {
    #[validate(length(min = 1))]
    pub full_name: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminResponse {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub email: String,
    pub role: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSessionResponse {
    pub access_token: String,
    pub admin: AdminResponse,
}

impl From<&AdminUser> for AdminResponse {
    fn from(admin: &AdminUser) -> Self {
        Self {
            id: admin.id,
            full_name: admin.full_name.clone(),
            email: admin.email.clone(),
            role: admin.role.clone(),
            is_active: admin.is_active,
        }
    }
}

impl From<AdminUser> for AdminResponse {
    fn from(admin: AdminUser) -> Self {
        Self::from(&admin)
    }
}
