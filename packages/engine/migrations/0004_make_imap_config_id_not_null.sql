
UPDATE emails 
SET imap_config_id = (
    SELECT id FROM imap_config LIMIT 1
) 
WHERE imap_config_id IS NULL;

CREATE TABLE emails_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imap_uid INTEGER NOT NULL,
    message_id TEXT,
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    cc_address TEXT,
    bcc_address TEXT,
    reply_to TEXT,
    date_sent TEXT,
    date_maildog_fetched TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    body_text TEXT,
    body_html TEXT,
    raw_message BLOB,
    flags TEXT, -- JSON array of flags
    size_bytes INTEGER,
    has_attachments BOOLEAN,
    folder_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imap_config_id INTEGER NOT NULL,
    FOREIGN KEY (imap_config_id) REFERENCES imap_config(id) ON DELETE CASCADE,
    UNIQUE(imap_uid, folder_name, imap_config_id)
);

INSERT INTO emails_new (
    id, imap_uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
    reply_to, date_sent, date_maildog_fetched, body_text, body_html, raw_message,
    flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id
)
SELECT 
    id, imap_uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
    reply_to, date_sent, date_maildog_fetched, body_text, body_html, raw_message,
    flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id
FROM emails
WHERE imap_config_id IS NOT NULL;

DROP TABLE emails;

ALTER TABLE emails_new RENAME TO emails;

CREATE INDEX IF NOT EXISTS idx_emails_imap_uid ON emails(imap_uid);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_date_sent ON emails(date_sent);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails(subject);
CREATE INDEX IF NOT EXISTS idx_emails_config_id ON emails(imap_config_id);

CREATE TRIGGER IF NOT EXISTS emails_updated_at
    AFTER UPDATE ON emails
    FOR EACH ROW
BEGIN
    UPDATE emails SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
