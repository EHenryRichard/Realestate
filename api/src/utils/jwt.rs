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

/// The data baked into a password-reset link's token ("claims" = the facts the
/// token asserts). It's a normal JWT, signed with our secret, so nobody can forge
/// or tamper with it.
///
/// The clever bit is `fingerprint`: a hash of the password that was active when
/// the link was issued. On reset we recompute it from the *current* password and
/// compare. That gives us single-use links for free — the moment the password
/// changes, every previously-issued link's fingerprint no longer matches and
/// stops working, with no database table to track "used" tokens.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordResetClaims {
    pub sub: Uuid,         // subject: which admin this token is for (their id)
    pub email: String,     // convenience copy of the admin's email
    pub token_type: String, // always "password_reset" — guards against reusing other token types
    pub fingerprint: String, // hash of the password at issue-time (see above)
    pub exp: usize,        // expiry as a Unix timestamp; jsonwebtoken rejects it once passed
}

/// Signs a new reset token. `expires_in` is a human string like "30m" (parsed by
/// `expiry_duration`), so the link is only valid for a short window.
pub fn create_password_reset_token(
    admin_id: Uuid,
    email: &str,
    fingerprint: &str,
    secret: &str,
    expires_in: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    let expires_at = Utc::now() + expiry_duration(expires_in);
    let claims = PasswordResetClaims {
        sub: admin_id,
        email: email.to_string(),
        token_type: "password_reset".to_string(),
        fingerprint: fingerprint.to_string(),
        exp: expires_at.timestamp() as usize,
    };

    // `encode` serialises the claims and signs them with our secret key.
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

/// Verifies a reset token: checks the signature (not forged) and the expiry (not
/// stale), then hands back the claims. Returns `Err` if either check fails.
pub fn verify_password_reset_token(
    token: &str,
    secret: &str,
) -> Result<PasswordResetClaims, jsonwebtoken::errors::Error> {
    decode::<PasswordResetClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}

/// Claims for the "confirm your email address" link a client receives after
/// signing up. It's a signed JWT that simply proves "the holder controls this
/// email"; clicking the link within the expiry window flips `email_verified`.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailVerificationClaims {
    pub sub: Uuid,          // which client account this confirms
    pub email: String,      // the email being confirmed
    pub token_type: String, // always "email_verify"
    pub exp: usize,         // expiry (Unix timestamp)
}

pub fn create_email_verification_token(
    user_id: Uuid,
    email: &str,
    secret: &str,
    expires_in: &str,
) -> Result<String, jsonwebtoken::errors::Error> {
    let expires_at = Utc::now() + expiry_duration(expires_in);
    let claims = EmailVerificationClaims {
        sub: user_id,
        email: email.to_string(),
        token_type: "email_verify".to_string(),
        exp: expires_at.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_email_verification_token(
    token: &str,
    secret: &str,
) -> Result<EmailVerificationClaims, jsonwebtoken::errors::Error> {
    decode::<EmailVerificationClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
}
