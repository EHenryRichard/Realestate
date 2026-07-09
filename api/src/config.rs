use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub server_host: String,
    pub server_port: u16,
    pub admin_base_path: String,
    pub admin_api_path: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_access_expires_in: String,
    pub jwt_refresh_expires_in: String,
    pub password_reset_expires_in: String,
    pub email_verification_expires_in: String,
    pub agent_invite_expires_in: String,
    pub refresh_cookie_secure: bool,
    pub frontend_url: String,
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub mail_from: String,
    pub mail_from_name: String,
    pub upload_dir: String,
    pub ffmpeg_path: String,
    pub ffprobe_path: String,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: usize,
    pub video: VideoConfig,
    /// Secret used to sign expiring video stream URLs.
    pub media_url_secret: String,
    /// How long a signed video URL stays valid, in seconds.
    pub media_url_ttl_seconds: i64,
    /// URL-safe base64 VAPID private key used to sign Web Push messages.
    pub vapid_private_key: String,
    /// URL-safe base64 VAPID public key used by admin browsers to subscribe.
    pub vapid_public_key: String,
    /// VAPID subject, usually a mailto: contact.
    pub vapid_subject: String,
}

/// Video compression tuning, all overridable via environment variables so the
/// quality/speed trade-off can be changed without rebuilding.
#[derive(Clone, Debug)]
pub struct VideoConfig {
    /// Downscale width when a video must be re-encoded (e.g. "1280").
    pub max_width: String,
    /// libx264 preset: ultrafast..veryslow. Faster preset = quicker, larger files.
    pub preset: String,
    pub target_bitrate: String,
    pub max_bitrate: String,
    pub buffer_size: String,
    pub audio_bitrate: String,
    /// Already-h264 videos at or below this width/bitrate are stream-copied
    /// (seconds) instead of re-encoded (minutes).
    pub remux_max_width: u64,
    pub remux_max_bitrate: u64,
    /// Simultaneous CPU encodes. Keep at 1 on a few-core box so each run gets
    /// all cores and the first video in a batch finishes fastest.
    pub max_concurrent_encodes: usize,
}

impl VideoConfig {
    fn from_env() -> Self {
        Self {
            max_width: env::var("VIDEO_MAX_WIDTH").unwrap_or_else(|_| "1280".to_string()),
            preset: env::var("VIDEO_PRESET").unwrap_or_else(|_| "veryfast".to_string()),
            target_bitrate: env::var("VIDEO_TARGET_BITRATE")
                .unwrap_or_else(|_| "2200k".to_string()),
            max_bitrate: env::var("VIDEO_MAX_BITRATE").unwrap_or_else(|_| "3000k".to_string()),
            buffer_size: env::var("VIDEO_BUFFER_SIZE").unwrap_or_else(|_| "6000k".to_string()),
            audio_bitrate: env::var("VIDEO_AUDIO_BITRATE").unwrap_or_else(|_| "96k".to_string()),
            remux_max_width: parse_env("VIDEO_REMUX_MAX_WIDTH", 1920),
            remux_max_bitrate: parse_env("VIDEO_REMUX_MAX_BITRATE", 12_000_000),
            max_concurrent_encodes: parse_env::<usize>("VIDEO_MAX_CONCURRENT_ENCODES", 1).max(1),
        }
    }
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .ok()
                .and_then(|value| value.parse::<u16>().ok())
                .unwrap_or(8080),
            admin_base_path: normalize_path(
                &env::var("ADMIN_BASE_PATH").unwrap_or_else(|_| "/control-panel".to_string()),
            ),
            admin_api_path: normalize_path(
                &env::var("ADMIN_API_PATH").unwrap_or_else(|_| "/core-portal".to_string()),
            ),
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgres://app_user:12345@localhost:5432/sureboy_realty".to_string()
            }),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "change_this_secret".to_string()),
            jwt_access_expires_in: env::var("JWT_ACCESS_EXPIRES_IN")
                .or_else(|_| env::var("JWT_EXPIRES_IN"))
                .unwrap_or_else(|_| "15m".to_string()),
            jwt_refresh_expires_in: env::var("JWT_REFRESH_EXPIRES_IN")
                .unwrap_or_else(|_| "7d".to_string()),
            password_reset_expires_in: env::var("PASSWORD_RESET_EXPIRES_IN")
                .unwrap_or_else(|_| "30m".to_string()),
            email_verification_expires_in: env::var("EMAIL_VERIFICATION_EXPIRES_IN")
                .unwrap_or_else(|_| "24h".to_string()),
            agent_invite_expires_in: env::var("AGENT_INVITE_EXPIRES_IN")
                .unwrap_or_else(|_| "7d".to_string()),
            refresh_cookie_secure: env::var("REFRESH_COOKIE_SECURE")
                .map(|value| value == "true")
                .unwrap_or(false),
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            smtp_host: env::var("SMTP_HOST").unwrap_or_default(),
            smtp_port: env::var("SMTP_PORT")
                .ok()
                .and_then(|value| value.parse::<u16>().ok())
                .unwrap_or(587),
            smtp_username: env::var("SMTP_USERNAME").unwrap_or_default(),
            smtp_password: env::var("SMTP_PASSWORD").unwrap_or_default(),
            mail_from: env::var("MAIL_FROM")
                .or_else(|_| env::var("SMTP_USERNAME"))
                .unwrap_or_default(),
            mail_from_name: env::var("MAIL_FROM_NAME")
                .unwrap_or_else(|_| "Sureboy Realty".to_string()),
            upload_dir: env::var("UPLOAD_DIR").unwrap_or_else(|_| "uploads".to_string()),
            ffmpeg_path: env::var("FFMPEG_PATH").unwrap_or_else(|_| "ffmpeg".to_string()),
            ffprobe_path: env::var("FFPROBE_PATH").unwrap_or_else(|_| "ffprobe".to_string()),
            rate_limit_window_seconds: env::var("RATE_LIMIT_WINDOW_SECONDS")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(60),
            rate_limit_max_requests: env::var("RATE_LIMIT_MAX_REQUESTS")
                .ok()
                .and_then(|value| value.parse::<usize>().ok())
                .unwrap_or(60),
            video: VideoConfig::from_env(),
            media_url_secret: env::var("MEDIA_URL_SECRET")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .or_else(|| env::var("JWT_SECRET").ok())
                .unwrap_or_else(|| "change_this_secret".to_string()),
            media_url_ttl_seconds: parse_env("MEDIA_URL_TTL_SECONDS", 3600),
            vapid_private_key: env::var("VAPID_PRIVATE_KEY").unwrap_or_default(),
            vapid_public_key: env::var("VAPID_PUBLIC_KEY").unwrap_or_default(),
            vapid_subject: env::var("VAPID_SUBJECT").unwrap_or_default(),
        }
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }

    pub fn push_notifications_configured(&self) -> bool {
        !self.vapid_private_key.trim().is_empty()
            && !self.vapid_public_key.trim().is_empty()
            && !self.vapid_subject.trim().is_empty()
    }
}

fn parse_env<T>(key: &str, default: T) -> T
where
    T: std::str::FromStr,
{
    env::var(key)
        .ok()
        .and_then(|value| value.trim().parse::<T>().ok())
        .unwrap_or(default)
}

fn normalize_path(value: &str) -> String {
    let trimmed = value.trim().trim_matches('/');

    if trimmed.is_empty() {
        "/core-portal".to_string()
    } else {
        format!("/{trimmed}")
    }
}
