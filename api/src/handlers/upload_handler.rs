use std::{
    collections::HashMap,
    fs as std_fs,
    path::{Path, PathBuf},
    process::Stdio,
    sync::Mutex,
    time::{Duration, Instant},
};

use actix_multipart::{Field, Multipart};
use actix_web::{HttpRequest, HttpResponse, Responder, web};
use futures_util::StreamExt;
use image::{DynamicImage, imageops::FilterType};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::{fs, io::AsyncWriteExt, process::Command, sync::OnceCell, task};
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
const MAX_VIDEO_BYTES: u64 = 100 * 1024 * 1024;
const VIDEO_MAX_WIDTH: &str = "1280";
const VIDEO_MAX_WIDTH_PIXELS: u64 = 1280;
const VIDEO_PRESET: &str = "veryfast";
const VIDEO_TARGET_BITRATE: &str = "2200k";
const VIDEO_MAX_BITRATE: &str = "3000k";
const VIDEO_BUFFER_SIZE: &str = "6000k";
const VIDEO_AUDIO_BITRATE: &str = "96k";
// Files already at or below this bitrate are stream-copied instead of re-encoded.
const VIDEO_REMUX_MAX_BITRATE: u64 = 3_500_000;

// Hardware encoders to probe for, in order of preference. libx264 is the fallback.
const HARDWARE_VIDEO_ENCODERS: [&str; 3] = ["h264_nvenc", "h264_qsv", "h264_amf"];

static VIDEO_ENCODER: OnceCell<&'static str> = OnceCell::const_new();

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
    file_id: String,
    file_name: String,
    original_name: String,
    path: String,
    url: String,
    poster_path: String,
    poster_url: String,
    size: u64,
    status: &'static str,
}

const VIDEO_JOB_RETENTION: Duration = Duration::from_secs(60 * 60);

#[derive(Debug, Clone)]
pub enum VideoJobStatus {
    Processing,
    Ready { size: u64 },
    Failed { message: String },
}

#[derive(Debug)]
struct VideoJobEntry {
    status: VideoJobStatus,
    updated_at: Instant,
}

#[derive(Debug, Default)]
pub struct VideoJobs {
    jobs: Mutex<HashMap<String, VideoJobEntry>>,
}

impl VideoJobs {
    fn set(&self, file_id: String, status: VideoJobStatus) {
        let mut jobs = self
            .jobs
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        jobs.retain(|_, entry| entry.updated_at.elapsed() < VIDEO_JOB_RETENTION);
        jobs.insert(
            file_id,
            VideoJobEntry {
                status,
                updated_at: Instant::now(),
            },
        );
    }

    fn get(&self, file_id: &str) -> Option<VideoJobStatus> {
        let jobs = self
            .jobs
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        jobs.get(file_id).map(|entry| entry.status.clone())
    }
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

async fn detect_video_encoder(ffmpeg_path: &str) -> &'static str {
    for encoder in HARDWARE_VIDEO_ENCODERS {
        let status = Command::new(ffmpeg_path)
            .args([
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "color=size=256x256:rate=30:duration=0.3",
                "-frames:v",
                "8",
                "-c:v",
                encoder,
                "-f",
                "null",
                "-",
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await;

        if status.map(|status| status.success()).unwrap_or(false) {
            return encoder;
        }
    }

    "libx264"
}

async fn video_encoder(ffmpeg_path: &str) -> &'static str {
    *VIDEO_ENCODER
        .get_or_init(|| async {
            let encoder = detect_video_encoder(ffmpeg_path).await;
            tracing::info!("Video uploads will be compressed with the {encoder} encoder");
            encoder
        })
        .await
}

/// Returns true when the source is already browser-ready h264 at or below the
/// target width and bitrate, so a stream copy can replace the slow re-encode.
async fn can_remux_video(ffprobe_path: &str, source_path: &Path) -> bool {
    let output = match Command::new(ffprobe_path)
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("v:0")
        .arg("-show_entries")
        .arg("stream=codec_name,width,bit_rate")
        .arg("-show_entries")
        .arg("format=bit_rate")
        .arg("-of")
        .arg("default=noprint_wrappers=1")
        .arg(source_path)
        .output()
        .await
    {
        Ok(output) if output.status.success() => output,
        _ => return false,
    };

    let text = String::from_utf8_lossy(&output.stdout);
    let mut is_h264 = false;
    let mut width = 0_u64;
    let mut bitrate = 0_u64;

    for line in text.lines() {
        if let Some(value) = line.strip_prefix("codec_name=") {
            is_h264 = value.trim() == "h264";
        } else if let Some(value) = line.strip_prefix("width=") {
            width = value.trim().parse().unwrap_or(0);
        } else if let Some(value) = line.strip_prefix("bit_rate=") {
            // Stream bitrate first, container bitrate second; keep the larger
            // known value so borderline files still get re-encoded.
            bitrate = bitrate.max(value.trim().parse().unwrap_or(0));
        }
    }

    is_h264
        && width > 0
        && width <= VIDEO_MAX_WIDTH_PIXELS
        && bitrate > 0
        && bitrate <= VIDEO_REMUX_MAX_BITRATE
}

async fn remux_video(
    ffmpeg_path: &str,
    source_path: &Path,
    output_path: &Path,
) -> Result<(), String> {
    let mut command = Command::new(ffmpeg_path);
    command
        .arg("-y")
        .arg("-i")
        .arg(source_path)
        .arg("-c:v")
        .arg("copy")
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg(VIDEO_AUDIO_BITRATE)
        .arg("-movflags")
        .arg("+faststart")
        .arg(output_path);

    run_ffmpeg(&mut command).await
}

async fn encode_video(
    ffmpeg_path: &str,
    encoder: &str,
    source_path: &Path,
    output_path: &Path,
) -> Result<(), String> {
    let mut video_command = Command::new(ffmpeg_path);
    video_command
        .arg("-y")
        .arg("-i")
        .arg(source_path)
        .arg("-vf")
        .arg(format!("scale=min({VIDEO_MAX_WIDTH}\\,iw):-2"))
        .arg("-c:v")
        .arg(encoder);

    match encoder {
        "h264_nvenc" => {
            video_command.arg("-preset").arg("p4");
        }
        "h264_qsv" => {
            video_command.arg("-preset").arg("veryfast");
        }
        "h264_amf" => {
            video_command.arg("-quality").arg("speed");
        }
        _ => {
            video_command
                .arg("-preset")
                .arg(VIDEO_PRESET)
                .arg("-threads")
                .arg("0");
        }
    }

    video_command
        .arg("-b:v")
        .arg(VIDEO_TARGET_BITRATE)
        .arg("-maxrate")
        .arg(VIDEO_MAX_BITRATE)
        .arg("-bufsize")
        .arg(VIDEO_BUFFER_SIZE)
        .arg("-pix_fmt")
        .arg("yuv420p")
        .arg("-c:a")
        .arg("aac")
        .arg("-b:a")
        .arg(VIDEO_AUDIO_BITRATE)
        .arg("-movflags")
        .arg("+faststart")
        .arg(output_path);

    run_ffmpeg(&mut video_command).await
}

async fn compress_video(
    ffmpeg_path: &str,
    ffprobe_path: &str,
    source_path: &Path,
    output_path: &Path,
    poster_path: &Path,
) -> Result<(), String> {
    let remuxed = can_remux_video(ffprobe_path, source_path).await
        && remux_video(ffmpeg_path, source_path, output_path)
            .await
            .is_ok();

    if !remuxed {
        let encoder = video_encoder(ffmpeg_path).await;

        if let Err(error) = encode_video(ffmpeg_path, encoder, source_path, output_path).await {
            if encoder == "libx264" {
                return Err(error);
            }

            // Hardware encoder passed detection but failed on this file; retry on CPU.
            tracing::warn!("{encoder} encode failed ({error}); falling back to libx264");
            encode_video(ffmpeg_path, "libx264", source_path, output_path).await?;
        }
    }

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
    jobs: web::Data<VideoJobs>,
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

        let uploaded_size = match save_upload_field(
            &mut field,
            &source_destination,
            MAX_VIDEO_BYTES,
            "Each video must be 100MB or smaller",
        )
        .await
        {
            Ok(size) => size,
            Err(response) => return response,
        };

        let output_file_name = format!("{file_id}.mp4");
        let poster_file_name = format!("{file_id}-poster.webp");
        let output_destination = video_dir.join(&output_file_name);
        let poster_destination = poster_dir.join(&poster_file_name);

        jobs.set(file_id.clone(), VideoJobStatus::Processing);

        tokio::spawn({
            let jobs = jobs.clone().into_inner();
            let ffmpeg_path = config.ffmpeg_path.clone();
            let ffprobe_path = config.ffprobe_path.clone();
            let source_destination = source_destination.clone();
            let output_destination = output_destination.clone();
            let poster_destination = poster_destination.clone();
            let file_id = file_id.clone();

            async move {
                let result = compress_video(
                    &ffmpeg_path,
                    &ffprobe_path,
                    &source_destination,
                    &output_destination,
                    &poster_destination,
                )
                .await;

                let _ = fs::remove_file(&source_destination).await;

                match result {
                    Ok(()) => {
                        let size = fs::metadata(&output_destination)
                            .await
                            .map(|metadata| metadata.len())
                            .unwrap_or(0);

                        jobs.set(file_id, VideoJobStatus::Ready { size });
                    }
                    Err(message) => {
                        let _ = fs::remove_file(&output_destination).await;
                        let _ = fs::remove_file(&poster_destination).await;

                        tracing::error!("Video compression failed for {file_id}: {message}");
                        jobs.set(file_id, VideoJobStatus::Failed { message });
                    }
                }
            }
        });

        let relative_video_path = PathBuf::from("videos").join(&output_file_name);
        let relative_poster_path = PathBuf::from("posters").join(&poster_file_name);
        let path = public_upload_path(&relative_video_path);
        let poster_path = public_upload_path(&relative_poster_path);

        uploaded_videos.push(VideoUploadResponse {
            field: field_name,
            file_id,
            file_name: output_file_name,
            original_name,
            url: public_upload_url(&base_url, &path),
            path,
            poster_url: public_upload_url(&base_url, &poster_path),
            poster_path,
            size: uploaded_size,
            status: "processing",
        });
    }

    if uploaded_videos.is_empty() {
        return common::bad_request("No video file was uploaded");
    }

    if uploaded_videos.len() == 1 {
        common::created(
            "Video uploaded. Compression is running in the background.",
            uploaded_videos.remove(0),
        )
    } else {
        common::created(
            "Videos uploaded. Compression is running in the background.",
            uploaded_videos,
        )
    }
}

pub async fn video_upload_status(
    config: web::Data<AppConfig>,
    jobs: web::Data<VideoJobs>,
    path: web::Path<String>,
) -> impl Responder {
    let file_id = path.into_inner();

    if Uuid::parse_str(&file_id).is_err() {
        return common::bad_request("Invalid video id");
    }

    match jobs.get(&file_id) {
        Some(VideoJobStatus::Processing) => common::ok(
            "Video is still compressing",
            json!({ "status": "processing" }),
        ),
        Some(VideoJobStatus::Ready { size }) => common::ok(
            "Video is ready",
            json!({ "status": "ready", "size": size }),
        ),
        Some(VideoJobStatus::Failed { message }) => common::ok(
            "Video compression failed",
            json!({ "status": "failed", "message": message }),
        ),
        None => {
            // Unknown job (e.g. server restarted): fall back to checking the output file.
            let output_path = PathBuf::from(&config.upload_dir)
                .join("videos")
                .join(format!("{file_id}.mp4"));

            match fs::metadata(&output_path).await {
                Ok(metadata) => common::ok(
                    "Video is ready",
                    json!({ "status": "ready", "size": metadata.len() }),
                ),
                Err(_) => common::ok(
                    "Video compression failed",
                    json!({
                        "status": "failed",
                        "message": "Video processing was interrupted. Upload the video again."
                    }),
                ),
            }
        }
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
