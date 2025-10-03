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

    // Load environment variables
    dotenv().ok();

    let app_state = Arc::new(AppState::new().await?);

    cli::ensure_imap_config(&app_state.db_pool, &app_state.keyring.get_passphrase()).await?;

    let host = app_state.server_host.clone();

    let state_clone = app_state.clone();
    tokio::spawn(async move {
        periodic_email_ingestion(state_clone).await;
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
                .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                .allow_headers(vec!["Content-Type", "Authorization"])
                .allow_origin("http://localhost:5173"),
        )
        .data(app_state);

    info!("🐾 Woof! Maildog is now running!");
    info!("You can access the server at http://{}", host);
    info!("📖 API Documentation (Scalar) at http://{}/docs", host);
    info!("📄 OpenAPI Spec at http://{}/openapi.json", host);

    Ok(Server::new(TcpListener::bind(host)).run(app).await?)
}

async fn periodic_email_ingestion(state: Arc<AppState>) {
    let mut interval = tokio::time::interval(Duration::from_secs(300)); // 5 minutes

    loop {
        interval.tick().await;

        info!("Starting periodic email ingestion...");

        match ingress::MailConfig::from_database(&state.db_pool, &state.keyring.get_passphrase())
            .await
        {
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
