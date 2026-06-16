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
    pub phone: Option<String>,
    pub title: Option<String>,
    pub bio: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub photo: Option<String>,
    pub bio: Option<String>,
    pub title: Option<String>,
    pub slug: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1))]
    pub current_password: String,
    #[validate(length(min = 6))]
    pub new_password: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAgentRequest {
    pub full_name: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
    pub phone: Option<String>,
    pub photo: Option<String>,
    pub bio: Option<String>,
    pub title: Option<String>,
    pub slug: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminResponse {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub email: String,
    pub role: String,
    pub is_active: bool,
    pub phone: Option<String>,
    pub photo: Option<String>,
    pub bio: Option<String>,
    pub title: Option<String>,
    pub slug: Option<String>,
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
            phone: admin.phone.clone(),
            photo: admin.photo.clone(),
            bio: admin.bio.clone(),
            title: admin.title.clone(),
            slug: admin.slug.clone(),
        }
    }
}

impl From<AdminUser> for AdminResponse {
    fn from(admin: AdminUser) -> Self {
        Self::from(&admin)
    }
}
