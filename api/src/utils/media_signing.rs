use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Builds the HMAC-SHA256 signature (hex) over `file_name:exp`.
fn sign(secret: &str, file_name: &str, exp: i64) -> String {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts keys of any size");
    mac.update(format!("{file_name}:{exp}").as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

/// Returns a signed, expiring stream path for a video file, e.g.
/// `/api/stream/videos/<file>?exp=<unix>&sig=<hex>`.
pub fn signed_video_url(secret: &str, file_name: &str, ttl_seconds: i64) -> String {
    let exp = Utc::now().timestamp() + ttl_seconds.max(1);
    let sig = sign(secret, file_name, exp);

    format!("/api/stream/videos/{file_name}?exp={exp}&sig={sig}")
}

/// Validates a signature and that the link has not expired. Uses the HMAC
/// crate's constant-time comparison to avoid timing leaks.
pub fn verify_video_url(secret: &str, file_name: &str, exp: i64, sig: &str) -> bool {
    if exp < Utc::now().timestamp() {
        return false;
    }

    let Ok(provided) = hex::decode(sig) else {
        return false;
    };

    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts keys of any size");
    mac.update(format!("{file_name}:{exp}").as_bytes());

    mac.verify_slice(&provided).is_ok()
}
