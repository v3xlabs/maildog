use std::sync::Arc;

use dotenvy::dotenv;
use poem::{
    get, handler, listener::TcpListener, middleware::Cors, post, session::{CookieConfig, CookieSession}, web::Path, EndpointExt, Route, Server
};
use state::AppState;

pub mod routes;
pub mod database;
pub mod state;

#[handler]
fn hello(Path(name): Path<String>) -> String {
    format!("hello: {}", name)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv().ok();

    let app_state = Arc::new(AppState::new().await?);

    // allow all cors
    let app = Route::new()
        .at("/", get(hello))
        .at("/auth/challenge", get(routes::auth::challenge::get))
        .at("/auth/uri", get(routes::auth::oauth::auth_uri::get))
        .at("/auth/token", post(routes::auth::oauth::auth_token::get))
        .at("/auth/me", get(routes::auth::me::get))
        .at("/auth/logout", get(routes::auth::oauth::logout::get))
        .at("/health", get(routes::health::get))
        .with(Cors::new().allow_credentials(true).allow_origin("http://localhost:5173"))
        .with(CookieSession::new(CookieConfig::default().secure(true)))
        .data(app_state);

    Ok(Server::new(TcpListener::bind("0.0.0.0:3000"))
        .run(app)
        .await?)
}
