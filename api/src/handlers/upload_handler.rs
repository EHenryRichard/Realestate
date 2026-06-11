use std::{
    fs as std_fs,
    path::{Path, PathBuf},
    process::Stdio,
};

use actix_multipart::{Field, Multipart};
use actix_web::{HttpRequest, HttpResponse, Responder, web};
use futures_util::StreamExt;
use image::{DynamicImage, imageops::FilterType};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::{fs, io::AsyncWriteExt, process::Command, task};
use uuid::Uuid;
use webp::Encoder as WebPEncoder;

use crate::{
    config::AppConfig,
    db::DbPool,
    handlers::common,
    utils::{
        file_upload::{is_allowed_image_extension, is_allowed_video_extension},
        media_cleanup::cleanup_unused_uploads,
    },
};

const MAX_IMAGE_BYTES: u64 = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES: u64 = 250 * 1024 * 1024;

#[derive(Clone, Copy)]
struct ImageVariantSpec {
    key: &'static str,
    max_width: u32,
    quality: u8,
}

const IMAGE_VARIANTS: [ImageVariantSpec; 3] = [
    ImageVariantSpec {
        key: "thumbnail",
        max_width: 480,
        quality: 78,
    },
    ImageVariantSpec {
        key: "medium",
        max_width: 900,
        quality: 82,
    },
    ImageVariantSpec {
        key: "large",
        max_width: 1800,
        quality: 86,
    },
];

#[derive(Debug, Clone)]
struct ProcessedImageAsset {
    file_name: String,
    relative_path: PathBuf,
    width: u32,
    height: u32,
    size: u64,
}

#[derive(Debug)]
struct ProcessedImageSet {
    thumbnail: ProcessedImageAsset,
    medium: ProcessedImageAsset,
    large: ProcessedImageAsset,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageAssetResponse {
    path: String,
    url: String,
    width: u32,
    height: u32,
    size: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageVariantsResponse {
    thumbnail: ImageAssetResponse,
    medium: ImageAssetResponse,
    large: ImageAssetResponse,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageUploadResponse {
    field: String,
    file_name: String,
    original_name: String,
    path: String,
    url: String,
    width: u32,
    height: u32,
    size: u64,
    variants: ImageVariantsResponse,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct VideoUploadResponse {
    field: String,
    file_name: String,
    original_name: String,
    path: String,
    url: String,
    poster_path: String,
    poster_url: String,
    size: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteUploadsRequest {
    pub path: Option<String>,
    pub paths: Option<Vec<String>>,
}

fn upload_base_url(request: &HttpRequest) -> String {
    let connection_info = request.connection_info();
    format!("{}://{}", connection_info.scheme(), connection_info.host())
}

fn extension_from_filename(filename: &str) -> Option<String> {
    Path::new(filename)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_lowercase())
}

fn public_upload_path(relative_path: &Path) -> String {
    let path = relative_path.to_string_lossy().replace('\\', "/");
    format!("/uploads/{path}")
}

fn public_upload_url(base_url: &str, path: &str) -> String {
    format!("{base_url}{path}")
}

fn image_asset_response(base_url: &str, asset: &ProcessedImageAsset) -> ImageAssetResponse {
    let path = public_upload_path(&asset.relative_path);

    ImageAssetResponse {
        url: public_upload_url(base_url, &path),
        path,
        width: asset.width,
        height: asset.height,
        size: asset.size,
    }
}

async fn ensure_upload_dirs(dirs: &[PathBuf]) -> Result<(), HttpResponse> {
    for dir in dirs {
        if let Err(error) = fs::create_dir_all(dir).await {
            return Err(common::server_error(error));
        }
    }

    Ok(())
}

async fn save_upload_field(
    field: &mut Field,
    destination: &Path,
    max_bytes: u64,
    limit_message: &str,
) -> Result<u64, HttpResponse> {
    let mut file = fs::File::create(destination)
        .await
        .map_err(common::server_error)?;
    let mut size = 0_u64;

    while let Some(chunk) = field.next().await {
        let data = chunk
            .map_err(|error| common::bad_request(&format!("Invalid upload chunk: {error}")))?;

        size += data.len() as u64;
        if size > max_bytes {
            drop(file);
            let _ = fs::remove_file(destination).await;
            return Err(common::bad_request(limit_message));
        }

        file.write_all(&data).await.map_err(common::server_error)?;
    }

    Ok(size)
}

fn encode_image_variant(
    image: &DynamicImage,
    output_dir: &Path,
    stem: &str,
    spec: ImageVariantSpec,
) -> Result<ProcessedImageAsset, String> {
    let source_width = image.width();
    let resized = if source_width > spec.max_width {
        image.resize(spec.max_width, u32::MAX, FilterType::Lanczos3)
    } else {
        image.clone()
    };
    let rgba_image = resized.to_rgba8();
    let (width, height) = rgba_image.dimensions();
    let file_name = format!("{stem}-{}.webp", spec.key);
    let output_path = output_dir.join(&file_name);
    let encoder = WebPEncoder::from_rgba(rgba_image.as_raw(), width, height);
    let webp_image = encoder.encode(spec.quality as f32);

    std_fs::write(&output_path, &*webp_image).map_err(|error| error.to_string())?;

    let size = std_fs::metadata(&output_path)
        .map_err(|error| error.to_string())?
        .len();

    let relative_path = PathBuf::from("images").join(&file_name);

    Ok(ProcessedImageAsset {
        file_name,
        relative_path,
        width,
        height,
        size,
    })
}

fn process_image_sync(
    source_path: PathBuf,
    output_dir: PathBuf,
    stem: String,
) -> Result<ProcessedImageSet, String> {
    let image = image::open(&source_path).map_err(|error| error.to_string())?;
    let thumbnail = encode_image_variant(&image, &output_dir, &stem, IMAGE_VARIANTS[0])?;
    let medium = encode_image_variant(&image, &output_dir, &stem, IMAGE_VARIANTS[1])?;
    let large = encode_image_variant(&image, &output_dir, &stem, IMAGE_VARIANTS[2])?;

    Ok(ProcessedImageSet {
        thumbnail,
        medium,
        large,
    })
}

async fn run_ffmpeg(command: &mut Command) -> Result<(), String> {
    let output = command
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|_| {
            "ffmpeg is not available. Install ffmpeg or set FFMPEG_PATH to the ffmpeg binary."
                .to_string()
        })?;

    if output.status.success() {
        return Ok(());
    }

    let error = String::from_utf8_lossy(&output.stderr);
    let message = error.lines().take(6).collect::<Vec<&str>>().join(" ");

    Err(if message.trim().is_empty() {
        "Video compression failed".to_string()
    } else {
        message
    })
}

async fn compress_video(
    ffmpeg_path: &str,
    source_path: &Path,
    output_path: &Path,
    poster_path: &Path,
) -> Result<(), String> {
    let mut video_command = Command::new(ffmpeg_path);
    video_command
        .arg("-y")
        .arg("-i")
        .arg(source_path)
        .arg("-vf")
        .arg("scale=min(1920\\,iw):-2")
        .arg("-c:v")
        .arg("libx264")
        .arg("-preset")
        .arg("medium")
        .arg("-crf")
        .arg("23")
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg("128k")
        .arg("-movflags")
        .arg("+faststart")
        .arg(output_path);

    run_ffmpeg(&mut video_command).await?;

    let mut poster_command = Command::new(ffmpeg_path);
    poster_command
        .arg("-y")
        .arg("-ss")
        .arg("00:00:01")
        .arg("-i")
        .arg(output_path)
        .arg("-frames:v")
        .arg("1")
        .arg("-vf")
        .arg("scale=min(1280\\,iw):-2")
        .arg(poster_path);

    run_ffmpeg(&mut poster_command).await
}

pub async fn upload_images(
    config: web::Data<AppConfig>,
    request: HttpRequest,
    mut payload: Multipart,
) -> impl Responder {
    let upload_dir = PathBuf::from(&config.upload_dir);
    let source_dir = upload_dir.join("originals").join("images");
    let image_dir = upload_dir.join("images");

    if let Err(response) = ensure_upload_dirs(&[source_dir.clone(), image_dir.clone()]).await {
        return response;
    }

    let base_url = upload_base_url(&request);
    let mut uploaded_images = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(error) => return common::bad_request(&format!("Invalid upload field: {error}")),
        };

        let field_name = field.name().unwrap_or("file").to_string();
        let original_name = field
            .content_disposition()
            .and_then(|disposition| disposition.get_filename())
            .map(str::to_string);

        let Some(original_name) = original_name else {
            continue;
        };

        let Some(extension) = extension_from_filename(&original_name) else {
            return common::bad_request("Uploaded image must have a file extension");
        };

        if !is_allowed_image_extension(&extension) {
            return common::bad_request("Only jpg, jpeg, png, and webp images are allowed");
        }

        let file_id = Uuid::new_v4().to_string();
        let source_file_name = format!("{file_id}-source.{extension}");
        let source_destination = source_dir.join(source_file_name);

        if let Err(response) = save_upload_field(
            &mut field,
            &source_destination,
            MAX_IMAGE_BYTES,
            "Each image must be 8MB or smaller",
        )
        .await
        {
            return response;
        }

        let processed = match task::spawn_blocking({
            let source_destination = source_destination.clone();
            let image_dir = image_dir.clone();
            let file_id = file_id.clone();

            move || process_image_sync(source_destination, image_dir, file_id)
        })
        .await
        {
            Ok(Ok(processed)) => processed,
            Ok(Err(_)) => {
                let _ = fs::remove_file(&source_destination).await;
                return common::bad_request(
                    "Image could not be processed. Upload a valid jpg, png, or webp image.",
                );
            }
            Err(error) => return common::server_error(error),
        };

        let thumbnail = image_asset_response(&base_url, &processed.thumbnail);
        let medium = image_asset_response(&base_url, &processed.medium);
        let large = image_asset_response(&base_url, &processed.large);

        uploaded_images.push(ImageUploadResponse {
            field: field_name,
            file_name: processed.large.file_name,
            original_name,
            path: large.path.clone(),
            url: large.url.clone(),
            width: large.width,
            height: large.height,
            size: large.size,
            variants: ImageVariantsResponse {
                thumbnail,
                medium,
                large,
            },
        });
    }

    if uploaded_images.is_empty() {
        return common::bad_request("No image file was uploaded");
    }

    if uploaded_images.len() == 1 {
        common::created(
            "Image uploaded and optimized successfully",
            uploaded_images.remove(0),
        )
    } else {
        common::created(
            "Images uploaded and optimized successfully",
            uploaded_images,
        )
    }
}

pub async fn upload_videos(
    config: web::Data<AppConfig>,
    request: HttpRequest,
    mut payload: Multipart,
) -> impl Responder {
    let upload_dir = PathBuf::from(&config.upload_dir);
    let source_dir = upload_dir.join("originals").join("videos");
    let video_dir = upload_dir.join("videos");
    let poster_dir = upload_dir.join("posters");

    if let Err(response) =
        ensure_upload_dirs(&[source_dir.clone(), video_dir.clone(), poster_dir.clone()]).await
    {
        return response;
    }

    let base_url = upload_base_url(&request);
    let mut uploaded_videos = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(field) => field,
            Err(error) => return common::bad_request(&format!("Invalid upload field: {error}")),
        };

        let field_name = field.name().unwrap_or("file").to_string();
        let original_name = field
            .content_disposition()
            .and_then(|disposition| disposition.get_filename())
            .map(str::to_string);

        let Some(original_name) = original_name else {
            continue;
        };

        let Some(extension) = extension_from_filename(&original_name) else {
            return common::bad_request("Uploaded video must have a file extension");
        };

        if !is_allowed_video_extension(&extension) {
            return common::bad_request("Only mp4, mov, m4v, and webm videos are allowed");
        }

        let file_id = Uuid::new_v4().to_string();
        let source_file_name = format!("{file_id}-source.{extension}");
        let source_destination = source_dir.join(source_file_name);

        if let Err(response) = save_upload_field(
            &mut field,
            &source_destination,
            MAX_VIDEO_BYTES,
            "Each video must be 250MB or smaller",
        )
        .await
        {
            return response;
        }

        let output_file_name = format!("{file_id}.mp4");
        let poster_file_name = format!("{file_id}-poster.webp");
        let output_destination = video_dir.join(&output_file_name);
        let poster_destination = poster_dir.join(&poster_file_name);

        if let Err(error) = compress_video(
            &config.ffmpeg_path,
            &source_destination,
            &output_destination,
            &poster_destination,
        )
        .await
        {
            let _ = fs::remove_file(&source_destination).await;
            let _ = fs::remove_file(&output_destination).await;
            let _ = fs::remove_file(&poster_destination).await;

            if error.starts_with("ffmpeg is not available") {
                return HttpResponse::ServiceUnavailable().json(serde_json::json!({
                    "success": false,
                    "message": error
                }));
            }

            return common::server_error(error);
        }

        let size = match fs::metadata(&output_destination).await {
            Ok(metadata) => metadata.len(),
            Err(error) => return common::server_error(error),
        };
        let relative_video_path = PathBuf::from("videos").join(&output_file_name);
        let relative_poster_path = PathBuf::from("posters").join(&poster_file_name);
        let path = public_upload_path(&relative_video_path);
        let poster_path = public_upload_path(&relative_poster_path);

        uploaded_videos.push(VideoUploadResponse {
            field: field_name,
            file_name: output_file_name,
            original_name,
            url: public_upload_url(&base_url, &path),
            path,
            poster_url: public_upload_url(&base_url, &poster_path),
            poster_path,
            size,
        });
    }

    if uploaded_videos.is_empty() {
        return common::bad_request("No video file was uploaded");
    }

    if uploaded_videos.len() == 1 {
        common::created(
            "Video uploaded and compressed successfully",
            uploaded_videos.remove(0),
        )
    } else {
        common::created(
            "Videos uploaded and compressed successfully",
            uploaded_videos,
        )
    }
}

pub async fn delete_uploads(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<DeleteUploadsRequest>,
) -> impl Responder {
    let mut refs = Vec::new();

    if let Some(path) = payload
        .path
        .as_deref()
        .map(str::trim)
        .filter(|path| !path.is_empty())
    {
        refs.push(path.to_string());
    }

    if let Some(paths) = &payload.paths {
        refs.extend(
            paths
                .iter()
                .map(|path| path.trim())
                .filter(|path| !path.is_empty())
                .map(str::to_string),
        );
    }

    if refs.is_empty() {
        return common::bad_request("Provide at least one upload path to delete");
    }

    let requested = refs.len();
    cleanup_unused_uploads(pool.get_ref(), &config.upload_dir, refs, Vec::new()).await;

    common::ok(
        "Unused upload cleanup completed",
        json!({ "requested": requested }),
    )
}
