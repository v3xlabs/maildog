use crate::prelude::Bytes32;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct BlobId(pub Bytes32);

impl BlobId {
    pub fn hex(&self) -> String {
        self.0.iter().map(|b| format!("{b:02x}")).collect()
    }

    pub fn new(identity_key: &Bytes32, content: &[u8]) -> Self {
        let hash = blake3::keyed_hash(identity_key, content);
        Self(hash.into())
    }
}
