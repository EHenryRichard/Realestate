use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// An application to become an agent (mirrors an `agent_requests` row).
/// `status`: pending → approved → completed, or rejected.
#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AgentRequest {
    pub id: Uuid,
    pub email: String,
    pub full_name: Option<String>,
    pub phone: Option<String>,
    pub message: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
