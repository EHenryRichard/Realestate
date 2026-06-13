use actix_web::web;

use super::{
    auth_routes, dashboard_routes, newsletter_routes, notification_routes, property_routes,
    service_routes, settings_routes, testimonial_routes, upload_routes,
};
use crate::routes::contact_routes;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.configure(auth_routes::configure)
        .configure(dashboard_routes::configure_admin)
        .configure(property_routes::configure_admin)
        .configure(service_routes::configure_admin)
        .configure(testimonial_routes::configure_admin)
        .configure(contact_routes::configure_admin)
        .configure(newsletter_routes::configure_admin)
        .configure(notification_routes::configure_admin)
        .configure(settings_routes::configure_admin)
        .configure(upload_routes::configure_admin);
}
