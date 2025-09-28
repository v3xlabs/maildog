use poem::{handler, web::Json, Result};
use rand::Rng as _;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AuthChallenge {
    pub challenge: [u8; 32],
    pub signature: String,
}

#[handler]
pub async fn get() -> Result<Json<AuthChallenge>> {
    // random vec of bytes of length 32
    let challenge = rand::thread_rng().gen::<[u8; 32]>();

    // TODO: actually sign the challenge instead of base64 encoding it
    let signature = base64::encode(challenge);

    Ok(Json(AuthChallenge {
        challenge,
        signature,
    }))
}
