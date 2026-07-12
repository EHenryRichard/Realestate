use std::{
    collections::HashSet,
    path::{Component, Path, PathBuf},
    time::Duration,
};

use tokio::fs;
use tracing::{info, warn};

use crate::db::DbPool;

// Unreferenced files younger than this are kept: they may belong to an upload
// still compressing in the background or a form the admin has not saved yet.
const ORPHAN_GRACE_PERIOD: Duration = Duration::from_secs(24 * 60 * 60);

const SWEEP_DIRS: [&str; 5] = [
    "images",
    "videos",
    "posters",
    "originals/images",
    "originals/videos",
];

fn upload_key(reference: &str) -> Option<String> {
    let trimmed = reference.trim();
    let (_, relative) = trimmed.split_once("/uploads/")?;
    let mut parts = Vec::new();

    for component in Path::new(relative).components() {
        match component {
            Component::Normal(value) => parts.push(value.to_string_lossy().to_string()),
            _ => return None,
        }
    }

    if parts.is_empty() {
        None
    } else {
        Some(parts.join("/"))
    }
}

fn image_media_id(key: &str) -> Option<String> {
    let filename = key.strip_prefix("images/")?;

    filename
        .strip_suffix("-large.webp")
        .or_else(|| filename.strip_suffix("-medium.webp"))
        .or_else(|| filename.strip_suffix("-thumbnail.webp"))
        .map(str::to_string)
}

fn video_media_id(key: &str) -> Option<String> {
    if let Some(filename) = key.strip_prefix("videos/") {
        return filename.strip_suffix(".mp4").map(str::to_string);
    }

    key.strip_prefix("posters/")
        .and_then(|filename| filename.strip_suffix("-poster.webp"))
        .map(str::to_string)
}

fn image_group_keys(media_id: &str) -> Vec<String> {
    ["thumbnail", "medium", "large"]
        .into_iter()
        .map(|variant| format!("images/{media_id}-{variant}.webp"))
        .collect()
}

fn video_group_keys(media_id: &str) -> Vec<String> {
    vec![
        format!("videos/{media_id}.mp4"),
        format!("posters/{media_id}-poster.webp"),
    ]
}

fn safe_upload_path(upload_dir: &Path, key: &str) -> Option<PathBuf> {
    let mut relative = PathBuf::new();

    for component in Path::new(key).components() {
        match component {
            Component::Normal(value) => relative.push(value),
            _ => return None,
        }
    }

    Some(upload_dir.join(relative))
}

async fn remove_file_if_inside_upload_dir(upload_dir: &Path, key: &str) -> std::io::Result<()> {
    let Some(target) = safe_upload_path(upload_dir, key) else {
        return Ok(());
    };

    let upload_root = match fs::canonicalize(upload_dir).await {
        Ok(path) => path,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };
    let target = match fs::canonicalize(&target).await {
        Ok(path) => path,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };

    if target.starts_with(upload_root) && target.is_file() {
        fs::remove_file(target).await?;
    }

    Ok(())
}

async fn remove_original_with_prefix(
    upload_dir: &Path,
    source_dir_key: &str,
    media_id: &str,
) -> std::io::Result<()> {
    let Some(source_dir) = safe_upload_path(upload_dir, source_dir_key) else {
        return Ok(());
    };
    let mut entries = match fs::read_dir(&source_dir).await {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };
    let prefix = format!("{media_id}-source.");

    while let Some(entry) = entries.next_entry().await? {
        let file_name = entry.file_name().to_string_lossy().to_string();

        if file_name.starts_with(&prefix) {
            let key = format!("{source_dir_key}/{file_name}");
            remove_file_if_inside_upload_dir(upload_dir, &key).await?;
        }
    }

    Ok(())
}

async fn live_upload_keys(pool: &DbPool) -> Result<HashSet<String>, sqlx::Error> {
    let refs = sqlx::query_scalar::<_, String>(
        r#"
        SELECT media_ref FROM (
            SELECT main_image AS media_ref FROM properties WHERE main_image IS NOT NULL
            UNION ALL SELECT video_url FROM property_videos WHERE video_url IS NOT NULL
            UNION ALL SELECT poster_url FROM property_videos WHERE poster_url IS NOT NULL
            UNION ALL SELECT image_url FROM property_gallery_images WHERE image_url IS NOT NULL
            UNION ALL SELECT image FROM services WHERE image IS NOT NULL
            UNION ALL SELECT avatar FROM testimonials WHERE avatar IS NOT NULL
            UNION ALL SELECT logo_url FROM site_settings WHERE logo_url IS NOT NULL
            UNION ALL SELECT favicon_url FROM site_settings WHERE favicon_url IS NOT NULL
            UNION ALL SELECT og_image_url FROM site_settings WHERE og_image_url IS NOT NULL
            UNION ALL SELECT content->'hero'->>'image' FROM about_content WHERE content->'hero'->>'image' IS NOT NULL
            UNION ALL SELECT content->'founder'->>'photo' FROM about_content WHERE content->'founder'->>'photo' IS NOT NULL
            UNION ALL SELECT content->'seo'->>'ogImage' FROM about_content WHERE content->'seo'->>'ogImage' IS NOT NULL
            UNION ALL SELECT photo FROM team_members WHERE photo IS NOT NULL
        ) AS media_refs
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(refs
        .into_iter()
        .filter_map(|reference| upload_key(&reference))
        .collect())
}

async fn remove_generated_group(upload_dir: &Path, key: &str) -> std::io::Result<()> {
    if let Some(media_id) = image_media_id(key) {
        for group_key in image_group_keys(&media_id) {
            remove_file_if_inside_upload_dir(upload_dir, &group_key).await?;
        }
        remove_original_with_prefix(upload_dir, "originals/images", &media_id).await?;
        return Ok(());
    }

    if let Some(media_id) = video_media_id(key) {
        for group_key in video_group_keys(&media_id) {
            remove_file_if_inside_upload_dir(upload_dir, &group_key).await?;
        }
        remove_original_with_prefix(upload_dir, "originals/videos", &media_id).await?;
        return Ok(());
    }

    remove_file_if_inside_upload_dir(upload_dir, key).await
}

fn group_is_still_referenced(key: &str, referenced_keys: &HashSet<String>) -> bool {
    if let Some(media_id) = image_media_id(key) {
        return image_group_keys(&media_id)
            .into_iter()
            .any(|group_key| referenced_keys.contains(&group_key));
    }

    if let Some(media_id) = video_media_id(key) {
        return video_group_keys(&media_id)
            .into_iter()
            .any(|group_key| referenced_keys.contains(&group_key));
    }

    referenced_keys.contains(key)
}

pub fn refs_from_json_array(value: &serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str())
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn original_group_keys(key: &str) -> Option<Vec<String>> {
    let (source_dir, group_keys_for): (&str, fn(&str) -> Vec<String>) =
        if key.starts_with("originals/images/") {
            ("originals/images/", image_group_keys)
        } else if key.starts_with("originals/videos/") {
            ("originals/videos/", video_group_keys)
        } else {
            return None;
        };

    let file_name = key.strip_prefix(source_dir)?;
    let (media_id, _) = file_name.split_once("-source.")?;

    Some(group_keys_for(media_id))
}

fn key_is_orphaned(key: &str, live_keys: &HashSet<String>) -> bool {
    if let Some(group_keys) = original_group_keys(key) {
        return !group_keys
            .into_iter()
            .any(|group_key| live_keys.contains(&group_key));
    }

    !group_is_still_referenced(key, live_keys)
}

/// Deletes uploaded files that are no longer referenced anywhere in the
/// database. Files modified within the grace period are always kept.
pub async fn sweep_orphaned_uploads(pool: &DbPool, upload_dir: &str) {
    let live_keys = match live_upload_keys(pool).await {
        Ok(keys) => keys,
        Err(error) => {
            warn!("Could not load live upload references for orphan sweep: {error}");
            return;
        }
    };
    let upload_root = PathBuf::from(upload_dir);
    let mut removed = 0_u32;

    for dir_key in SWEEP_DIRS {
        let dir_path = upload_root.join(dir_key.replace('/', std::path::MAIN_SEPARATOR_STR));
        let mut entries = match fs::read_dir(&dir_path).await {
            Ok(entries) => entries,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => {
                warn!("Could not scan upload directory {dir_key}: {error}");
                continue;
            }
        };

        loop {
            let entry = match entries.next_entry().await {
                Ok(Some(entry)) => entry,
                Ok(None) => break,
                Err(error) => {
                    warn!("Could not read upload directory {dir_key}: {error}");
                    break;
                }
            };
            let Ok(metadata) = entry.metadata().await else {
                continue;
            };

            if !metadata.is_file() {
                continue;
            }

            let recently_modified = metadata
                .modified()
                .ok()
                .and_then(|modified| modified.elapsed().ok())
                .map(|age| age < ORPHAN_GRACE_PERIOD)
                .unwrap_or(true);

            if recently_modified {
                continue;
            }

            let key = format!("{dir_key}/{}", entry.file_name().to_string_lossy());

            if !key_is_orphaned(&key, &live_keys) {
                continue;
            }

            match remove_file_if_inside_upload_dir(&upload_root, &key).await {
                Ok(()) => removed += 1,
                Err(error) => warn!("Could not remove orphaned upload {key}: {error}"),
            }
        }
    }

    if removed > 0 {
        info!("Orphan sweep removed {removed} unused upload file(s)");
    }
}

pub async fn cleanup_unused_uploads(
    pool: &DbPool,
    upload_dir: &str,
    old_refs: Vec<String>,
    keep_refs: Vec<String>,
) {
    let upload_dir = PathBuf::from(upload_dir);
    let old_keys: HashSet<String> = old_refs
        .into_iter()
        .filter_map(|reference| upload_key(&reference))
        .collect();
    let keep_keys: HashSet<String> = keep_refs
        .into_iter()
        .filter_map(|reference| upload_key(&reference))
        .collect();
    let live_keys = match live_upload_keys(pool).await {
        Ok(keys) => keys,
        Err(error) => {
            warn!("Could not check live upload references before cleanup: {error}");
            return;
        }
    };
    let referenced_keys = keep_keys.union(&live_keys).cloned().collect::<HashSet<_>>();

    for key in old_keys {
        if group_is_still_referenced(&key, &referenced_keys) {
            continue;
        }

        if let Err(error) = remove_generated_group(&upload_dir, &key).await {
            warn!("Could not remove unused uploaded media {key}: {error}");
        }
    }
}
