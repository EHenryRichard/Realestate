// DTOs for the "become an agent" flow.
use serde::{Deserialize, Serialize};
use validator::Validate;

/// Public: a person requesting to become an agent (they provide their email).
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct AgentRequestCreate {
    #[validate(email)]
    pub email: String,
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub message: Option<String>,
}

/// Public: completing signup via the emailed invite link. `token` comes from the
/// link; the rest is the agent finishing their account.
#[derive(Debug, Deserialize, Serialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct AgentSignupComplete {
    #[validate(length(min = 1))]
    pub token: String,
    #[validate(length(min = 1))]
    pub full_name: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub phone: Option<String>,
    pub title: Option<String>,
    pub bio: Option<String>,
}
