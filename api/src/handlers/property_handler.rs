use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::property_dto::{PropertyRequest, PropertyStatusRequest, PropertyVideoRequest},
    handlers::common,
    models::property::Property,
    services::{email_service::Mailer, property_alert_service},
    utils::{
        media_cleanup::{cleanup_unused_uploads, refs_from_json_array},
        media_signing::signed_video_url,
        pagination::{PaginationQuery, make_pagination_meta},
        slug::slugify,
    },
};

const PROPERTY_COLUMNS: &str = r#"
      id,
      title,
      slug,
      location,
      price::FLOAT8 AS price,
      currency,
      property_type,
      status,
      bedrooms,
      bathrooms,
      area,
      main_image,
      image_alt,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object('url', video_url, 'poster', poster_url)
          ORDER BY sort_order
        )
        FROM property_videos
        WHERE property_videos.property_id = properties.id
      ), '[]'::jsonb) AS videos,
      COALESCE((
        SELECT jsonb_agg(image_url ORDER BY sort_order)
        FROM property_gallery_images
        WHERE property_gallery_images.property_id = properties.id
      ), '[]'::jsonb) AS gallery_images,
      description,
      features,
      is_featured,
      is_visible,
      created_at,
      updated_at
"#;

fn property_select() -> String {
    format!("SELECT {PROPERTY_COLUMNS} FROM properties")
}

fn parse_id(path: web::Path<String>) -> Result<Uuid, actix_web::HttpResponse> {
    Uuid::parse_str(&path.into_inner()).map_err(|_| common::bad_request("Invalid property id"))
}

async fn save_gallery_images(
    pool: &DbPool,
    property_id: Uuid,
    gallery_images: Option<Vec<String>>,
) -> Result<(), sqlx::Error> {
    let Some(images) = gallery_images else {
        return Ok(());
    };

    sqlx::query("DELETE FROM property_gallery_images WHERE property_id = $1")
        .bind(property_id)
        .execute(pool)
        .await?;

    for (index, image_url) in images
        .into_iter()
        .filter(|image| !image.trim().is_empty())
        .enumerate()
    {
        sqlx::query(
            r#"
            INSERT INTO property_gallery_images (id, property_id, image_url, sort_order)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(property_id)
        .bind(image_url.trim().to_string())
        .bind(index as i32)
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn save_property_videos(
    pool: &DbPool,
    property_id: Uuid,
    videos: Option<Vec<PropertyVideoRequest>>,
) -> Result<(), sqlx::Error> {
    let Some(videos) = videos else {
        return Ok(());
    };

    sqlx::query("DELETE FROM property_videos WHERE property_id = $1")
        .bind(property_id)
        .execute(pool)
        .await?;

    for (index, video) in videos
        .into_iter()
        .filter(|video| !video.url.trim().is_empty())
        .enumerate()
    {
        sqlx::query(
            r#"
            INSERT INTO property_videos (id, property_id, video_url, poster_url, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(property_id)
        .bind(video.url.trim().to_string())
        .bind(
            video
                .poster
                .as_deref()
                .map(str::trim)
                .filter(|poster| !poster.is_empty())
                .map(str::to_string),
        )
        .bind(index as i32)
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn fetch_property_by_id(pool: &DbPool, id: Uuid) -> Result<Option<Property>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", property_select());

    sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

/// Replaces stored `/uploads/videos/<file>` URLs with signed, expiring stream
/// URLs so public links cannot be shared or hotlinked. Posters are left as-is.
fn sign_property_videos(property: &mut Property, config: &AppConfig) {
    let Some(videos) = property.videos.as_array_mut() else {
        return;
    };

    for video in videos {
        let Some(url) = video.get("url").and_then(|value| value.as_str()) else {
            continue;
        };
        let Some(file_name) = url.rsplit('/').next().filter(|name| !name.is_empty()) else {
            continue;
        };

        let signed = signed_video_url(
            &config.media_url_secret,
            file_name,
            config.media_url_ttl_seconds,
        );
        video["url"] = json!(signed);
    }
}

fn sign_properties_videos(properties: &mut [Property], config: &AppConfig) {
    for property in properties.iter_mut() {
        sign_property_videos(property, config);
    }
}

fn property_media_refs(property: &Property) -> Vec<String> {
    let mut refs = Vec::new();

    refs.extend(property.main_image.clone());

    if let Some(videos) = property.videos.as_array() {
        for video in videos {
            for key in ["url", "poster"] {
                if let Some(value) = video.get(key).and_then(|value| value.as_str()) {
                    refs.push(value.to_string());
                }
            }
        }
    }

    refs.extend(refs_from_json_array(&property.gallery_images));

    refs
}

pub async fn list_public(config: web::Data<AppConfig>, pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE ORDER BY created_at DESC",
        property_select()
    );

    match sqlx::query_as::<_, Property>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(mut properties) => {
            sign_properties_videos(&mut properties, config.get_ref());
            common::ok("Visible properties fetched successfully", properties)
        }
        Err(error) => common::server_error(error),
    }
}

pub async fn featured_public(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE AND is_featured = TRUE ORDER BY created_at DESC",
        property_select()
    );

    match sqlx::query_as::<_, Property>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(mut properties) => {
            sign_properties_videos(&mut properties, config.get_ref());
            common::ok("Featured properties fetched successfully", properties)
        }
        Err(error) => common::server_error(error),
    }
}

pub async fn get_public_by_slug(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let query = format!(
        "{} WHERE slug = $1 AND is_visible = TRUE LIMIT 1",
        property_select()
    );

    match sqlx::query_as::<_, Property>(&query)
        .bind(path.into_inner())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(mut property)) => {
            sign_property_videos(&mut property, config.get_ref());
            common::ok("Property fetched successfully", property)
        }
        Ok(None) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn list_admin(
    pool: web::Data<DbPool>,
    query: web::Query<PaginationQuery>,
) -> impl Responder {
    let params = query.into_inner();
    let search = params.search_pattern();
    let status = params
        .status
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let property_type = params
        .property_type
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let count_query = r#"
        SELECT COUNT(*)
        FROM properties
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)
          AND ($2::TEXT IS NULL OR status = $2)
          AND ($3::TEXT IS NULL OR property_type = $3)
          AND ($4::BOOLEAN IS NULL OR is_visible = $4)
    "#;
    let total = match sqlx::query_scalar::<_, i64>(count_query)
        .bind(search.clone())
        .bind(status.clone())
        .bind(property_type.clone())
        .bind(params.is_visible)
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(total) => total.max(0) as u64,
        Err(error) => return common::server_error(error),
    };
    let list_query = format!(
        r#"
        {}
        WHERE ($1::TEXT IS NULL OR title ILIKE $1 OR location ILIKE $1 OR description ILIKE $1)
          AND ($2::TEXT IS NULL OR status = $2)
          AND ($3::TEXT IS NULL OR property_type = $3)
          AND ($4::BOOLEAN IS NULL OR is_visible = $4)
        ORDER BY created_at DESC
        LIMIT $5 OFFSET $6
        "#,
        property_select()
    );

    match sqlx::query_as::<_, Property>(&list_query)
        .bind(search)
        .bind(status)
        .bind(property_type)
        .bind(params.is_visible)
        .bind(params.limit() as i64)
        .bind(params.offset())
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(properties) => common::list(
            "Admin properties fetched successfully",
            properties,
            make_pagination_meta(params.page(), params.limit(), total),
        ),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin_by_id(pool: web::Data<DbPool>, path: web::Path<String>) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!("{} WHERE id = $1 LIMIT 1", property_select());

    match sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(property)) => common::ok("Admin property fetched successfully", property),
        Ok(None) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}

/// Returns a slug that's free in the `properties` table. If `base` is taken it
/// appends `-2`, `-3`, … until it finds an unused one. This lets an admin upload
/// the same/similar listing repeatedly without a "duplicate slug" error and
/// without refreshing the form.
async fn unique_slug(pool: &DbPool, base: &str) -> Result<String, sqlx::Error> {
    let base = if base.trim().is_empty() {
        "property".to_string()
    } else {
        base.to_string()
    };

    // Grab the base and any "base-<n>" already in use, in one query.
    let taken: Vec<String> = sqlx::query_scalar(
        "SELECT slug FROM properties WHERE slug = $1 OR slug LIKE $2",
    )
    .bind(&base)
    .bind(format!("{base}-%"))
    .fetch_all(pool)
    .await?;

    if !taken.iter().any(|slug| slug == &base) {
        return Ok(base);
    }

    let mut n = 2;
    loop {
        let candidate = format!("{base}-{n}");
        if !taken.iter().any(|slug| slug == &candidate) {
            return Ok(candidate);
        }
        n += 1;
    }
}

pub async fn create_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>,
    payload: web::Json<PropertyRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    // Desired slug (from the form or generated from the title), then made unique.
    let base_slug = request
        .slug
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| slugify(&request.title));
    let slug = match unique_slug(pool.get_ref(), &base_slug).await {
        Ok(slug) => slug,
        Err(error) => return common::server_error(error),
    };
    let features = json!(request.features.unwrap_or_default());
    let gallery_images = request.gallery_images;
    let videos = request.videos;

    let query = format!(
        r#"
        INSERT INTO properties (
          id, title, slug, location, price, currency, property_type, status,
          bedrooms, bathrooms, area, main_image, image_alt,
          description, features,
          is_featured, is_visible
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING {}
        "#,
        PROPERTY_COLUMNS
    );

    match sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .bind(request.title)
        .bind(slug)
        .bind(request.location)
        .bind(request.price)
        .bind(request.currency.unwrap_or_else(|| "NGN".to_string()))
        .bind(request.property_type)
        .bind(request.status)
        .bind(request.bedrooms)
        .bind(request.bathrooms)
        .bind(request.area)
        .bind(request.main_image)
        .bind(request.image_alt)
        .bind(request.description)
        .bind(features)
        .bind(request.is_featured.unwrap_or(false))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(property) => {
            let saved = save_gallery_images(pool.get_ref(), property.id, gallery_images).await;
            let saved = match saved {
                Ok(()) => save_property_videos(pool.get_ref(), property.id, videos).await,
                Err(error) => Err(error),
            };

            match saved {
                Ok(()) => {
                    // Prefer the fully-hydrated property (with gallery/videos);
                    // fall back to the base row if the re-fetch finds nothing.
                    let final_property = match fetch_property_by_id(pool.get_ref(), property.id).await
                    {
                        Ok(Some(saved_property)) => saved_property,
                        Ok(None) => property,
                        Err(error) => return common::server_error(error),
                    };

                    // Fan out new-listing alerts in the background so publishing
                    // stays instant. Everything here is Clone + owned so it can
                    // outlive this request.
                    let alert_property = final_property.clone();
                    let alert_pool = pool.get_ref().clone();
                    let alert_mailer = mailer.get_ref().clone();
                    let alert_config = config.get_ref().clone();
                    tokio::spawn(async move {
                        property_alert_service::notify_matching_clients(
                            alert_pool,
                            alert_mailer,
                            alert_config,
                            alert_property,
                            property_alert_service::AlertReason::NewListing,
                        )
                        .await;
                    });

                    common::created("Property created successfully", final_property)
                }
                Err(error) => common::server_error(error),
            }
        }
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    mailer: web::Data<Mailer>,
    path: web::Path<String>,
    payload: web::Json<PropertyRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_property = match fetch_property_by_id(pool.get_ref(), id).await {
        Ok(Some(property)) => property,
        Ok(None) => return common::not_found("Property not found"),
        Err(error) => return common::server_error(error),
    };
    let request = payload.into_inner();
    let slug = request
        .slug
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| slugify(&request.title));
    let features = json!(request.features.unwrap_or_default());
    let gallery_images = request.gallery_images;
    let videos = request.videos;

    let query = format!(
        r#"
        UPDATE properties
        SET title = $2,
            slug = $3,
            location = $4,
            price = $5,
            currency = $6,
            property_type = $7,
            status = $8,
            bedrooms = $9,
            bathrooms = $10,
            area = $11,
            main_image = $12,
            image_alt = $13,
            description = $14,
            features = $15,
            is_featured = $16,
            is_visible = $17,
            updated_at = now()
        WHERE id = $1
        RETURNING {}
        "#,
        PROPERTY_COLUMNS
    );

    match sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .bind(request.title)
        .bind(slug)
        .bind(request.location)
        .bind(request.price)
        .bind(request.currency.unwrap_or_else(|| "NGN".to_string()))
        .bind(request.property_type)
        .bind(request.status)
        .bind(request.bedrooms)
        .bind(request.bathrooms)
        .bind(request.area)
        .bind(request.main_image)
        .bind(request.image_alt)
        .bind(request.description)
        .bind(features)
        .bind(request.is_featured.unwrap_or(false))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(property)) => {
            let saved = save_gallery_images(pool.get_ref(), property.id, gallery_images).await;
            let saved = match saved {
                Ok(()) => save_property_videos(pool.get_ref(), property.id, videos).await,
                Err(error) => Err(error),
            };

            match saved {
                Ok(()) => {
                    // Prefer the fully-hydrated row; fall back to the base row.
                    let final_property = match fetch_property_by_id(pool.get_ref(), property.id).await
                    {
                        Ok(Some(saved_property)) => saved_property,
                        Ok(None) => property,
                        Err(error) => return common::server_error(error),
                    };

                    cleanup_unused_uploads(
                        pool.get_ref(),
                        &config.upload_dir,
                        property_media_refs(&old_property),
                        property_media_refs(&final_property),
                    )
                    .await;

                    // Meaningful-change alerts only: a listing going live (hidden →
                    // visible) or a price drop on an already-visible listing. Routine
                    // edits stay silent so we don't spam users.
                    let became_visible = !old_property.is_visible && final_property.is_visible;
                    let price_dropped = old_property.is_visible
                        && final_property.is_visible
                        && final_property.price < old_property.price;

                    if became_visible || price_dropped {
                        let reason = if became_visible {
                            property_alert_service::AlertReason::NewListing
                        } else {
                            property_alert_service::AlertReason::PriceDrop
                        };
                        let alert_property = final_property.clone();
                        let alert_pool = pool.get_ref().clone();
                        let alert_mailer = mailer.get_ref().clone();
                        let alert_config = config.get_ref().clone();
                        tokio::spawn(async move {
                            property_alert_service::notify_matching_clients(
                                alert_pool,
                                alert_mailer,
                                alert_config,
                                alert_property,
                                reason,
                            )
                            .await;
                        });
                    }

                    common::ok("Property updated successfully", final_property)
                }
                Err(error) => common::server_error(error),
            }
        }
        Ok(None) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn delete_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let old_property = match fetch_property_by_id(pool.get_ref(), id).await {
        Ok(Some(property)) => property,
        Ok(None) => return common::not_found("Property not found"),
        Err(error) => return common::server_error(error),
    };

    match sqlx::query("DELETE FROM properties WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            cleanup_unused_uploads(
                pool.get_ref(),
                &config.upload_dir,
                property_media_refs(&old_property),
                Vec::new(),
            )
            .await;
            common::ok("Property deleted successfully", json!({ "id": id }))
        }
        Ok(_) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn toggle_featured_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE properties
        SET is_featured = NOT is_featured,
            updated_at = now()
        WHERE id = $1
        RETURNING {}
        "#,
        PROPERTY_COLUMNS
    );

    match sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(property)) => common::ok("Property featured status updated", property),
        Ok(None) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_status_admin(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    payload: web::Json<PropertyStatusRequest>,
) -> impl Responder {
    let id = match parse_id(path) {
        Ok(id) => id,
        Err(response) => return response,
    };
    let query = format!(
        r#"
        UPDATE properties
        SET status = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING {}
        "#,
        PROPERTY_COLUMNS
    );

    match sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .bind(payload.status.clone())
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(property)) => common::ok("Property status updated successfully", property),
        Ok(None) => common::not_found("Property not found"),
        Err(error) => common::server_error(error),
    }
}
