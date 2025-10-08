use tracing::info;
use url::Url;

use crate::{database::init_db, error::MailDogError, keyring::Keyring};

pub struct AppState {
    pub db_pool: sqlx::Pool<sqlx::Sqlite>,
    pub server_host: String,
    pub keyring: Keyring,
    pub ingestion_trigger: tokio::sync::mpsc::UnboundedSender<()>,
}

impl AppState {
    pub async fn new(ingestion_trigger: tokio::sync::mpsc::UnboundedSender<()>) -> Result<Self, MailDogError> {
        let server_host = std::env::var("SERVER_HOST").unwrap_or("127.0.0.1:3000".to_string());
        let database_url = match std::env::var("DATABASE_URL")
            .map(|url| Url::parse(&url).map_err(|_| MailDogError::DatabaseFileNotFound(url)))
        {
            Ok(url) => url,
            Err(_) => {
                let default_path = if let Ok(home_dir) = std::env::var("HOME") {
                    let path = format!("{}/.maildog/database.db", home_dir);
                    path
                } else {
                    "./database.db".to_string()
                };

                let default_path = std::path::Path::new(&default_path);

                // Ensure the directory exists (create if not)
                let parent_dir = default_path.parent().unwrap();
                std::fs::create_dir_all(parent_dir).map_err(|_| {
                    MailDogError::DatabaseFileNotFound(default_path.to_string_lossy().to_string())
                })?;

                // Return the url to the database (postgres://)
                let default_path =
                    format!("sqlite://{}", default_path.to_string_lossy().to_string());
                info!("Using default database path: {}\nYou can specify a different path by setting the DATABASE_URL environment variable", default_path);
                Url::parse(&default_path)
                    .map_err(|_| MailDogError::DatabaseFileNotFound(default_path))
            }
        }?;

        // Initialize database and run migrations
        let db_pool = init_db(&database_url).await.map_err(MailDogError::Sqlx)?;

        let keyring = Keyring::init()?;

        Ok(Self {
            db_pool,
            server_host,
            keyring,
            ingestion_trigger,
        })
    }
}
