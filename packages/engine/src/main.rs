use std::sync::Arc;
use std::time::Duration;

use dotenvy::dotenv;
use poem::{
    get, listener::TcpListener, middleware::Cors, EndpointExt, Route, Server
};
use state::AppState;
use tracing_subscriber::{fmt::{self, format::{DefaultFields, FmtSpan}}, layer::SubscriberExt, util::SubscriberInitExt};
use tracing::{info, error};

pub mod routes;
pub mod database;
pub mod state;
pub mod keyring;
pub mod error;
pub mod ingress;
pub mod cli;

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

    cli::ensure_imap_config(&app_state.db_pool, &app_state.keyring.get_passphrase()).await?;

    let host = app_state.server_host.clone();

    let state_clone = app_state.clone();
    tokio::spawn(async move {
        periodic_email_ingestion(state_clone).await;
    });

    // allow all cors
    let app = Route::new()
        .at("/health", get(routes::health::get))
        .with(Cors::new().allow_credentials(true).allow_origin("http://localhost:5173"))
        .data(app_state);

    info!("🐾 Woof! Maildog is now running!");
    info!("You can access the server at http://{}", host);

    Ok(Server::new(TcpListener::bind(host))
        .run(app)
        .await?)
}

async fn periodic_email_ingestion(state: Arc<AppState>) {
    let mut interval = tokio::time::interval(Duration::from_secs(300)); // 5 minutes
    
    loop {
        interval.tick().await;
        
        info!("Starting periodic email ingestion...");
        
        match ingress::MailConfig::from_database(&state.db_pool, &state.keyring.get_passphrase()).await {
            Ok(config) => {
                let ingress = ingress::MailIngress::new(config, state.db_pool.clone());
                
                match ingress.process_emails().await {
                    Ok(()) => {
                        info!("✅ Periodic email ingestion completed successfully");
                    }
                    Err(e) => {
                        error!("❌ Periodic email ingestion failed: {}", e);
                    }
                }
            }
            Err(e) => {
                error!("❌ Failed to load IMAP configuration: {}", e);
            }
        }
    }
}
