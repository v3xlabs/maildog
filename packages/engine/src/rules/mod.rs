pub mod types;
pub mod engine;
pub mod db;
pub mod apply;

pub use types::{Action, Condition, Rule};
pub use engine::RuleEngine;
pub use apply::{apply_actions, categorize_email, categorize_all_emails, CategorizeStats};
