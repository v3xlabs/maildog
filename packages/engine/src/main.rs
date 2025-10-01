use std::sync::Arc;

use dotenvy::dotenv;
use poem::{
    get, handler, listener::TcpListener, middleware::Cors, post, session::{CookieConfig, CookieSession}, web::Path, EndpointExt, Route, Server
};
use state::AppState;
use tracing::info;
use tracing_subscriber::{fmt::{self, format::{DefaultFields, FmtSpan}}, layer::SubscriberExt, util::SubscriberInitExt};

pub mod routes;
pub mod database;
pub mod state;
pub mod keyring;
pub mod error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // tracing_subscriber::fmt::init();
    let format = fmt::format()
        .with_level(true)                  // show log level
        .with_target(false)                // hide target
        .with_timer(fmt::time::uptime())   // change timestamp style
        .with_thread_names(true)           // show thread name
        .compact();                        // compact style (vs pretty)

    tracing_subscriber::registry()
        // .with(EnvFilter::from_default_env())
        .with(fmt::layer()
            .event_format(format)
            .fmt_fields(DefaultFields::new())
            .with_ansi(true)
            .with_span_events(FmtSpan::CLOSE))
        .init();
    
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
