use imap::types::Fetch;
use tracing::{info, error, warn};
use sqlx::SqlitePool;
use anyhow::{Result, Context, anyhow};
use time::OffsetDateTime;
use time::format_description::well_known::Rfc2822;
use mail_parser::MessageParser;

use crate::database::models::{Email, NewEmail, IngestionLog, ImapConfig};

pub struct MailConfig {
    pub mail_host: String,
    pub mail_port: u16,
    pub username: String,
    pub password: String,
}

impl MailConfig {
    pub async fn from_database(pool: &SqlitePool, passphrase: &str) -> Result<Self> {
        let config = ImapConfig::get_active(pool)
            .await
            .context("Failed to query IMAP config from database")?
            .context("No active IMAP configuration found in database")?;
        
        let password = config.decrypt_password(passphrase)
            .map_err(|e| anyhow!("Failed to decrypt password: {}", e))?;
        
        Ok(MailConfig {
            mail_host: config.mail_host,
            mail_port: config.mail_port as u16,
            username: config.username,
            password,
        })
    }
}

pub struct MailIngress {
    config: MailConfig,
    pool: SqlitePool,
}

impl MailIngress {
    pub fn new(config: MailConfig, pool: SqlitePool) -> Self {
        Self { config, pool }
    }

    pub async fn process_emails(&self) -> Result<()> {
        let log_id = IngestionLog::create(&self.pool, "INBOX".to_string()).await?;
        
        info!("Starting email ingestion (log_id: {})", log_id);
        info!("Connecting to mail server: {}:{}", self.config.mail_host, self.config.mail_port);
        
        let mut emails_processed = 0i64;
        let mut emails_new = 0i64;
        let mut emails_updated = 0i64;
        
        let result = async {
            let client = imap::ClientBuilder::new(&self.config.mail_host, self.config.mail_port)
                .connect()?;
            
            let mut imap_session = client.login(&self.config.username, &self.config.password)
                .map_err(|e| anyhow!("Login failed: {:?}", e))?;

            imap_session.select("INBOX")?;

           let last_uid = Email::get_highest_uid(&self.pool).await?;
            
            if let Some(uid) = last_uid {
                let search_result = imap_session.uid_search(&format!("UID {}:*", uid + 1))?;
                
                if search_result.is_empty() {
                    info!("No new emails to process (last UID: {})", uid);
                } else {
                    info!("Fetching {} new emails starting from UID {}", search_result.len(), uid + 1);
                    let messages = imap_session
                        .uid_fetch(&format!("{}:*", uid + 1), "(RFC822 UID ENVELOPE FLAGS INTERNALDATE)")?;

                    for message in messages.iter() {
                        match self.process_email_message(message).await {
                            Ok(is_new) => {
                                emails_processed += 1;
                                if is_new {
                                    emails_new += 1;
                                } else {
                                    emails_updated += 1;
                                }
                            }
                            Err(e) => {
                                error!("Failed to process email UID {}: {}", 
                                       message.uid.unwrap_or(0), e);
                            }
                        }
                    }
                }
            } else {
                info!("First sync - fetching all emails");
                let messages = imap_session
                    .fetch("1:*", "(RFC822 UID ENVELOPE FLAGS INTERNALDATE)")?;

                for message in messages.iter() {
                    match self.process_email_message(message).await {
                        Ok(is_new) => {
                            emails_processed += 1;
                            if is_new {
                                emails_new += 1;
                            } else {
                                emails_updated += 1;
                            }
                        }
                        Err(e) => {
                            error!("Failed to process email UID {}: {}", 
                                   message.uid.unwrap_or(0), e);
                        }
                    }
                }
            }

            imap_session.logout().ok();
            info!("Email processing completed: {} processed, {} new, {} updated", 
                  emails_processed, emails_new, emails_updated);
            
            Ok::<(), anyhow::Error>(())
        }.await;

        let (status, error_message) = match &result {
            Ok(()) => ("completed".to_string(), None),
            Err(e) => ("failed".to_string(), Some(e.to_string())),
        };

        IngestionLog::update_completion(
            &self.pool,
            log_id,
            emails_processed,
            emails_new,
            emails_updated,
            status,
            error_message,
        ).await?;
        
        result
    }

    async fn process_email_message(&self, fetch: &Fetch<'_>) -> Result<bool> {
        let uid = fetch.uid.context("No UID found")? as i64;
        
        let existing = Email::find_by_uid(&self.pool, uid).await?;
        if existing.is_some() {
            info!("Email UID {} already exists, skipping", uid);
            return Ok(false); // Not new
        }
        
        let envelope = fetch.envelope();
        let body = fetch.body().context("No body found")?;
        let flags = fetch.flags();
        let internal_date = fetch.internal_date();
        
        let (subject, from_address, to_address, message_id, date_sent) = if let Some(env) = envelope {
            let subject = env.subject.as_ref()
                .and_then(|s| String::from_utf8(s.to_vec()).ok());
            
            let from_address = env.from.as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let name = addr.name.as_ref()
                        .and_then(|n| String::from_utf8(n.to_vec()).ok());
                    let mailbox = addr.mailbox.as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr.host.as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());
                    
                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });
            
            let to_address = env.to.as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let mailbox = addr.mailbox.as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr.host.as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());
                    
                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });
            
            let message_id = env.message_id.as_ref()
                .and_then(|id| String::from_utf8(id.to_vec()).ok());
            
            let date_sent = env.date.as_ref()
                .and_then(|date| String::from_utf8(date.to_vec()).ok())
                .and_then(|date_str| {
                    // Try to parse RFC2822 date format
                    // Remove common suffixes that break parsing
                    let cleaned = date_str
                        .replace(" (UTC)", "")
                        .replace(" (GMT)", "");
                    
                    match OffsetDateTime::parse(&cleaned, &Rfc2822) {
                        Ok(dt) => Some(dt),
                        Err(e) => {
                            warn!("Failed to parse date '{}': {}", date_str, e);
                            None
                        }
                    }
                });
            
            (subject, from_address, to_address, message_id, date_sent)
        } else {
            (None, None, None, None, None)
        };
        
        // Parse flags
        let flags_json = if !flags.is_empty() {
            let flag_strings: Vec<String> = flags.iter()
                .map(|f| format!("{:?}", f))
                .collect();
            Some(serde_json::to_string(&flag_strings).unwrap_or_default())
        } else {
            None
        };
        
        // Parse MIME body using mail-parser
        let parser = MessageParser::default();
        let parsed_message = parser.parse(body);
        
        let (body_text, body_html) = if let Some(msg) = parsed_message {
            let text = msg.body_text(0).map(|s| s.to_string());
            let html = msg.body_html(0).map(|s| s.to_string());
            (text, html)
        } else {
            warn!("Failed to parse MIME message for UID {}, storing as plain text", uid);
            (Some(String::from_utf8_lossy(body).to_string()), None)
        };
        
        let new_email = NewEmail {
            uid,
            message_id: message_id.clone(),
            subject: subject.clone(),
            from_address: from_address.clone(),
            to_address,
            cc_address: None, // TODO: Parse CC from envelope
            bcc_address: None, // TODO: Parse BCC from envelope  
            reply_to: None, // TODO: Parse Reply-To from envelope
            date_sent,
            body_text,
            body_html,
            raw_message: body.to_vec(),
            flags: flags_json,
            size_bytes: Some(body.len() as i64),
            has_attachments: false, // TODO: Detect attachments
            folder_name: "INBOX".to_string(),
        };
        
        let email = Email::insert(&self.pool, new_email).await?;
        
        Ok(true) // New email
    }
}
