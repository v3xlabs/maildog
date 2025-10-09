use anyhow::{anyhow, Context, Result};
use imap::types::Fetch;
use mail_parser::MessageParser;
use sqlx::SqlitePool;
use time::format_description::well_known::Rfc2822;
use time::OffsetDateTime;
use tracing::{error, info, warn};

use crate::database::models::{Email, ImapConfig, IngestionLog, NewEmail};

fn decode_subject(raw_subject: &[u8]) -> Option<String> {
    let header = format!("Subject: {}\r\n\r\n", String::from_utf8_lossy(raw_subject));
    let parser = MessageParser::default();
    parser
        .parse(header.as_bytes())
        .and_then(|msg| msg.subject().map(|s| s.to_string()))
}

/// Process emails for all IMAP configurations
pub async fn process_all_mailboxes(pool: &SqlitePool, passphrase: &str) -> Result<()> {
    let configs = ImapConfig::get_all(pool)
        .await
        .context("Failed to fetch IMAP configurations")?;

    if configs.is_empty() {
        warn!("No IMAP configurations found. Please add at least one configuration.");
        return Ok(());
    }

    info!("Processing {} IMAP configuration(s)", configs.len());

    for config in configs {
        let ingress = MailIngress::new(pool.clone(), config.id, config);
        if let Err(e) = ingress.process_emails(passphrase).await {
            error!(
                "Failed to process emails for config ID {}: {}",
                ingress.imap_config_id, e
            );
            // Continue processing other configs even if one fails
        }
    }

    info!("Finished processing all IMAP configurations");
    Ok(())
}

pub struct MailIngress {
    pool: SqlitePool,
    imap_config_id: i64,
    config: ImapConfig,
}

impl MailIngress {
    pub fn new(pool: SqlitePool, imap_config_id: i64, config: ImapConfig) -> Self {
        Self {
            pool,
            imap_config_id,
            config,
        }
    }

    pub async fn process_emails(&self, passphrase: &str) -> Result<()> {
        let log_id = IngestionLog::create(&self.pool, "INBOX".to_string()).await?;

        info!(
            "Starting email ingestion for config '{}' (ID: {}, log_id: {})",
            self.config.name, self.imap_config_id, log_id
        );
        info!(
            "Connecting to mail server: {}:{}",
            self.config.mail_host, self.config.mail_port
        );

        let mut emails_processed = 0i64;
        let mut emails_new = 0i64;
        let mut emails_updated = 0i64;

        let result = async {
            let password = self
                .config
                .decrypt_password(passphrase)
                .map_err(|e| anyhow!("Failed to decrypt password: {}", e))?;

            let client =
                imap::ClientBuilder::new(&self.config.mail_host, self.config.mail_port as u16)
                    .connect()?;

            let mut imap_session = client
                .login(&self.config.username, &password)
                .map_err(|e| anyhow!("Login failed: {:?}", e))?;

            imap_session.select("INBOX")?;

            let last_imap_uid =
                Email::get_highest_imap_uid(&self.pool, self.imap_config_id).await?;

            if let Some(imap_uid) = last_imap_uid {
                info!(
                    "Incremental sync - checking for emails after UID {}",
                    imap_uid
                );

                // Use UID FETCH with the range to get all emails from last_uid+1 to the end
                let messages = imap_session.uid_fetch(
                    &format!("{}:*", imap_uid + 1),
                    "(RFC822 UID ENVELOPE FLAGS INTERNALDATE)",
                )?;

                let message_count = messages.len();

                if message_count == 0 {
                    info!("No new emails to process (last UID: {})", imap_uid);
                } else {
                    info!(
                        "Found {} new emails starting from UID {}",
                        message_count,
                        imap_uid + 1
                    );

                    for (index, message) in messages.iter().enumerate() {
                        let current = index + 1;
                        if message_count > 10 && (current % 10 == 0 || current == message_count) {
                            info!("Processing new email {}/{}", current, message_count);
                        }

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
                                error!(
                                    "Failed to process email UID {}: {}",
                                    message.uid.unwrap_or(0),
                                    e
                                );
                            }
                        }
                    }
                }
            } else {
                info!("First sync - fetching all emails from INBOX in batches");

                // Get the total number of messages
                let status = imap_session.examine("INBOX")?;
                let total_messages = status.exists as i64;

                if total_messages == 0 {
                    info!("No emails found in INBOX");
                } else {
                    info!("Found {} total emails to fetch", total_messages);

                    // Process in batches of 50 to avoid memory issues
                    const BATCH_SIZE: i64 = 50;
                    let mut start = 1i64;

                    while start <= total_messages {
                        let end = std::cmp::min(start + BATCH_SIZE - 1, total_messages);
                        info!(
                            "Fetching batch: emails {} to {} ({}/{})",
                            start, end, end, total_messages
                        );

                        let messages = imap_session.fetch(
                            &format!("{}:{}", start, end),
                            "(RFC822 UID ENVELOPE FLAGS INTERNALDATE)",
                        )?;

                        // Collect emails to batch insert
                        let mut batch_emails = Vec::new();

                        for message in messages.iter() {
                            match self.prepare_email_data(message).await {
                                Ok(Some(new_email)) => {
                                    batch_emails.push(new_email);
                                }
                                Ok(None) => {
                                    // Email already exists, skip
                                    emails_processed += 1;
                                }
                                Err(e) => {
                                    error!(
                                        "Failed to prepare email UID {}: {}",
                                        message.uid.unwrap_or(0),
                                        e
                                    );
                                }
                            }
                        }

                        // Batch insert all emails from this batch
                        if !batch_emails.is_empty() {
                            match Email::insert_batch(&self.pool, batch_emails).await {
                                Ok(count) => {
                                    emails_processed += count as i64;
                                    emails_new += count as i64;
                                    info!("Inserted {} new emails from batch", count);
                                }
                                Err(e) => {
                                    error!("Failed to batch insert emails: {}", e);
                                }
                            }
                        }

                        start = end + 1;
                    }

                    info!(
                        "First sync completed: processed {} emails",
                        emails_processed
                    );
                }
            }

            imap_session.logout().ok();
            info!(
                "Email processing completed for '{}': {} processed, {} new, {} updated",
                self.config.name, emails_processed, emails_new, emails_updated
            );

            Ok::<(), anyhow::Error>(())
        }
        .await;

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
        )
        .await?;

        result
    }

    async fn prepare_email_data(&self, fetch: &Fetch<'_>) -> Result<Option<NewEmail>> {
        let imap_uid = fetch.uid.context("No UID found")? as i64;

        // Check if email already exists
        let existing =
            Email::find_by_imap_uid(&self.pool, imap_uid, self.imap_config_id).await?;
        if existing.is_some() {
            return Ok(None); // Email already exists
        }

        let envelope = fetch.envelope();
        let body = fetch.body().context("No body found")?;
        let flags = fetch.flags();
        let _internal_date = fetch.internal_date();

        let (subject, from_address, to_address, message_id, date_sent) = if let Some(env) = envelope
        {
            let subject = env
                .subject
                .as_ref()
                .and_then(|s| decode_subject(s))
                .or_else(|| {
                    env.subject
                        .as_ref()
                        .and_then(|s| String::from_utf8(s.to_vec()).ok())
                });

            let from_address = env
                .from
                .as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let _name = addr
                        .name
                        .as_ref()
                        .and_then(|n| String::from_utf8(n.to_vec()).ok());
                    let mailbox = addr
                        .mailbox
                        .as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr
                        .host
                        .as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());

                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });

            let to_address = env
                .to
                .as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let mailbox = addr
                        .mailbox
                        .as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr
                        .host
                        .as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());

                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });

            let message_id = env
                .message_id
                .as_ref()
                .and_then(|id| String::from_utf8(id.to_vec()).ok());

            let date_sent = env
                .date
                .as_ref()
                .and_then(|date| String::from_utf8(date.to_vec()).ok())
                .and_then(|date_str| {
                    let cleaned = date_str.replace(" (UTC)", "").replace(" (GMT)", "");

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

        let flags_json = if !flags.is_empty() {
            let flag_strings: Vec<String> = flags.iter().map(|f| format!("{:?}", f)).collect();
            Some(serde_json::to_string(&flag_strings).unwrap_or_default())
        } else {
            None
        };

        let parser = MessageParser::default();
        let parsed_message = parser.parse(body);

        let (body_text, body_html) = if let Some(msg) = parsed_message {
            let text = msg.body_text(0).map(|s| s.to_string());
            let html = msg.body_html(0).map(|s| s.to_string());
            (text, html)
        } else {
            warn!(
                "Failed to parse MIME message for UID {}, storing as plain text",
                imap_uid
            );
            (Some(String::from_utf8_lossy(body).to_string()), None)
        };

        let new_email = NewEmail {
            imap_uid,
            message_id: message_id.clone(),
            subject: subject.clone(),
            from_address: from_address.clone(),
            to_address,
            cc_address: None,
            bcc_address: None,
            reply_to: None,
            date_sent,
            body_text,
            body_html,
            raw_message: body.to_vec(),
            flags: flags_json,
            size_bytes: Some(body.len() as i64),
            has_attachments: false,
            folder_name: "INBOX".to_string(),
            imap_config_id: self.imap_config_id,
        };

        Ok(Some(new_email))
    }

    async fn process_email_message(&self, fetch: &Fetch<'_>) -> Result<bool> {
        let imap_uid = fetch.uid.context("No UID found")? as i64;

        let existing =
            Email::find_by_imap_uid(&self.pool, imap_uid, self.imap_config_id).await?;
        if existing.is_some() {
            info!("Email UID {} already exists, skipping", imap_uid);
            return Ok(false); // Not new
        }

        let envelope = fetch.envelope();
        let body = fetch.body().context("No body found")?;
        let flags = fetch.flags();
        let internal_date = fetch.internal_date();

        let (subject, from_address, to_address, message_id, date_sent) = if let Some(env) = envelope
        {
            let subject = env
                .subject
                .as_ref()
                .and_then(|s| decode_subject(s))
                .or_else(|| {
                    env.subject
                        .as_ref()
                        .and_then(|s| String::from_utf8(s.to_vec()).ok())
                });

            let from_address = env
                .from
                .as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let mailbox = addr
                        .mailbox
                        .as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr
                        .host
                        .as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());

                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });

            let to_address = env
                .to
                .as_ref()
                .and_then(|addrs| addrs.first())
                .and_then(|addr| {
                    let mailbox = addr
                        .mailbox
                        .as_ref()
                        .and_then(|m| String::from_utf8(m.to_vec()).ok());
                    let host = addr
                        .host
                        .as_ref()
                        .and_then(|h| String::from_utf8(h.to_vec()).ok());

                    match (mailbox, host) {
                        (Some(m), Some(h)) => Some(format!("{}@{}", m, h)),
                        _ => None,
                    }
                });

            let message_id = env
                .message_id
                .as_ref()
                .and_then(|id| String::from_utf8(id.to_vec()).ok());

            let date_sent = env
                .date
                .as_ref()
                .and_then(|date| String::from_utf8(date.to_vec()).ok())
                .and_then(|date_str| {
                    // Try to parse RFC2822 date format
                    // Remove common suffixes that break parsing
                    let cleaned = date_str.replace(" (UTC)", "").replace(" (GMT)", "");

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
            let flag_strings: Vec<String> = flags.iter().map(|f| format!("{:?}", f)).collect();
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
            warn!(
                "Failed to parse MIME message for UID {}, storing as plain text",
                imap_uid
            );
            (Some(String::from_utf8_lossy(body).to_string()), None)
        };

        let new_email = NewEmail {
            imap_uid,
            message_id: message_id.clone(),
            subject: subject.clone(),
            from_address: from_address.clone(),
            to_address,
            cc_address: None,  // TODO: Parse CC from envelope
            bcc_address: None, // TODO: Parse BCC from envelope
            reply_to: None,    // TODO: Parse Reply-To from envelope
            date_sent,
            body_text,
            body_html,
            raw_message: body.to_vec(),
            flags: flags_json,
            size_bytes: Some(body.len() as i64),
            has_attachments: false, // TODO: Detect attachments
            folder_name: "INBOX".to_string(),
            imap_config_id: self.imap_config_id,
        };

        let _email = Email::insert(&self.pool, new_email).await?;

        Ok(true) // New email
    }
}
