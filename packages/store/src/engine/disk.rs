use std::path::PathBuf;
use super::StoreEngine;

pub struct DiskEngine {
    path: PathBuf,
}

impl StoreEngine for DiskEngine {
    fn read(&self, key: String) -> Option<Vec<u8>> {
        let path = self.path.join(key);
        std::fs::read(&path).ok()
    }

    fn exists(&self, key: String) -> bool {
        let path = self.path.join(key);
        std::fs::metadata(&path).is_ok()
    }

    fn write(&mut self, key: String, value: &[u8]) -> std::io::Result<()> {
        let path = self.path.join(key);
        std::fs::write(&path, value)?;
        Ok(())
    }
}
