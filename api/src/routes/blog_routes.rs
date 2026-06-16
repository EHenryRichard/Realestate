use actix_web::web;

use crate::handlers::blog_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/blog")
            .route("", web::get().to(blog_handler::list_public))
            .route("/{slug}", web::get().to(blog_handler::get_by_slug_public)),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/blog")
            .route("", web::get().to(blog_handler::list_admin))
            .route("", web::post().to(blog_handler::create_admin))
            .route("/{id}", web::get().to(blog_handler::get_admin_by_id))
            .route("/{id}", web::put().to(blog_handler::update_admin))
            .route("/{id}", web::delete().to(blog_handler::delete_admin))
            .route("/{id}/publish", web::patch().to(blog_handler::toggle_published_admin)),
    );
}
