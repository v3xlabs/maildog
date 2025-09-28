use thiserror::Error;

#[derive(Error, Debug)]
pub enum MailDogError {
    #[error("IO error: {0}")]
    Io(std::io::Error),
    #[error("SQLx error: {0}")]
    Sqlx(sqlx::Error),
    #[error("Database file not found: {0}")]
    DatabaseFileNotFound(String),
    #[error("Keyring error: {0}")]
    KeyringIO(#[from] keyring::error::Error),
    #[error("From UTF8 error: {0}")]
    FromUtf8(std::string::FromUtf8Error),
}
