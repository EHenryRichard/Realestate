use actix_web::web;

use crate::routes;

pub fn configure_api(cfg: &mut web::ServiceConfig) {
    routes::configure(cfg);
}
