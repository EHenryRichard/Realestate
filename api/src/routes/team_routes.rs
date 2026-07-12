use actix_web::web;

use crate::handlers::team_member_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route("/team", web::get().to(team_member_handler::list_public))
        .route(
            "/team/{slug}",
            web::get().to(team_member_handler::get_public_by_slug),
        );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/team")
            .route("", web::get().to(team_member_handler::list_admin))
            .route("", web::post().to(team_member_handler::create_admin))
            .route("/{id}", web::get().to(team_member_handler::get_admin_by_id))
            .route("/{id}", web::put().to(team_member_handler::update_admin))
            .route("/{id}", web::delete().to(team_member_handler::delete_admin))
            .route(
                "/{id}/visible",
                web::patch().to(team_member_handler::toggle_visible_admin),
            ),
    );
}
