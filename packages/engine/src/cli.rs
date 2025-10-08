use anyhow::Result;
use sqlx::SqlitePool;
use std::io::{self, Write};
use tracing::info;

use crate::database::models::ImapConfig;

pub async fn prompt_imap_config(pool: &SqlitePool, passphrase: &str) -> Result<()> {
    println!("\n🐾 Woof! Let's set up your email account!");
    println!("=====================================\n");

    let name = prompt("Configuration name (e.g., 'personal', 'work')")?;
    let mail_host = prompt("IMAP server (e.g., 'imap.gmail.com')")?;

    let mail_port_str = prompt_with_default("IMAP port", "993")?;
    let mail_port: u16 = mail_port_str
        .parse()
        .map_err(|_| anyhow::anyhow!("Invalid port number"))?;

    let username = prompt("Email address / Username")?;
    let password = prompt_password("Password")?;

    let use_tls_str = prompt_with_default("Use TLS? (y/n)", "y")?;
    let use_tls = use_tls_str.to_lowercase() == "y" || use_tls_str.to_lowercase() == "yes";

    info!("Saving IMAP configuration...");
    ImapConfig::save(
        pool,
        name.clone(),
        mail_host,
        mail_port,
        username,
        password,
        use_tls,
        passphrase,
    )
    .await?;

    println!("\n✅ IMAP configuration '{}' saved successfully!", name);
    println!("🐕 Ready to fetch some emails!\n");

    Ok(())
}

/// Check if IMAP config exists, prompt if not
pub async fn ensure_imap_config(pool: &SqlitePool, passphrase: &str) -> Result<()> {
    let all_configs = ImapConfig::get_all(pool).await?;

    if all_configs.is_empty() {
        println!("\n⚠️  No IMAP configuration found!");
        println!("Let's create one to get started.\n");
        prompt_imap_config(pool, passphrase).await
    } else {
        info!("Found {} IMAP configuration(s)", all_configs.len());
        for config in &all_configs {
            info!(
                "  - {} ({}@{})",
                config.name, config.username, config.mail_host
            );
        }
        Ok(())
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
