use poem::web::Data;
use poem_openapi::{payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct HealthApi;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[OpenApi]
impl HealthApi {
    /// Get server health status
    #[oai(path = "/health", method = "get", tag = "super::ApiTags::System")]
    async fn health(&self, _state: Data<&Arc<AppState>>) -> poem::Result<Json<HealthResponse>> {
        Ok(Json(HealthResponse {
            status: "healthy".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }))
    }
}
