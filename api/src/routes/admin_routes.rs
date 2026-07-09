use actix_web::web;

use super::{
    admin_client_routes, auth_routes, blog_routes, dashboard_routes, faq_routes, newsletter_routes,
    notification_routes, property_routes, service_routes, settings_routes, testimonial_routes,
    upload_routes,
};
use crate::handlers::agent_handler;
use crate::routes::contact_routes;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/agent-requests")
            .route("", web::get().to(agent_handler::list_requests))
            .route("/{id}/approve", web::patch().to(agent_handler::approve_request))
            .route("/{id}/reject", web::patch().to(agent_handler::reject_request)),
    )
    .configure(auth_routes::configure)
        .configure(admin_client_routes::configure)
        .configure(dashboard_routes::configure_admin)
        .configure(property_routes::configure_admin)
        .configure(service_routes::configure_admin)
        .configure(testimonial_routes::configure_admin)
        .configure(faq_routes::configure_admin)
        .configure(blog_routes::configure_admin)
        .configure(contact_routes::configure_admin)
        .configure(newsletter_routes::configure_admin)
        .configure(notification_routes::configure_admin)
        .configure(settings_routes::configure_admin)
        .configure(upload_routes::configure_admin);
}
