use actix_web::web;

use crate::handlers::upload_handler;

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/uploads")
            .route("", web::delete().to(upload_handler::delete_uploads))
            .route("/images", web::post().to(upload_handler::upload_images))
            .route("/videos", web::post().to(upload_handler::upload_videos))
            .route(
                "/videos/{file_id}/status",
                web::get().to(upload_handler::video_upload_status),
            ),
    );
}
