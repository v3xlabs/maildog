use sqlx::ConnectOptions;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};

pub mod user;
pub mod models;

pub async fn init_db(database_url: &url::Url) -> Result<SqlitePool, sqlx::Error> {
    // Create connection pool
    let options = SqliteConnectOptions::from_url(database_url)?.create_if_missing(true);
    let pool = SqlitePool::connect_with(options).await?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
