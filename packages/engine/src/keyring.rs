use rand::Rng;
use tracing::{info, warn};

use crate::error::MailDogError;

const SERVICE: &str = "company.v3xlabs.maildog";
const ACCOUNT: &str = "maildog-passphrase";

pub struct Keyring {
    passphrase: String,
}

impl Keyring {
    pub fn init() -> Result<Self, MailDogError> {
        // If set by environment variable, use this
        if let Ok(passphrase) = std::env::var("MAILDOG_PASSPHRASE") {
            info!("Passphrase loaded from environment variable: len {}", passphrase.len());
            return Ok(Self { passphrase });
        }

        let entry = keyring::Entry::new(SERVICE, ACCOUNT)?;
        let passphrase = match entry.get_password() {
            Ok(passphrase) => passphrase,
            Err(error) => {
                warn!("Error getting passphrase: {:?}", error);

                warn!("No passphrase found in keyring, a new token will be generated");
                let passphrase = rand::thread_rng().gen::<[u8; 32]>();
                let new_passphrase =
                    String::from_utf8(passphrase.to_vec()).map_err(MailDogError::FromUtf8)?;
                entry
                    .set_password(&new_passphrase)
                    .map_err(MailDogError::KeyringIO)?;
                new_passphrase
            }
        };

        info!("Passphrase loaded from keyring: len {}", passphrase.len());

        Ok(Self { passphrase })
    }
}
