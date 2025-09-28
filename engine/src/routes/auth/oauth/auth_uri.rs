use std::sync::Arc;

use openid::{Client, Discovered, Options, StandardClaims};
use poem::{handler, web::{Data, Json}, Result};
use serde::Serialize;

use crate::state::AppState;

type OpenIDClient = Client<Discovered, StandardClaims>;

#[derive(Debug, Serialize)]
pub struct OAuthResponse {
    /// The URL to redirect the user to for OAuth authentication.
    /// Example: `http://localhost:8080/realms/inbox-page/protocol/openid-connect/auth?client_id=inbox-page&redirect_uri=http://localhost:5173&response_type=code&scope=openid`
    pub url: String,
}

#[handler]
pub async fn get(Data(app_state): Data<&Arc<AppState>>) -> Result<Json<OAuthResponse>> {
    let app_state = app_state.clone();

    Ok(
        Json(
        OAuthResponse {
            url: app_state.oauth_client.auth_url(&Options {
                ..Default::default()
            })
            .to_string(),
        }
    ))
}
