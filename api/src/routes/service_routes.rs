use actix_web::web;

use crate::handlers::service_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/services")
            .route("", web::get().to(service_handler::list_public))
            .route(
                "/{slug}",
                web::get().to(service_handler::get_public_by_slug),
            ),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/services")
            .route("", web::get().to(service_handler::list_admin))
            .route("", web::post().to(service_handler::create_admin))
            .route("/{id}", web::get().to(service_handler::get_admin_by_id))
            .route("/{id}", web::put().to(service_handler::update_admin))
            .route("/{id}", web::delete().to(service_handler::delete_admin))
            .route(
                "/{id}/active",
                web::patch().to(service_handler::toggle_active_admin),
            ),
    );
}
