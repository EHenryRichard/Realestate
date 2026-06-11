use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_access_expires_in: String,
    pub jwt_refresh_expires_in: String,
    pub refresh_cookie_secure: bool,
    pub frontend_url: String,
    pub upload_dir: String,
    pub ffmpeg_path: String,
    pub rate_limit_window_seconds: u64,
    pub rate_limit_max_requests: usize,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .ok()
                .and_then(|value| value.parse::<u16>().ok())
                .unwrap_or(8080),
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgres://app_user:12345@localhost:5432/sureboy_realty".to_string()
            }),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "change_this_secret".to_string()),
            jwt_access_expires_in: env::var("JWT_ACCESS_EXPIRES_IN")
                .or_else(|_| env::var("JWT_EXPIRES_IN"))
                .unwrap_or_else(|_| "15m".to_string()),
            jwt_refresh_expires_in: env::var("JWT_REFRESH_EXPIRES_IN")
                .unwrap_or_else(|_| "7d".to_string()),
            refresh_cookie_secure: env::var("REFRESH_COOKIE_SECURE")
                .map(|value| value == "true")
                .unwrap_or(false),
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            upload_dir: env::var("UPLOAD_DIR").unwrap_or_else(|_| "uploads".to_string()),
            ffmpeg_path: env::var("FFMPEG_PATH").unwrap_or_else(|_| "ffmpeg".to_string()),
            rate_limit_window_seconds: env::var("RATE_LIMIT_WINDOW_SECONDS")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(60),
            rate_limit_max_requests: env::var("RATE_LIMIT_MAX_REQUESTS")
                .ok()
                .and_then(|value| value.parse::<usize>().ok())
                .unwrap_or(60),
        }
    }

    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.server_host, self.server_port)
    }
}
