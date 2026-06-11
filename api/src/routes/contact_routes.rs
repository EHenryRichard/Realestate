use actix_web::web;

use crate::handlers::contact_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route("/contact", web::post().to(contact_handler::create_public));
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/messages")
            .route("", web::get().to(contact_handler::list_admin))
            .route("/{id}", web::get().to(contact_handler::get_admin_by_id))
            .route(
                "/{id}/read",
                web::patch().to(contact_handler::mark_read_admin),
            )
            .route(
                "/{id}/status",
                web::patch().to(contact_handler::update_status_admin),
            )
            .route("/{id}", web::delete().to(contact_handler::delete_admin)),
    );
}
