use actix_web::web;

use super::{
    blog_routes, contact_routes, faq_routes, newsletter_routes, property_routes, service_routes,
    settings_routes, testimonial_routes,
};
use crate::handlers::{health_handler, media_handler};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/health").route(web::get().to(health_handler::health)))
        .service(
            web::resource("/stream/videos/{file_name}")
                .route(web::get().to(media_handler::stream_video)),
        )
        .configure(property_routes::configure_public)
        .configure(service_routes::configure_public)
        .configure(testimonial_routes::configure_public)
        .configure(faq_routes::configure_public)
        .configure(blog_routes::configure_public)
        .configure(contact_routes::configure_public)
        .configure(newsletter_routes::configure_public)
        .configure(settings_routes::configure_public);
}
