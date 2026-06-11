use sqlx::{PgPool, postgres::PgPoolOptions};

use crate::config::AppConfig;

pub type DbPool = PgPool;

pub async fn connect(config: &AppConfig) -> Result<DbPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(8)
        .connect(&config.database_url)
        .await
}
