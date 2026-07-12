use actix_web::web;

use crate::handlers::about_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route("/about", web::get().to(about_handler::get_public));
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/about")
            .route("", web::get().to(about_handler::get_admin))
            .route("", web::put().to(about_handler::update_admin)),
    );
}
