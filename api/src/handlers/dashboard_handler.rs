use actix_web::{Responder, web};
use serde_json::json;

use crate::{
    db::DbPool,
    handlers::common,
    models::{contact_message::ContactMessage, property::Property},
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

const MESSAGE_COLUMNS: &str = r#"
    id,
    full_name,
    email,
    phone,
    service_interested_in,
    message,
    status,
    created_at,
    updated_at
"#;

async fn count(pool: &DbPool, query: &str) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(query).fetch_one(pool).await
}

pub async fn get_admin(pool: web::Data<DbPool>) -> impl Responder {
    let pool_ref = pool.get_ref();

    let total_properties = match count(pool_ref, "SELECT COUNT(*) FROM properties").await {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let featured_properties = match count(
        pool_ref,
        "SELECT COUNT(*) FROM properties WHERE is_featured = TRUE",
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let available_properties = match count(
        pool_ref,
        "SELECT COUNT(*) FROM properties WHERE status = 'available'",
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let sold_properties = match count(
        pool_ref,
        "SELECT COUNT(*) FROM properties WHERE status = 'sold'",
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let total_services = match count(pool_ref, "SELECT COUNT(*) FROM services").await {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let total_testimonials = match count(pool_ref, "SELECT COUNT(*) FROM testimonials").await {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let unread_messages = match count(
        pool_ref,
        "SELECT COUNT(*) FROM contact_messages WHERE status = 'unread'",
    )
    .await
    {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };
    let subscribers = match count(pool_ref, "SELECT COUNT(*) FROM newsletter_subscribers").await {
        Ok(value) => value,
        Err(error) => return common::server_error(error),
    };

    let recent_properties_query =
        format!("SELECT {PROPERTY_COLUMNS} FROM properties ORDER BY created_at DESC LIMIT 4");
    let recent_properties = match sqlx::query_as::<_, Property>(&recent_properties_query)
        .fetch_all(pool_ref)
        .await
    {
        Ok(properties) => properties,
        Err(error) => return common::server_error(error),
    };

    let recent_messages_query =
        format!("SELECT {MESSAGE_COLUMNS} FROM contact_messages ORDER BY created_at DESC LIMIT 4");
    let recent_messages = match sqlx::query_as::<_, ContactMessage>(&recent_messages_query)
        .fetch_all(pool_ref)
        .await
    {
        Ok(messages) => messages,
        Err(error) => return common::server_error(error),
    };

    common::ok(
        "Admin dashboard fetched successfully",
        json!({
            "stats": [
                {
                    "id": "total-properties",
                    "label": "Total Properties",
                    "value": total_properties,
                    "helper": "All listings",
                    "iconKey": "houses"
                },
                {
                    "id": "featured-properties",
                    "label": "Featured",
                    "value": featured_properties,
                    "helper": "Shown on homepage",
                    "iconKey": "star"
                },
                {
                    "id": "available-properties",
                    "label": "Available",
                    "value": available_properties,
                    "helper": "Ready for enquiries",
                    "iconKey": "houseCheck"
                },
                {
                    "id": "sold-properties",
                    "label": "Sold",
                    "value": sold_properties,
                    "helper": "Closed listings",
                    "iconKey": "patchCheck"
                },
                {
                    "id": "total-services",
                    "label": "Services",
                    "value": total_services,
                    "helper": "Service cards",
                    "iconKey": "briefcase"
                },
                {
                    "id": "total-testimonials",
                    "label": "Testimonials",
                    "value": total_testimonials,
                    "helper": "Client stories",
                    "iconKey": "stars"
                },
                {
                    "id": "unread-messages",
                    "label": "Unread Messages",
                    "value": unread_messages,
                    "helper": "Need attention",
                    "iconKey": "chatDots"
                },
                {
                    "id": "subscribers",
                    "label": "Subscribers",
                    "value": subscribers,
                    "helper": "Newsletter audience",
                    "iconKey": "envelope"
                }
            ],
            "recentProperties": recent_properties,
            "recentMessages": recent_messages
        }),
    )
}
