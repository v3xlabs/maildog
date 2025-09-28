use std::sync::Arc;

use openid::Userinfo;
use poem::{handler, web::{Data, Json}, Result};
use reqwest::Url;
use serde::Serialize;
use tracing::info;

use crate::{routes::auth::oauth::middleware::UserData, state::AppState};

#[derive(Debug, Serialize)]
pub struct MeResponse {
    pub status: String,
}

#[handler]
pub async fn get(Data(app_state): Data<&Arc<AppState>>, user: UserData) -> Result<Json<MeResponse>> {
    let app_state = app_state.clone();

    info!("Logout");
    // app_state.oauth_client.
    // end session "end_session_endpoint" from discovery url
    
    info!("end_session_endpoint: {:?}", app_state.oauth_client.config().end_session_endpoint);

    let access_token = "".to_string();
    let refresh_token = "".to_string();
    let client_id = app_state.openid_client_id.clone();
    let client_secret = app_state.openid_client_secret.clone();

    // request to end session endpoint
    // POST end_session_endpoint
    // with post body x-www-form-urlencoded
    // - client_id
    // - client_secret
    // - refresh_token

    if let Some(end_session_endpoint) = &app_state.oauth_client.config().end_session_endpoint {
        let end_session_endpoint: Url = end_session_endpoint.to_owned();
        let client = reqwest::Client::new();
        let response = client.post(end_session_endpoint)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Authorization", format!("Bearer {}", access_token))
            .form(&[
                ("client_id", client_id),
                ("client_secret", client_secret),
                ("refresh_token", refresh_token),
            ])
            .send().await.unwrap();

        info!("response: {:?}", response);
    }

    Ok(
        Json(
        MeResponse {
            status: "ok".to_string(),
        }
    ))
}
