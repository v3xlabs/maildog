pub mod disk;
pub mod memory;

pub trait StoreEngine: Send + Sync {
    fn read(&self, key: String) -> Option<Vec<u8>>;
    fn exists(&self, key: String) -> bool;
    fn write(&mut self, key: String, value: &[u8]) -> std::io::Result<()>;
}
