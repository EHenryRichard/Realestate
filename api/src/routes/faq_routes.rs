use actix_web::web;

use crate::handlers::faq_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route("/faqs", web::get().to(faq_handler::list_public));
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/faqs")
            .route("", web::get().to(faq_handler::list_admin))
            .route("", web::post().to(faq_handler::create_admin))
            .route("/{id}", web::get().to(faq_handler::get_admin_by_id))
            .route("/{id}", web::put().to(faq_handler::update_admin))
            .route("/{id}", web::delete().to(faq_handler::delete_admin))
            .route("/{id}/visible", web::patch().to(faq_handler::toggle_visible_admin)),
    );
}
