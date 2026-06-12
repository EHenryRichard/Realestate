use actix_web::web;

use crate::routes;

pub fn configure_api(cfg: &mut web::ServiceConfig, admin_api_path: &str) {
    routes::configure(cfg, admin_api_path);
}
