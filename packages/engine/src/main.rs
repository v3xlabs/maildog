use std::sync::Arc;

use dotenvy::dotenv;
use poem::{
    get, handler, listener::TcpListener, middleware::Cors, post, session::{CookieConfig, CookieSession}, web::Path, EndpointExt, Route, Server
};
use state::AppState;
use tracing::info;

pub mod routes;
pub mod database;
pub mod state;
pub mod keyring;
pub mod error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv().ok();

    let app_state = Arc::new(AppState::new().await?);
    let host = app_state.server_host.clone();

    // allow all cors
    let app = Route::new()
        // .at("/", get(hello))
        .at("/health", get(routes::health::get))
        .with(Cors::new().allow_credentials(true).allow_origin("http://localhost:5173"))
        .data(app_state);

    info!("🐾 Woof! Maildog is now running!");
    info!("You can access the server at http://{}", host);

    Ok(Server::new(TcpListener::bind(host))
        .run(app)
        .await?)
}
