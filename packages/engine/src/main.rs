use std::sync::Arc;
use std::time::Duration;

use dotenvy::dotenv;
use poem::{get, handler, listener::TcpListener, middleware::Cors, web::Html, EndpointExt, Route, Server};
use poem_openapi::{OpenApi, OpenApiService};
use routes::{EmailApi, HealthApi, ImapConfigApi};
use state::AppState;
use tracing::{error, info};
use tracing_subscriber::{
    fmt::{
        self,
        format::{DefaultFields, FmtSpan},
    },
    layer::SubscriberExt,
    util::SubscriberInitExt,
};

pub mod cli;
pub mod database;
pub mod error;
pub mod ingress;
pub mod keyring;
pub mod routes;
pub mod state;

fn get_api() -> impl OpenApi {
    (HealthApi, EmailApi, ImapConfigApi)
}

#[handler]
fn scalar_docs() -> Html<&'static str> {
    Html(include_str!("../static/scalar.html"))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    // tracing_subscriber::fmt::init();
    let format = fmt::format()
        .with_level(true) // show log level
        .with_target(false) // hide target
        .with_timer(fmt::time::uptime()) // change timestamp style
        .with_thread_names(true) // show thread name
        .compact(); // compact style (vs pretty)

    tracing_subscriber::registry()
        // .with(EnvFilter::from_default_env())
        .with(
            fmt::layer()
                .event_format(format)
                .fmt_fields(DefaultFields::new())
                .with_ansi(true)
                .with_span_events(FmtSpan::CLOSE),
        )
        .init();

    if let Err(_) = dotenv() {
        let _ = dotenvy::from_filename("packages/engine/.env");
    }

    // Create channel for triggering email ingestion on-demand
    let (ingestion_tx, ingestion_rx) = tokio::sync::mpsc::unbounded_channel::<()>();

    let app_state = Arc::new(AppState::new(ingestion_tx).await?);


    match crate::database::models::ImapConfig::get_all(&app_state.db_pool).await {
        Ok(configs) if configs.is_empty() => {
            info!("No IMAP configurations found. Please configure via the web interface.");
        }
        Ok(configs) => {
            info!("Found {} IMAP configuration(s)", configs.len());
            for config in &configs {
                info!("  - {} ({}@{})", config.name, config.username, config.mail_host);
            }
        }
        Err(e) => {
            error!("Failed to check IMAP configurations: {}", e);
        }
    }

    let host = app_state.server_host.clone();

    let state_clone = app_state.clone();
    tokio::spawn(async move {
        periodic_email_ingestion(state_clone, ingestion_rx).await;
    });

    let api_service = OpenApiService::new(get_api(), "Maildog API", env!("CARGO_PKG_VERSION"))
        .server("http://localhost:3000/api")  // Use localhost instead of 127.0.0.1
        .description("Maildog - Email ingestion and management service");

    let spec = api_service.spec_endpoint();

    // Build the application
    let app = Route::new()
        .at("/docs", get(scalar_docs))
        .nest("/openapi.json", spec)
        .nest("/api", api_service)
        .with(
            Cors::new()
                .allow_credentials(true)
                .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
                .allow_headers(vec!["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"])
                .allow_origin("http://localhost:5173"),
        )
        .data(app_state);

    info!("🐾 Woof! Maildog is now running!");
    info!("You can access the server at http://{}", host);
    info!("📖 API Documentation (Scalar) at http://{}/docs", host);
    info!("📄 OpenAPI Spec at http://{}/openapi.json", host);

    Ok(Server::new(TcpListener::bind(host)).run(app).await?)
}

async fn periodic_email_ingestion(state: Arc<AppState>, mut ingestion_rx: tokio::sync::mpsc::UnboundedReceiver<()>) {
    let mut interval = tokio::time::interval(Duration::from_secs(300)); // 5 minutes

    // Run initial ingestion immediately on startup
    info!("Starting initial email ingestion for all mailboxes...");
    match ingress::process_all_mailboxes(&state.db_pool, &state.keyring.get_passphrase()).await {
        Ok(()) => {
            info!("✅ Initial email ingestion completed successfully");
        }
        Err(e) => {
            error!("❌ Initial email ingestion failed: {}", e);
        }
    }

    loop {
        tokio::select! {
            _ = interval.tick() => {
                info!("Starting periodic email ingestion for all mailboxes...");

                match ingress::process_all_mailboxes(&state.db_pool, &state.keyring.get_passphrase()).await {
                    Ok(()) => {
                        info!("✅ Periodic email ingestion completed successfully");
                    }
                    Err(e) => {
                        error!("❌ Periodic email ingestion failed: {}", e);
                    }
                }
            }
            Some(_) = ingestion_rx.recv() => {
                info!("Triggered email ingestion on-demand...");

                match ingress::process_all_mailboxes(&state.db_pool, &state.keyring.get_passphrase()).await {
                    Ok(()) => {
                        info!("✅ On-demand email ingestion completed successfully");
                    }
                    Err(e) => {
                        error!("❌ On-demand email ingestion failed: {}", e);
                    }
                }
            }
        }
    }
}
