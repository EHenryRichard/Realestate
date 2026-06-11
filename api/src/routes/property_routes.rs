use actix_web::web;

use crate::handlers::property_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/properties")
            .route("", web::get().to(property_handler::list_public))
            .route(
                "/featured",
                web::get().to(property_handler::featured_public),
            )
            .route(
                "/{slug}",
                web::get().to(property_handler::get_public_by_slug),
            ),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/properties")
            .route("", web::get().to(property_handler::list_admin))
            .route("", web::post().to(property_handler::create_admin))
            .route("/{id}", web::get().to(property_handler::get_admin_by_id))
            .route("/{id}", web::put().to(property_handler::update_admin))
            .route("/{id}", web::delete().to(property_handler::delete_admin))
            .route(
                "/{id}/featured",
                web::patch().to(property_handler::toggle_featured_admin),
            )
            .route(
                "/{id}/status",
                web::patch().to(property_handler::update_status_admin),
            ),
    );
}
