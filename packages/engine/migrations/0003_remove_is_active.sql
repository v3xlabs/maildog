DROP INDEX IF EXISTS idx_imap_config_active;

CREATE TABLE imap_config_tmp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    mail_host TEXT NOT NULL,
    mail_port INTEGER NOT NULL DEFAULT 993,
    username TEXT NOT NULL,
    password_encrypted BLOB NOT NULL,
    use_tls BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO imap_config_tmp (id, name, mail_host, mail_port, username, password_encrypted, use_tls, created_at, updated_at)
SELECT id, name, mail_host, mail_port, username, password_encrypted, use_tls, created_at, updated_at
FROM imap_config;

DROP TABLE imap_config;

ALTER TABLE imap_config_tmp RENAME TO imap_config;

CREATE INDEX IF NOT EXISTS idx_imap_config_name ON imap_config(name);

UPDATE emails 
SET imap_config_id = (
    SELECT id 
    FROM imap_config 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE imap_config_id IS NULL;

CREATE TABLE emails_tmp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imap_uid INTEGER NOT NULL,
    message_id TEXT,
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    cc_address TEXT,
    bcc_address TEXT,
    reply_to TEXT,
    date_sent DATETIME,
    date_maildog_fetched DATETIME DEFAULT CURRENT_TIMESTAMP,
    body_text TEXT,
    body_html TEXT,
    raw_message BLOB,
    flags TEXT,
    size_bytes INTEGER,
    has_attachments BOOLEAN DEFAULT FALSE,
    folder_name TEXT DEFAULT 'INBOX',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    imap_config_id INTEGER,
    FOREIGN KEY (imap_config_id) REFERENCES imap_config(id) ON DELETE SET NULL,
    UNIQUE(imap_uid, folder_name, imap_config_id)
);

INSERT INTO emails_tmp (
    imap_uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
    reply_to, date_sent, date_maildog_fetched, body_text, body_html, raw_message,
    flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id
)
SELECT 
    imap_uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
    reply_to, date_sent, date_maildog_fetched, body_text, body_html, raw_message,
    flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id
FROM emails;

CREATE TABLE attachments_tmp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    filename TEXT,
    content_type TEXT,
    size_bytes INTEGER,
    content_disposition TEXT,
    content_id TEXT,
    data BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails_tmp(id) ON DELETE CASCADE
);

INSERT INTO attachments_tmp (id, email_id, filename, content_type, size_bytes, content_disposition, content_id, data, created_at)
SELECT 
    a.id,
    e.id as email_id,
    a.filename,
    a.content_type,
    a.size_bytes,
    a.content_disposition,
    a.content_id,
    a.data,
    a.created_at
FROM attachments a
INNER JOIN emails_tmp e ON a.email_id = e.imap_uid;

DROP TABLE attachments;
DROP TABLE emails;

ALTER TABLE emails_tmp RENAME TO emails;
ALTER TABLE attachments_tmp RENAME TO attachments;

CREATE INDEX IF NOT EXISTS idx_emails_imap_uid ON emails(imap_uid);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_date_sent ON emails(date_sent);
CREATE INDEX IF NOT EXISTS idx_emails_date_maildog_fetched ON emails(date_maildog_fetched);
CREATE INDEX IF NOT EXISTS idx_emails_config_id ON emails(imap_config_id);

CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
