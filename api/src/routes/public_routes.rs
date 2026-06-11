use actix_web::web;

use super::{
    contact_routes, newsletter_routes, property_routes, service_routes, settings_routes,
    testimonial_routes,
};
use crate::handlers::health_handler;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/health").route(web::get().to(health_handler::health)))
        .configure(property_routes::configure_public)
        .configure(service_routes::configure_public)
        .configure(testimonial_routes::configure_public)
        .configure(contact_routes::configure_public)
        .configure(newsletter_routes::configure_public)
        .configure(settings_routes::configure_public);
}
