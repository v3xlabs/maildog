use poem::{handler, web::Json, Result};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Health {
    pub status: String,
}

#[handler]
pub async fn get() -> Result<Json<Health>> {
    Ok(Json(Health { status: "healthy".to_string() }))
}
