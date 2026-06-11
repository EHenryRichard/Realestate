use actix_web::web;

use crate::handlers::newsletter_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/newsletter",
        web::post().to(newsletter_handler::subscribe_public),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/newsletter")
            .route("", web::get().to(newsletter_handler::list_admin))
            .route("/{id}", web::delete().to(newsletter_handler::delete_admin))
            .route(
                "/{id}/status",
                web::patch().to(newsletter_handler::update_status_admin),
            ),
    );
}
