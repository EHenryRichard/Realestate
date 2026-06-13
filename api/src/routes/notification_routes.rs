use actix_web::web;

use crate::handlers::notification_handler;

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/notifications")
            .route(
                "/subscribe",
                web::post().to(notification_handler::subscribe_admin),
            )
            .route(
                "/subscribe",
                web::delete().to(notification_handler::unsubscribe_admin),
            ),
    );
}
