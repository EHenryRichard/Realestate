// DTOs ("data transfer objects") for the client/public account API. These are the
// request bodies we accept and the response shapes we return — deliberately
// separate from the database model so we never leak sensitive columns.

use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::models::client_user::ClientUser;

/// Public signup form.
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ClientRegisterRequest {
    #[validate(length(min = 1))]
    pub full_name: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub phone: Option<String>,
}

/// Login form.
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ClientLoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1))]
    pub password: String,
}

/// Body for the "verify my email" step — the token from the emailed link.
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct VerifyEmailRequest {
    #[validate(length(min = 1))]
    pub token: String,
}

/// Body for re-sending the verification email.
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ResendVerificationRequest {
    #[validate(email)]
    pub email: String,
}

/// Partial profile update (any subset of fields).
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateClientProfileRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub search_preferences: Option<serde_json::Value>,
}

/// Body for sending an inquiry ("contact an agent"). Name/email are taken from
/// the logged-in client, so the form only needs the message (+ optional phone and
/// which property it's about).
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateInquiryRequest {
    pub property_id: Option<uuid::Uuid>,
    #[validate(length(min = 1))]
    pub message: String,
    pub phone: Option<String>,
}

/// Admin-side edit of a client account. Any field left out is unchanged.
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUpdateClientRequest {
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
    pub email_verified: Option<bool>,
}

/// The safe, outward-facing view of a client (no password hash, etc.).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientResponse {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub avatar: Option<String>,
    pub search_preferences: Option<serde_json::Value>,
}

/// What login/signup/refresh return: the access token + the client profile.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSessionResponse {
    pub access_token: String,
    pub client: ClientResponse,
}

impl From<&ClientUser> for ClientResponse {
    fn from(client: &ClientUser) -> Self {
        Self {
            id: client.id,
            full_name: client.full_name.clone(),
            email: client.email.clone(),
            phone: client.phone.clone(),
            email_verified: client.email_verified,
            phone_verified: client.phone_verified,
            avatar: client.avatar.clone(),
            search_preferences: client.search_preferences.clone(),
        }
    }
}

impl From<ClientUser> for ClientResponse {
    fn from(client: ClientUser) -> Self {
        Self::from(&client)
    }
}
