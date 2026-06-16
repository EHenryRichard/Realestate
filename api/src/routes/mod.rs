pub mod admin_routes;
pub mod auth_routes;
pub mod blog_routes;
pub mod contact_routes;
pub mod dashboard_routes;
pub mod faq_routes;
pub mod newsletter_routes;
pub mod notification_routes;
pub mod property_routes;
pub mod public_routes;
pub mod service_routes;
pub mod settings_routes;
pub mod testimonial_routes;
pub mod upload_routes;

use actix_web::{middleware::from_fn, web};

use crate::middleware::auth_middleware::require_admin_access;

pub fn configure(cfg: &mut web::ServiceConfig, admin_api_path: &str) {
    cfg.configure(public_routes::configure).service(
        web::scope(admin_api_path)
            .wrap(from_fn(require_admin_access))
            .configure(admin_routes::configure),
    );
}
