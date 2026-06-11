use actix_web::web;

use crate::handlers::settings_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/settings/public",
        web::get().to(settings_handler::get_public),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/settings")
            .route("", web::get().to(settings_handler::get_admin))
            .route("", web::put().to(settings_handler::update_admin)),
    );
}
