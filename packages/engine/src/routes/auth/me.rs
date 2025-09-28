use std::sync::Arc;

use openid::Userinfo;
use poem::{handler, web::{Data, Json}, Result};
use serde::Serialize;
use tracing::info;
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub status: String,
    pub user: Option<Userinfo>,
}

#[handler]
pub async fn get(Data(app_state): Data<&Arc<AppState>>, user: UserData) -> Result<Json<MeResponse>> {
    let app_state = app_state.clone();

    info!("API ME");

    Ok(
        Json(
        MeResponse {
            status: "ok".to_string(),
            user: user.user,
        }
    ))
}
