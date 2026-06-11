use actix_web::web;

use crate::handlers::auth_handler;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/signup", web::post().to(auth_handler::signup))
            .route("/login", web::post().to(auth_handler::login))
            .route("/refresh", web::post().to(auth_handler::refresh))
            .route("/me", web::get().to(auth_handler::me))
            .route("/logout", web::post().to(auth_handler::logout))
            .route("/agents", web::get().to(auth_handler::list_agents))
            .route("/agents", web::post().to(auth_handler::register_agent)),
    );
}
