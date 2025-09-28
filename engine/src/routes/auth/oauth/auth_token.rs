use std::sync::Arc;

use openid::Userinfo;
use poem::{handler, session::Session, web::{cookie::{Cookie, CookieJar}, Data, Json}, Result};
use serde::{Deserialize, Serialize};

use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct AuthTokenRequest {
    pub code: String,
    pub state: Option<String>,
    pub session_state: Option<String>,
    pub iss: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OAuthResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub userinfo: Userinfo,
}

#[handler]
pub async fn get(Data(app_state): Data<&Arc<AppState>>, session: &Session, cookies: &CookieJar, Json(request): Json<AuthTokenRequest>) -> Result<Json<OAuthResponse>> {
    let app_state = app_state.clone();

    let mut token = app_state.oauth_client.authenticate(&request.code, None, None).await.unwrap();

    if let Some(id_token) = token.id_token.as_mut() {
        app_state.oauth_client.decode_token(id_token).unwrap();
        app_state.oauth_client.validate_token(id_token, None, None).unwrap();
    } else {
        // TODO: handle error
    }

    let userinfo = app_state.oauth_client.request_userinfo(&token).await.unwrap();

    let mut access_cookies = Cookie::new("access_token", token.bearer.access_token.clone());

    access_cookies.set_secure(true);
    access_cookies.set_path("/");

    cookies.add(access_cookies);
    cookies.add(Cookie::new("refresh_token", token.bearer.refresh_token.clone()));

    session.set("access_token", token.bearer.access_token.clone());

    Ok(
        Json(
        OAuthResponse {
            access_token: token.bearer.access_token,
            refresh_token: token.bearer.refresh_token,
            userinfo,
        }
    ))
}
