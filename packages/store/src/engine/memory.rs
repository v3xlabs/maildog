use super::StoreEngine;

pub struct MemStore {
    data: std::collections::HashMap<String, Vec<u8>>,
}

impl StoreEngine for MemStore {
    fn read(&self, key: String) -> Option<Vec<u8>> {
        self.data.get(&key).cloned()
    }

    fn exists(&self, key: String) -> bool {
        self.data.contains_key(&key)
    }
    
    fn write(&mut self, key: String, value: &[u8]) -> std::io::Result<()> {
        self.data.insert(key, value.to_vec());
        Ok(())
    }
}
