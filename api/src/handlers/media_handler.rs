use std::path::{Component, Path, PathBuf};

use actix_files::NamedFile;
use actix_web::{HttpRequest, HttpResponse, Responder, http::header, web};
use serde::Deserialize;

use crate::{config::AppConfig, handlers::common, utils::media_signing::verify_video_url};

#[derive(Debug, Deserialize)]
pub struct SignedMediaQuery {
    pub exp: i64,
    pub sig: String,
}

/// Rejects path traversal and nested paths: only a bare file name is allowed.
fn safe_file_name(file_name: &str) -> Option<&str> {
    let mut components = Path::new(file_name).components();

    match (components.next(), components.next()) {
        (Some(Component::Normal(value)), None) => value.to_str(),
        _ => None,
    }
}

/// Streams a property video only when the request carries a valid, unexpired
/// signature. Direct/expired/forged links get 403. Range requests (seeking)
/// are handled by NamedFile.
pub async fn stream_video(
    config: web::Data<AppConfig>,
    request: HttpRequest,
    path: web::Path<String>,
    query: web::Query<SignedMediaQuery>,
) -> impl Responder {
    let file_name = path.into_inner();

    let Some(file_name) = safe_file_name(&file_name) else {
        return common::bad_request("Invalid video reference");
    };

    if !verify_video_url(&config.media_url_secret, file_name, query.exp, &query.sig) {
        return HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "message": "This video link is invalid or has expired."
        }));
    }

    let mut full_path = PathBuf::from(&config.upload_dir);
    full_path.push("videos");
    full_path.push(file_name);

    match NamedFile::open_async(&full_path).await {
        Ok(file) => file
            .use_last_modified(true)
            .set_content_disposition(header::ContentDisposition {
                disposition: header::DispositionType::Inline,
                parameters: Vec::new(),
            })
            .into_response(&request),
        Err(_) => common::not_found("Video not found"),
    }
}
