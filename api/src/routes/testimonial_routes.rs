use actix_web::web;

use crate::handlers::testimonial_handler;

pub fn configure_public(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/testimonials",
        web::get().to(testimonial_handler::list_public),
    );
}

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/testimonials")
            .route("", web::get().to(testimonial_handler::list_admin))
            .route("", web::post().to(testimonial_handler::create_admin))
            .route("/{id}", web::get().to(testimonial_handler::get_admin_by_id))
            .route("/{id}", web::put().to(testimonial_handler::update_admin))
            .route("/{id}", web::delete().to(testimonial_handler::delete_admin))
            .route(
                "/{id}/visible",
                web::patch().to(testimonial_handler::toggle_visible_admin),
            ),
    );
}
