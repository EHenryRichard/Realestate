use actix_web::web;

use crate::handlers::auth_handler;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/signup",  web::post().to(auth_handler::signup))
            .route("/login",   web::post().to(auth_handler::login))
            .route("/refresh", web::post().to(auth_handler::refresh))
            .route("/logout",  web::post().to(auth_handler::logout))
            .route("/me",      web::get().to(auth_handler::me))
            .route("/me",      web::patch().to(auth_handler::update_me))
            .route("/me/change-password", web::post().to(auth_handler::change_password))
            .route("/agents",          web::get().to(auth_handler::list_agents))
            .route("/agents",          web::post().to(auth_handler::register_agent))
            .route("/agents/{id}",     web::get().to(auth_handler::get_agent))
            .route("/agents/{id}",     web::patch().to(auth_handler::update_agent))
            .route("/agents/{id}",     web::delete().to(auth_handler::delete_agent))
            .route("/agents/{id}/toggle", web::patch().to(auth_handler::toggle_agent_active)),
    );
}
