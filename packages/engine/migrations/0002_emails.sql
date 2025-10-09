CREATE TABLE IF NOT EXISTS emails (
    imap_uid INTEGER NOT NULL PRIMARY KEY, -- IMAP UID
    message_id TEXT, -- RFC822 Message-ID header
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    cc_address TEXT,
    bcc_address TEXT,
    reply_to TEXT,
    date_sent DATETIME, -- Parsed and stored as ISO8601
    date_maildog_fetched DATETIME DEFAULT CURRENT_TIMESTAMP,
    body_text TEXT,
    body_html TEXT,
    raw_message BLOB,
    flags TEXT, -- JSON array of IMAP flags
    size_bytes INTEGER,
    has_attachments BOOLEAN DEFAULT FALSE,
    folder_name TEXT DEFAULT 'INBOX',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    imap_config_id INTEGER,
    FOREIGN KEY (imap_config_id) REFERENCES imap_config(id) ON DELETE SET NULL,
    UNIQUE(imap_uid, folder_name, imap_config_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_imap_uid ON emails(imap_uid);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_date_sent ON emails(date_sent);
CREATE INDEX IF NOT EXISTS idx_emails_date_maildog_fetched ON emails(date_maildog_fetched);

CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    filename TEXT,
    content_type TEXT,
    size_bytes INTEGER,
    content_disposition TEXT,
    content_id TEXT,
    data BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(imap_uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);

CREATE TABLE IF NOT EXISTS ingestion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    emails_processed INTEGER DEFAULT 0,
    emails_new INTEGER DEFAULT 0,
    emails_updated INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_message TEXT,
    folder_name TEXT DEFAULT 'INBOX'
);

-- IMAP configuration storage
CREATE TABLE IF NOT EXISTS imap_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    mail_host TEXT NOT NULL,
    mail_port INTEGER NOT NULL DEFAULT 993,
    username TEXT NOT NULL,
    password_encrypted BLOB NOT NULL,
    use_tls BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_imap_config_active ON imap_config(is_active);
CREATE INDEX IF NOT EXISTS idx_imap_config_name ON imap_config(name);
