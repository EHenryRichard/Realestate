#![allow(dead_code)]

mod app;
mod config;
mod db;
mod dto;
mod error;
mod handlers;
mod middleware;
mod models;
mod repositories;
mod response;
mod routes;
mod services;
mod utils;

use actix_cors::Cors;
use actix_files::Files;
use actix_web::{App, HttpServer, http::header, middleware::from_fn, web};
use config::AppConfig;
use handlers::upload_handler::VideoJobs;
use middleware::rate_limit_middleware::{RateLimitState, rate_limit};
use tracing::info;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = AppConfig::from_env();
    let bind_address = config.bind_address();
    let conn = db::connect(&config)
        .await
        .expect("Failed to connect to PostgreSQL");
    sqlx::migrate!("./migrations")
        .run(&conn)
        .await
        .expect("Failed to run database migrations");
    tokio::fs::create_dir_all(&config.upload_dir).await?;
    let rate_limit_state = web::Data::new(RateLimitState::default());
    let video_jobs = web::Data::new(VideoJobs::default());
    info!("Starting Sureboy Realty API on {}", bind_address);

    HttpServer::new(move || {
        let admin_api_path = config.admin_api_path.clone();
        let cors = Cors::default()
            .allowed_origin(&config.frontend_url)
            .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                header::AUTHORIZATION,
                header::ACCEPT,
                header::CONTENT_TYPE,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(from_fn(rate_limit))
            .wrap(cors)
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(conn.clone()))
            .app_data(rate_limit_state.clone())
            .app_data(video_jobs.clone())
            .service(Files::new("/uploads", config.upload_dir.clone()))
            .service(web::scope("/api").configure(|cfg| app::configure_api(cfg, &admin_api_path)))
    })
    .bind(bind_address)?
    .run()
    .await
}
