use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JwtClaims {
    pub sub: Uuid,
    pub email: String,
    pub role: String,
    pub token_type: String,
    pub exp: usize,
}

pub fn expiry_seconds(value: &str) -> i64 {
    let trimmed = value.trim();

    if let Some(days) = trimmed
        .strip_suffix('d')
        .and_then(|number| number.parse::<i64>().ok())
    {
        return days * 24 * 60 * 60;
    }

    if let Some(hours) = trimmed
        .strip_suffix('h')
        .and_then(|number| number.parse::<i64>().ok())
    {
        return hours * 60 * 60;
    }

    if let Some(minutes) = trimmed
        .strip_suffix('m')
        .and_then(|number| number.parse::<i64>().ok())
    {
        return minutes * 60;
    }

    7 * 24 * 60 * 60
}

fn expiry_duration(value: &str) -> Duration {
    Duration::seconds(expiry_seconds(value))
}

fn create_token(
    admin_id: Uuid,
    email: &str,
    role: &str,
    secret: &str,
    expires_in: &str,
    token_type: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    let expires_at = Utc::now() + expiry_duration(expires_in);
    let claims = JwtClaims {
        sub: admin_id,
        email: email.to_string(),
        role: role.to_string(),
        token_type: token_type.to_string(),
        exp: expires_at.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn create_access_token(
    admin_id: Uuid,
    email: &str,
    role: &str,
    secret: &str,
    expires_in: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    create_token(admin_id, email, role, secret, expires_in, "access")
}

pub fn create_refresh_token(
    admin_id: Uuid,
    email: &str,
    role: &str,
    secret: &str,
    expires_in: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    create_token(admin_id, email, role, secret, expires_in, "refresh")
}

pub fn verify_token(token: &str, secret: &str) -> Result<JwtClaims, jsonwebtoken::errors::Error> {
    decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}
