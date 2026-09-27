use crate::prelude::*;
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    Key, XChaCha20Poly1305, XNonce,
};

pub struct Store<E> {
    engine: E,
    identity_key: Bytes32,
    encryption_key: Bytes32,
}

const MAGIC: &[u8; 4] = b"MBL1";
const NONCE_LEN: usize = 24;

impl<E: StoreEngine> Store<E> {
    pub fn new(engine: E, identity_key: Bytes32, encryption_key: Bytes32) -> Self {
        Self {
            engine,
            identity_key,
            encryption_key,
        }
    }

    pub fn put(&mut self, plaintext: &[u8]) -> Result<BlobId, BlobError> {
        let blob_identity = BlobId::new(&self.identity_key, plaintext);

        if self.engine.exists(blob_identity.hex()) {
            return Ok(blob_identity);
        }

        let cipher = XChaCha20Poly1305::new(&Key::from(self.encryption_key));

        let nonce = XNonce::from(rand::random::<[u8; NONCE_LEN]>());

        let ciphertext = cipher
            .encrypt(&nonce, plaintext)
            .map_err(|_| BlobError::Crypto)?;

        let mut encoded = Vec::with_capacity(MAGIC.len() + nonce.len() + ciphertext.len());
        encoded.extend_from_slice(MAGIC);
        encoded.extend_from_slice(&nonce);
        encoded.extend_from_slice(&ciphertext);

        self.engine.write(blob_identity.hex(), &encoded)?;

        Ok(blob_identity)
    }

    pub fn get(&self, blob_identity: &BlobId) -> Result<Option<Vec<u8>>, BlobError> {
        let encoded = match self.engine.read(blob_identity.hex()) {
            Some(x) => Ok::<Vec<u8>, BlobError>(x),
            None => return Ok(None),
        }?;

        if encoded.len() < MAGIC.len() + NONCE_LEN {
            return Err(BlobError::InvalidFormat);
        }

        let (magic, rest) = encoded.split_at(MAGIC.len());

        if magic != MAGIC {
            return Err(BlobError::InvalidFormat);
        }

        let (nonce, ciphertext) = rest
            .split_first_chunk::<NONCE_LEN>()
            .ok_or(BlobError::InvalidFormat)?;
        let nonce = XNonce::from(*nonce);
        let cipher = XChaCha20Poly1305::new(&Key::from(self.encryption_key));

        let plaintext = cipher
            .decrypt(&nonce, ciphertext)
            .map_err(|_| BlobError::Crypto)?;

        if &BlobId::new(&self.identity_key, &plaintext) != blob_identity {
            return Err(BlobError::Crypto);
        }

        Ok(Some(plaintext))
    }
}
