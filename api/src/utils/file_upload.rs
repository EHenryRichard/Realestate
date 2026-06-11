pub fn is_allowed_image_extension(extension: &str) -> bool {
    matches!(
        extension.to_lowercase().as_str(),
        "jpg" | "jpeg" | "png" | "webp"
    )
}

pub fn is_allowed_video_extension(extension: &str) -> bool {
    matches!(
        extension.to_lowercase().as_str(),
        "mp4" | "mov" | "m4v" | "webm"
    )
}
