use std::sync::Arc;

use openid::{Jws, Userinfo};
use poem::{session::{CookieSession, Session}, web::{cookie::Cookie, Data}, FromRequest, Request, RequestBody};
use thiserror::Error;
use tracing::info;

use crate::state::AppState;

pub struct UserData {
    pub user: Option<Userinfo>,
}

#[derive(Debug, Error)]
pub enum UserDataError {
    #[error("user not found")]
    UserNotFound,
}

impl<'a> FromRequest<'a> for UserData {
    async fn from_request(req: &'a Request, body: &mut RequestBody) -> Result<Self, poem::Error> {
        let app_state = Data::<&Arc<AppState>>::from_request(req, body).await.unwrap();

        let cookies = req.cookie();
   
        let access_token = cookies.get("access_token").unwrap();
        let access_token: &str = access_token.value().unwrap();
        let refresh_token = cookies.get("refresh_token").unwrap();
        let refresh_token: &str = refresh_token.value().unwrap();

        let mut token = Jws::new_encoded(access_token);

        app_state.oauth_client.decode_token(&mut token).unwrap();
        app_state.oauth_client.validate_token(&token, None, None).unwrap();

        // let userinfo = app_state.oauth_client.request_userinfo(&token.).await.unwrap();
        let claims = token.payload().unwrap();

        info!("userinfo: {:?}", claims);

        Ok(UserData{
            user: Some(claims.userinfo.clone()),
        })
    }
}
