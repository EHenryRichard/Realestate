use std::{
    collections::{HashMap, VecDeque},
    sync::Mutex,
    time::{Duration, Instant},
};

use actix_web::{
    Error, HttpResponse,
    body::{EitherBody, MessageBody},
    dev::{ServiceRequest, ServiceResponse},
    http::Method,
    middleware::Next,
    web,
};
use serde_json::json;

use crate::config::AppConfig;

#[derive(Default)]
pub struct RateLimitState {
    buckets: Mutex<HashMap<String, VecDeque<Instant>>>,
}

impl RateLimitState {
    pub fn allow(&self, key: &str, limit: usize, window: Duration) -> bool {
        let now = Instant::now();
        let window_start = now.checked_sub(window).unwrap_or(now);
        let mut buckets = self
            .buckets
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let bucket = buckets.entry(key.to_string()).or_default();

        while bucket
            .front()
            .map(|requested_at| *requested_at <= window_start)
            .unwrap_or(false)
        {
            bucket.pop_front();
        }

        if bucket.len() >= limit {
            return false;
        }

        bucket.push_back(now);

        if buckets.len() > 10_000 {
            buckets.retain(|_, bucket| {
                bucket
                    .back()
                    .map(|requested_at| *requested_at > window_start)
                    .unwrap_or(false)
            });
        }

        true
    }
}

fn should_rate_limit(method: &Method, path: &str, admin_api_path: &str) -> bool {
    if method == Method::OPTIONS {
        return false;
    }

    method == Method::POST
        && (matches!(path, "/api/contact" | "/api/newsletter")
            || path.starts_with(&format!("/api{admin_api_path}/auth/")))
}

fn client_identifier(request: &ServiceRequest) -> String {
    if let Some(forwarded_for) = request
        .headers()
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        return forwarded_for.to_string();
    }

    request
        .peer_addr()
        .map(|address| address.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

fn too_many_requests_response() -> HttpResponse {
    HttpResponse::TooManyRequests().json(json!({
        "success": false,
        "message": "Too many requests. Please wait before trying again."
    }))
}

pub async fn rate_limit<B>(
    req: ServiceRequest,
    next: Next<B>,
) -> Result<ServiceResponse<EitherBody<B>>, Error>
where
    B: MessageBody + 'static,
{
    let Some(config) = req.app_data::<web::Data<AppConfig>>().cloned() else {
        return next
            .call(req)
            .await
            .map(ServiceResponse::map_into_left_body);
    };

    if !should_rate_limit(req.method(), req.path(), &config.admin_api_path) {
        return next
            .call(req)
            .await
            .map(ServiceResponse::map_into_left_body);
    }

    let Some(state) = req.app_data::<web::Data<RateLimitState>>().cloned() else {
        return next
            .call(req)
            .await
            .map(ServiceResponse::map_into_left_body);
    };

    let key = format!(
        "{}:{}:{}",
        client_identifier(&req),
        req.method(),
        req.path()
    );
    let limit = config.rate_limit_max_requests.max(1);
    let window = Duration::from_secs(config.rate_limit_window_seconds.max(1));

    if !state.allow(&key, limit, window) {
        let response = too_many_requests_response().map_into_right_body();
        return Ok(req.into_response(response));
    }

    next.call(req)
        .await
        .map(ServiceResponse::map_into_left_body)
}
