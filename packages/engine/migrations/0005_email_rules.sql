CREATE TABLE IF NOT EXISTS email_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rule_json TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_rules_priority ON email_rules(priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_email_rules_enabled ON email_rules(enabled);
