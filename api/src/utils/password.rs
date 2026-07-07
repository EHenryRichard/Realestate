use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use sha2::{Digest, Sha256};

/// A short, non-reversible fingerprint of a stored password hash. Embedded in
/// password-reset tokens so a token stops working the moment the password
/// changes (single-use semantics without a database table).
///
/// We SHA-256 the *hash* (never the raw password) and hex-encode it. It's safe to
/// put inside a token because you can't reverse it back to the password, yet it
/// changes whenever the password changes — exactly what "single use" needs.
pub fn password_fingerprint(password_hash: &str) -> String {
    let digest = Sha256::digest(password_hash.as_bytes()); // 32-byte hash
    hex::encode(digest) // turn those bytes into a readable hex string
}

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default().hash_password(password.as_bytes(), &salt)?;

    Ok(hash.to_string())
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(password_hash) {
        Ok(hash) => hash,
        Err(_) => return false,
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}
