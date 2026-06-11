use actix_web::web;

use crate::handlers::dashboard_handler;

pub fn configure_admin(cfg: &mut web::ServiceConfig) {
    cfg.route("/dashboard", web::get().to(dashboard_handler::get_admin));
}
