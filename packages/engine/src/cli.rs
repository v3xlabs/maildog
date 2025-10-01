use std::io::{self, Write};
use anyhow::Result;
use sqlx::SqlitePool;
use tracing::info;

use crate::database::models::ImapConfig;

pub async fn prompt_imap_config(pool: &SqlitePool, passphrase: &str) -> Result<()> {
    println!("\n🐾 Woof! Let's set up your email account!");
    println!("=====================================\n");

    let name = prompt("Configuration name (e.g., 'personal', 'work')")?;
    let mail_host = prompt("IMAP server (e.g., 'imap.gmail.com')")?;
    
    let mail_port_str = prompt_with_default("IMAP port", "993")?;
    let mail_port: u16 = mail_port_str.parse()
        .map_err(|_| anyhow::anyhow!("Invalid port number"))?;
    
    let username = prompt("Email address / Username")?;
    let password = prompt_password("Password")?;
    
    let use_tls_str = prompt_with_default("Use TLS? (y/n)", "y")?;
    let use_tls = use_tls_str.to_lowercase() == "y" || use_tls_str.to_lowercase() == "yes";
    
    let is_active_str = prompt_with_default("Set as active configuration? (y/n)", "y")?;
    let is_active = is_active_str.to_lowercase() == "y" || is_active_str.to_lowercase() == "yes";

    info!("Saving IMAP configuration...");
    ImapConfig::save(
        pool,
        name.clone(),
        mail_host,
        mail_port,
        username,
        password,
        use_tls,
        is_active,
        passphrase,
    ).await?;

    println!("\n✅ IMAP configuration '{}' saved successfully!", name);
    println!("🐕 Ready to fetch some emails!\n");

    Ok(())
}

/// Check if IMAP config exists, prompt if not
pub async fn ensure_imap_config(pool: &SqlitePool, passphrase: &str) -> Result<()> {
    match ImapConfig::get_active(pool).await? {
        Some(config) => {
            info!("Using active IMAP configuration: {}", config.name);
            Ok(())
        }
        None => {
            let all_configs = ImapConfig::get_all(pool).await?;
            if all_configs.is_empty() {
                println!("\n⚠️  No IMAP configuration found!");
                prompt_imap_config(pool, passphrase).await
            } else {
                println!("\n⚠️  No active IMAP configuration!");
                println!("Available configurations:");
                for (i, config) in all_configs.iter().enumerate() {
                    println!("  {}. {} ({}@{})", i + 1, config.name, config.username, config.mail_host);
                }
                
                let choice = prompt("Enter number to activate, or 'new' to create a new config")?;
                
                if choice.to_lowercase() == "new" {
                    prompt_imap_config(pool, passphrase).await
                } else {
                    let idx: usize = choice.parse()
                        .map_err(|_| anyhow::anyhow!("Invalid choice"))?;
                    
                    if idx == 0 || idx > all_configs.len() {
                        return Err(anyhow::anyhow!("Invalid configuration number"));
                    }
                    
                    let config_id = all_configs[idx - 1].id;
                    ImapConfig::set_active(pool, config_id).await?;
                    
                    println!("\n✅ Configuration '{}' is now active!", all_configs[idx - 1].name);
                    Ok(())
                }
            }
        }
    }
}

fn prompt(message: &str) -> Result<String> {
    print!("{}: ", message);
    io::stdout().flush()?;
    
    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    
    Ok(input.trim().to_string())
}

fn prompt_with_default(message: &str, default: &str) -> Result<String> {
    print!("{} [{}]: ", message, default);
    io::stdout().flush()?;
    
    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    
    let trimmed = input.trim();
    if trimmed.is_empty() {
        Ok(default.to_string())
    } else {
        Ok(trimmed.to_string())
    }
}

fn prompt_password(message: &str) -> Result<String> {
    print!("{}: ", message);
    io::stdout().flush()?;
    
    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    
    Ok(input.trim().to_string())
}
