use actix_web::{Responder, web};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::AppConfig,
    db::DbPool,
    dto::property_dto::{PropertyRequest, PropertyStatusRequest},
    handlers::common,
    models::property::Property,
    utils::{
        media_cleanup::{cleanup_unused_uploads, refs_from_json_array},
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
      video_url,
      video_poster,
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

async fn fetch_property_by_id(pool: &DbPool, id: Uuid) -> Result<Option<Property>, sqlx::Error> {
    let query = format!("{} WHERE id = $1 LIMIT 1", property_select());

    sqlx::query_as::<_, Property>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await
}

fn property_media_refs(property: &Property) -> Vec<String> {
    let mut refs = Vec::new();

    refs.extend(property.main_image.clone());
    refs.extend(property.video_url.clone());
    refs.extend(property.video_poster.clone());
    refs.extend(refs_from_json_array(&property.gallery_images));

    refs
}

pub async fn list_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE ORDER BY created_at DESC",
        property_select()
    );

    match sqlx::query_as::<_, Property>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(properties) => common::ok("Visible properties fetched successfully", properties),
        Err(error) => common::server_error(error),
    }
}

pub async fn featured_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!(
        "{} WHERE is_visible = TRUE AND is_featured = TRUE ORDER BY created_at DESC",
        property_select()
    );

    match sqlx::query_as::<_, Property>(&query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(properties) => common::ok("Featured properties fetched successfully", properties),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_public_by_slug(
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
        Ok(Some(property)) => common::ok("Property fetched successfully", property),
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

pub async fn create_admin(
    pool: web::Data<DbPool>,
    payload: web::Json<PropertyRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let id = Uuid::new_v4();
    let slug = request
        .slug
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| slugify(&request.title));
    let features = json!(request.features.unwrap_or_default());
    let gallery_images = request.gallery_images;

    let query = format!(
        r#"
        INSERT INTO properties (
          id, title, slug, location, price, currency, property_type, status,
          bedrooms, bathrooms, area, main_image, image_alt, video_url, video_poster,
          description, features,
          is_featured, is_visible
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
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
        .bind(request.video_url)
        .bind(request.video_poster)
        .bind(request.description)
        .bind(features)
        .bind(request.is_featured.unwrap_or(false))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(property) => {
            match save_gallery_images(pool.get_ref(), property.id, gallery_images).await {
                Ok(()) => match fetch_property_by_id(pool.get_ref(), property.id).await {
                    Ok(Some(saved_property)) => {
                        common::created("Property created successfully", saved_property)
                    }
                    Ok(None) => common::created("Property created successfully", property),
                    Err(error) => common::server_error(error),
                },
                Err(error) => common::server_error(error),
            }
        }
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
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
            video_url = $14,
            video_poster = $15,
            description = $16,
            features = $17,
            is_featured = $18,
            is_visible = $19,
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
        .bind(request.video_url)
        .bind(request.video_poster)
        .bind(request.description)
        .bind(features)
        .bind(request.is_featured.unwrap_or(false))
        .bind(request.is_visible.unwrap_or(true))
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(property)) => {
            match save_gallery_images(pool.get_ref(), property.id, gallery_images).await {
                Ok(()) => match fetch_property_by_id(pool.get_ref(), property.id).await {
                    Ok(Some(saved_property)) => {
                        cleanup_unused_uploads(
                            pool.get_ref(),
                            &config.upload_dir,
                            property_media_refs(&old_property),
                            property_media_refs(&saved_property),
                        )
                        .await;
                        common::ok("Property updated successfully", saved_property)
                    }
                    Ok(None) => {
                        cleanup_unused_uploads(
                            pool.get_ref(),
                            &config.upload_dir,
                            property_media_refs(&old_property),
                            property_media_refs(&property),
                        )
                        .await;
                        common::ok("Property updated successfully", property)
                    }
                    Err(error) => common::server_error(error),
                },
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
