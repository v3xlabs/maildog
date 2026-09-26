use std::io;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum BlobError {
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),

    #[error("invalid blob format")]
    InvalidFormat,

    #[error("blob authentication/decryption failed")]
    Crypto,
}
