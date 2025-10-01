use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Email {
    pub id: i64,
    pub uid: i64,
    pub message_id: Option<String>,
    pub subject: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub cc_address: Option<String>,
    pub bcc_address: Option<String>,
    pub reply_to: Option<String>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub date_sent: Option<OffsetDateTime>,
    #[serde(with = "time::serde::rfc3339")]
    pub date_received: OffsetDateTime,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub raw_message: Option<Vec<u8>>,
    pub flags: Option<String>, // JSON array of flags
    pub size_bytes: Option<i64>,
    pub has_attachments: Option<bool>,
    pub folder_name: Option<String>,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewEmail {
    pub uid: i64,
    pub message_id: Option<String>,
    pub subject: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub cc_address: Option<String>,
    pub bcc_address: Option<String>,
    pub reply_to: Option<String>,
    pub date_sent: Option<OffsetDateTime>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub raw_message: Vec<u8>,
    pub flags: Option<String>,
    pub size_bytes: Option<i64>,
    pub has_attachments: bool,
    pub folder_name: String,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct IngestionLog {
    pub id: i64,
    #[serde(with = "time::serde::rfc3339")]
    pub started_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339::option")]
    pub completed_at: Option<OffsetDateTime>,
    pub emails_processed: i64,
    pub emails_new: i64,
    pub emails_updated: i64,
    pub status: String,
    pub error_message: Option<String>,
    pub folder_name: String,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ImapConfig {
    pub id: i64,
    pub name: String,
    pub mail_host: String,
    pub mail_port: i64,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_encrypted: Vec<u8>,
    pub use_tls: bool,
    pub is_active: bool,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl Email {
    pub async fn insert(pool: &sqlx::SqlitePool, email: NewEmail) -> Result<Email, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            INSERT INTO emails (
                uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
                reply_to, date_sent, body_text, body_html, raw_message, flags, size_bytes,
                has_attachments, folder_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            email.uid,
            email.message_id,
            email.subject,
            email.from_address,
            email.to_address,
            email.cc_address,
            email.bcc_address,
            email.reply_to,
            email.date_sent,
            email.body_text,
            email.body_html,
            email.raw_message,
            email.flags,
            email.size_bytes,
            email.has_attachments,
            email.folder_name
        )
        .execute(pool)
        .await?;

        let id = result.last_insert_rowid();
        Self::find_by_id(pool, id).await
    }

    pub async fn find_by_id(pool: &sqlx::SqlitePool, id: i64) -> Result<Email, sqlx::Error> {
        sqlx::query_as!(
            Email,
            r#"SELECT 
                id as "id!",
                uid as "uid!",
                message_id,
                subject,
                from_address,
                to_address,
                cc_address,
                bcc_address,
                reply_to,
                date_sent,
                date_received as "date_received!",
                body_text,
                body_html,
                raw_message,
                flags,
                size_bytes,
                has_attachments,
                folder_name,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM emails WHERE id = ?"#,
            id
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_uid(pool: &sqlx::SqlitePool, uid: i64) -> Result<Option<Email>, sqlx::Error> {
        sqlx::query_as!(
            Email,
            r#"SELECT 
                id as "id!",
                uid as "uid!",
                message_id,
                subject,
                from_address,
                to_address,
                cc_address,
                bcc_address,
                reply_to,
                date_sent,
                date_received as "date_received!",
                body_text,
                body_html,
                raw_message,
                flags,
                size_bytes,
                has_attachments,
                folder_name,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM emails WHERE uid = ?"#,
            uid
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn get_highest_uid(pool: &sqlx::SqlitePool) -> Result<Option<i64>, sqlx::Error> {
        let result = sqlx::query!(
            r#"SELECT MAX(uid) as "max_uid" FROM emails"#
        )
        .fetch_one(pool)
        .await?;
        
        Ok(result.max_uid)
    }

    pub async fn list_recent(pool: &sqlx::SqlitePool, limit: i64) -> Result<Vec<Email>, sqlx::Error> {
        sqlx::query_as!(
            Email,
            r#"SELECT 
                id as "id!",
                uid as "uid!",
                message_id,
                subject,
                from_address,
                to_address,
                cc_address,
                bcc_address,
                reply_to,
                date_sent,
                date_received as "date_received!",
                body_text,
                body_html,
                raw_message,
                flags,
                size_bytes,
                has_attachments,
                folder_name,
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM emails ORDER BY date_received DESC LIMIT ?"#,
            limit
        )
        .fetch_all(pool)
        .await
    }
}

impl IngestionLog {
    pub async fn create(pool: &sqlx::SqlitePool, folder_name: String) -> Result<i64, sqlx::Error> {
        let result = sqlx::query!(
            "INSERT INTO ingestion_log (folder_name) VALUES (?)",
            folder_name
        )
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn update_completion(
        pool: &sqlx::SqlitePool,
        log_id: i64,
        emails_processed: i64,
        emails_new: i64,
        emails_updated: i64,
        status: String,
        error_message: Option<String>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE ingestion_log 
            SET completed_at = CURRENT_TIMESTAMP,
                emails_processed = ?,
                emails_new = ?,
                emails_updated = ?,
                status = ?,
                error_message = ?
            WHERE id = ?
            "#,
            emails_processed,
            emails_new,
            emails_updated,
            status,
            error_message,
            log_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }
}

impl ImapConfig {
    pub async fn get_active(pool: &sqlx::SqlitePool) -> Result<Option<ImapConfig>, sqlx::Error> {
        sqlx::query_as!(
            ImapConfig,
            r#"SELECT 
                id as "id!",
                name as "name!",
                mail_host as "mail_host!",
                mail_port as "mail_port!",
                username as "username!",
                password_encrypted as "password_encrypted!",
                use_tls as "use_tls!",
                is_active as "is_active!",
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM imap_config WHERE is_active = 1 LIMIT 1"#
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn get_all(pool: &sqlx::SqlitePool) -> Result<Vec<ImapConfig>, sqlx::Error> {
        sqlx::query_as!(
            ImapConfig,
            r#"SELECT 
                id as "id!",
                name as "name!",
                mail_host as "mail_host!",
                mail_port as "mail_port!",
                username as "username!",
                password_encrypted as "password_encrypted!",
                use_tls as "use_tls!",
                is_active as "is_active!",
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM imap_config ORDER BY name"#
        )
        .fetch_all(pool)
        .await
    }

    /// Decrypt the password using the provided passphrase
    pub fn decrypt_password(&self, passphrase: &str) -> Result<String, sqlx::Error> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce
        };
        use sha2::{Sha256, Digest};
        
        // The encrypted data format is: [12-byte nonce][ciphertext]
        if self.password_encrypted.len() < 12 {
            return Err(sqlx::Error::Decode("Encrypted data too short".into()));
        }
        
        // Derive a 32-byte key from the passphrase using SHA-256
        let mut hasher = Sha256::new();
        hasher.update(passphrase.as_bytes());
        let key_bytes = hasher.finalize();
        
        // Split nonce and ciphertext
        let (nonce_bytes, ciphertext) = self.password_encrypted.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        // Decrypt
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| sqlx::Error::Decode(format!("Invalid key: {}", e).into()))?;
        
        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| sqlx::Error::Decode(format!("Decryption failed: {}", e).into()))?;
        
        String::from_utf8(plaintext)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))
    }

    /// Encrypt a password using the provided passphrase
    fn encrypt_password(password: &str, passphrase: &str) -> Vec<u8> {
        use aes_gcm::{
            aead::{Aead, KeyInit, OsRng},
            Aes256Gcm, Nonce
        };
        use sha2::{Sha256, Digest};
        use rand::RngCore;
        
        // Derive a 32-byte key from the passphrase using SHA-256
        let mut hasher = Sha256::new();
        hasher.update(passphrase.as_bytes());
        let key_bytes = hasher.finalize();
        
        // Generate a random 12-byte nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Encrypt
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .expect("Invalid key length");
        
        let ciphertext = cipher
            .encrypt(nonce, password.as_bytes())
            .expect("Encryption failed");
        
        // Return [nonce || ciphertext]
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);
        result
    }

    pub async fn save(
        pool: &sqlx::SqlitePool,
        name: String,
        mail_host: String,
        mail_port: u16,
        username: String,
        password: String,
        use_tls: bool,
        is_active: bool,
        passphrase: &str,
    ) -> Result<i64, sqlx::Error> {
        let port = mail_port as i64;
        let password_encrypted = Self::encrypt_password(&password, passphrase);
        
        if is_active {
            sqlx::query!("UPDATE imap_config SET is_active = 0")
                .execute(pool)
                .await?;
        }
        
        let result = sqlx::query!(
            r#"
            INSERT INTO imap_config (name, mail_host, mail_port, username, password_encrypted, use_tls, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                mail_host = excluded.mail_host,
                mail_port = excluded.mail_port,
                username = excluded.username,
                password_encrypted = excluded.password_encrypted,
                use_tls = excluded.use_tls,
                is_active = excluded.is_active,
                updated_at = CURRENT_TIMESTAMP
            "#,
            name,
            mail_host,
            port,
            username,
            password_encrypted,
            use_tls,
            is_active
        )
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn set_active(pool: &sqlx::SqlitePool, id: i64) -> Result<(), sqlx::Error> {
        sqlx::query!("UPDATE imap_config SET is_active = 0")
            .execute(pool)
            .await?;
        
        sqlx::query!("UPDATE imap_config SET is_active = 1 WHERE id = ?", id)
            .execute(pool)
            .await?;
        
        Ok(())
    }

    pub async fn delete(pool: &sqlx::SqlitePool, id: i64) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM imap_config WHERE id = ?", id)
            .execute(pool)
            .await?;
        
        Ok(())
    }
}
