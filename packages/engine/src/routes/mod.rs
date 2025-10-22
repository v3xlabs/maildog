use poem_openapi::Tags;

// pub mod auth;
pub mod email;
pub mod health;
pub mod imap_config;
pub mod rules;

pub use email::EmailApi;
pub use health::HealthApi;
pub use imap_config::ImapConfigApi;
pub use rules::RuleApi;

#[derive(Tags)]
pub enum ApiTags {
    /// System and health endpoints
    System,
    /// Email and mailbox operations
    Email,
    /// Email rule management
    Rules,
    /// Authentication endpoints
    Auth,
}
