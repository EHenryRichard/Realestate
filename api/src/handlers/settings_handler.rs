use actix_web::{Responder, web};
use uuid::Uuid;

use crate::{
    config::AppConfig, db::DbPool, dto::settings_dto::SettingsRequest, handlers::common,
    models::site_settings::SiteSettings, utils::media_cleanup::cleanup_unused_uploads,
};

const SETTINGS_COLUMNS: &str = r#"
    id,
    brand_name,
    phone,
    whatsapp,
    email,
    address,
    tagline,
    facebook_url,
    instagram_url,
    linkedin_url,
    twitter_url,
    logo_url,
    favicon_url,
    og_image_url,
    created_at,
    updated_at
"#;

fn settings_select() -> String {
    format!("SELECT {SETTINGS_COLUMNS} FROM site_settings")
}

fn settings_media_refs(settings: &SiteSettings) -> Vec<String> {
    let mut refs = Vec::new();

    refs.extend(settings.logo_url.clone());
    refs.extend(settings.favicon_url.clone());
    refs.extend(settings.og_image_url.clone());

    refs
}

pub async fn get_public(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!("{} ORDER BY created_at ASC LIMIT 1", settings_select());

    match sqlx::query_as::<_, SiteSettings>(&query)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(settings)) => common::ok("Public settings fetched successfully", settings),
        Ok(None) => common::not_found("Public settings not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn get_admin(pool: web::Data<DbPool>) -> impl Responder {
    let query = format!("{} ORDER BY created_at ASC LIMIT 1", settings_select());

    match sqlx::query_as::<_, SiteSettings>(&query)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(settings)) => common::ok("Admin settings fetched successfully", settings),
        Ok(None) => common::not_found("Admin settings not found"),
        Err(error) => common::server_error(error),
    }
}

pub async fn update_admin(
    config: web::Data<AppConfig>,
    pool: web::Data<DbPool>,
    payload: web::Json<SettingsRequest>,
) -> impl Responder {
    let request = payload.into_inner();
    let existing_settings = sqlx::query_as::<_, SiteSettings>(&format!(
        "{} ORDER BY created_at ASC LIMIT 1",
        settings_select()
    ))
    .fetch_optional(pool.get_ref())
    .await;

    let existing_settings = match existing_settings {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };

    let saved_settings = if let Some(existing) = &existing_settings {
        let query = format!(
            r#"
            UPDATE site_settings
            SET brand_name = $2,
                phone = $3,
                whatsapp = $4,
                email = $5,
                address = $6,
                tagline = $7,
                facebook_url = $8,
                instagram_url = $9,
                linkedin_url = $10,
                twitter_url = $11,
                logo_url = $12,
                favicon_url = $13,
                og_image_url = $14,
                updated_at = now()
            WHERE id = $1
            RETURNING {SETTINGS_COLUMNS}
            "#
        );

        sqlx::query_as::<_, SiteSettings>(&query)
            .bind(existing.id)
            .bind(request.brand_name)
            .bind(request.phone)
            .bind(request.whatsapp)
            .bind(request.email)
            .bind(request.address)
            .bind(request.tagline)
            .bind(request.facebook_url)
            .bind(request.instagram_url)
            .bind(request.linkedin_url)
            .bind(request.twitter_url)
            .bind(request.logo_url)
            .bind(request.favicon_url)
            .bind(request.og_image_url)
            .fetch_one(pool.get_ref())
            .await
    } else {
        let query = format!(
            r#"
            INSERT INTO site_settings (
              id, brand_name, phone, whatsapp, email, address, tagline,
              facebook_url, instagram_url, linkedin_url, twitter_url,
              logo_url, favicon_url, og_image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING {SETTINGS_COLUMNS}
            "#
        );

        sqlx::query_as::<_, SiteSettings>(&query)
            .bind(Uuid::new_v4())
            .bind(request.brand_name)
            .bind(request.phone)
            .bind(request.whatsapp)
            .bind(request.email)
            .bind(request.address)
            .bind(request.tagline)
            .bind(request.facebook_url)
            .bind(request.instagram_url)
            .bind(request.linkedin_url)
            .bind(request.twitter_url)
            .bind(request.logo_url)
            .bind(request.favicon_url)
            .bind(request.og_image_url)
            .fetch_one(pool.get_ref())
            .await
    };

    match saved_settings {
        Ok(settings) => {
            if let Some(existing) = existing_settings {
                cleanup_unused_uploads(
                    pool.get_ref(),
                    &config.upload_dir,
                    settings_media_refs(&existing),
                    settings_media_refs(&settings),
                )
                .await;
            }
            common::ok("Settings saved successfully", settings)
        }
        Err(error) => common::server_error(error),
    }
}
