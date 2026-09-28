ALTER TABLE emails ADD COLUMN category TEXT;
ALTER TABLE emails ADD COLUMN labels TEXT;
ALTER TABLE emails ADD COLUMN priority INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(priority DESC);

CREATE VIEW IF NOT EXISTS emails_categorized AS
SELECT
    e.*,
    CASE WHEN e.category IS NOT NULL THEN 1 ELSE 0 END AS is_categorized
FROM emails e;

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

CREATE TABLE IF NOT EXISTS pages (
    slug TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    page_type TEXT NOT NULL CHECK(page_type IN ('email_list', 'calendar', 'overview')),
    config TEXT NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_user_position ON pages(user_id, position);
CREATE INDEX IF NOT EXISTS idx_pages_category ON pages(category);
CREATE INDEX IF NOT EXISTS idx_pages_user_category ON pages(user_id, category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_user_slug ON pages(user_id, slug);

INSERT OR IGNORE INTO pages (slug, user_id, name, category, page_type, config, position, created_at, updated_at)
VALUES 
    -- Main navigation (no category)
    ('home', 'default-user', 'Home', '', 'overview', '{}', 1, datetime('now'), datetime('now')),
    ('important', 'default-user', 'Important', '', 'email_list', '{"labelfilter": ["important"]}', 2, datetime('now'), datetime('now')),
    ('calendar', 'default-user', 'Calendar', '', 'calendar', '{}', 3, datetime('now'), datetime('now')),
    
    -- News & Updates
    ('newsletters', 'default-user', 'Newsletters', 'News & Updates', 'email_list', '{"labelfilter": ["news"]}', 4, datetime('now'), datetime('now')),
    ('legal', 'default-user', 'Legal', 'News & Updates', 'email_list', '{"labelfilter": ["legal"]}', 5, datetime('now'), datetime('now')),
    
    -- Authentication
    ('2fa-sso', 'default-user', '2FA & SSO', 'Authentication', 'email_list', '{"labelfilter": ["authentication"]}', 6, datetime('now'), datetime('now')),
    ('compromises', 'default-user', 'Compromises', 'Authentication', 'email_list', '{"labelfilter": ["compromises"]}', 7, datetime('now'), datetime('now')),
    
    -- Spending & Going
    ('receipts', 'default-user', 'Receipts', 'Spending & Going', 'email_list', '{"labelfilter": ["receipts"]}', 8, datetime('now'), datetime('now')),
    ('shipping', 'default-user', 'Shipping', 'Spending & Going', 'email_list', '{"labelfilter": ["shipping"]}', 9, datetime('now'), datetime('now')),
    
    -- Calendar
    ('invites', 'default-user', 'Invites', 'Calendar', 'email_list', '{"labelfilter": ["calendar-invites"]}', 10, datetime('now'), datetime('now')),
    ('meeting-notes', 'default-user', 'Meeting Notes', 'Calendar', 'email_list', '{"labelfilter": ["meeting-notes"]}', 11, datetime('now'), datetime('now')),
    
    -- Untrusted
    ('everything', 'default-user', 'Everything', 'Untrusted', 'email_list', '{"labelfilter": []}', 12, datetime('now'), datetime('now')),
    ('junk', 'default-user', 'Junk', 'Untrusted', 'email_list', '{"labelfilter": ["junk"]}', 13, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO email_rules (id, name, rule_json, priority, enabled, created_at, updated_at)
VALUES 
    (
        'important-emails',
        'Mark Important Emails',
        '{"id":"important-emails","name":"Mark Important Emails","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"URGENT"},{"type":"headerContains","name":"subject","substring":"IMPORTANT"},{"type":"headerContains","name":"from","substring":"ceo@"},{"type":"headerEquals","name":"x-priority","value":"1"}]},"actions":[{"type":"addLabel","value":"important"},{"type":"setPriority","value":9}],"priority":100,"enabled":true}',
        100,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'newsletters-and-news',
        'Newsletter and News Detection', 
        '{"id":"newsletters-and-news","name":"Newsletter and News Detection","condition":{"type":"or","conditions":[{"type":"headerContains","name":"from","substring":"newsletter"},{"type":"headerContains","name":"from","substring":"noreply"},{"type":"headerContains","name":"subject","substring":"newsletter"},{"type":"headerContains","name":"subject","substring":"weekly update"},{"type":"headerContains","name":"list-unsubscribe","substring":"http"}]},"actions":[{"type":"addLabel","value":"news"}],"priority":50,"enabled":true}',
        50,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'legal-documents',
        'Legal and Compliance Emails',
        '{"id":"legal-documents","name":"Legal and Compliance Emails","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"terms of service"},{"type":"headerContains","name":"subject","substring":"privacy policy"},{"type":"headerContains","name":"subject","substring":"legal notice"},{"type":"headerContains","name":"subject","substring":"compliance"},{"type":"headerContains","name":"from","substring":"legal@"}]},"actions":[{"type":"addLabel","value":"legal"}],"priority":70,"enabled":true}',
        70,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'authentication-security',
        'Authentication and Security',
        '{"id":"authentication-security","name":"Authentication and Security","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"two-factor"},{"type":"headerContains","name":"subject","substring":"2fa"},{"type":"headerContains","name":"subject","substring":"login attempt"},{"type":"headerContains","name":"subject","substring":"verification code"},{"type":"headerContains","name":"subject","substring":"security alert"},{"type":"headerContains","name":"from","substring":"security@"}]},"actions":[{"type":"addLabel","value":"authentication"},{"type":"setPriority","value":8}],"priority":90,"enabled":true}',
        90,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'security-compromises',
        'Security Compromises and Breaches',
        '{"id":"security-compromises","name":"Security Compromises and Breaches","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"security breach"},{"type":"headerContains","name":"subject","substring":"data breach"},{"type":"headerContains","name":"subject","substring":"account compromised"},{"type":"headerContains","name":"subject","substring":"suspicious activity"},{"type":"headerContains","name":"subject","substring":"password changed"}]},"actions":[{"type":"addLabel","value":"compromises"},{"type":"setPriority","value":10}],"priority":95,"enabled":true}',
        95,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'receipts-purchases',
        'Purchase Receipts and Invoices',
        '{"id":"receipts-purchases","name":"Purchase Receipts and Invoices","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"receipt"},{"type":"headerContains","name":"subject","substring":"invoice"},{"type":"headerContains","name":"subject","substring":"payment confirmation"},{"type":"headerContains","name":"subject","substring":"purchase confirmation"},{"type":"headerContains","name":"from","substring":"receipts@"},{"type":"headerContains","name":"from","substring":"billing@"}]},"actions":[{"type":"addLabel","value":"receipts"}],"priority":60,"enabled":true}',
        60,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'shipping-delivery',
        'Shipping and Delivery Updates',
        '{"id":"shipping-delivery","name":"Shipping and Delivery Updates","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"shipped"},{"type":"headerContains","name":"subject","substring":"tracking"},{"type":"headerContains","name":"subject","substring":"delivery"},{"type":"headerContains","name":"subject","substring":"package"},{"type":"headerContains","name":"from","substring":"fedex"},{"type":"headerContains","name":"from","substring":"ups"},{"type":"headerContains","name":"from","substring":"dhl"}]},"actions":[{"type":"addLabel","value":"shipping"}],"priority":40,"enabled":true}',
        40,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'calendar-invites',
        'Calendar Invitations',
        '{"id":"calendar-invites","name":"Calendar Invitations","condition":{"type":"or","conditions":[{"type":"headerContains","name":"content-type","substring":"text/calendar"},{"type":"headerContains","name":"subject","substring":"invitation"},{"type":"headerContains","name":"subject","substring":"meeting request"},{"type":"headerContains","name":"subject","substring":"calendar"},{"type":"headerEquals","name":"method","value":"REQUEST"}]},"actions":[{"type":"addLabel","value":"calendar-invites"},{"type":"setPriority","value":7}],"priority":80,"enabled":true}',
        80,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'meeting-notes',
        'Meeting Notes and Summaries',
        '{"id":"meeting-notes","name":"Meeting Notes and Summaries","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"meeting notes"},{"type":"headerContains","name":"subject","substring":"meeting summary"},{"type":"headerContains","name":"subject","substring":"action items"},{"type":"headerContains","name":"subject","substring":"meeting minutes"},{"type":"headerContains","name":"from","substring":"zoom"},{"type":"headerContains","name":"from","substring":"teams"}]},"actions":[{"type":"addLabel","value":"meeting-notes"}],"priority":65,"enabled":true}',
        65,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    ),
    (
        'junk-spam',
        'Junk and Spam Detection',
        '{"id":"junk-spam","name":"Junk and Spam Detection","condition":{"type":"or","conditions":[{"type":"headerContains","name":"subject","substring":"make money fast"},{"type":"headerContains","name":"subject","substring":"click here"},{"type":"headerContains","name":"subject","substring":"congratulations"},{"type":"headerMatches","name":"subject","pattern":"^RE:.*RE:.*RE:"},{"type":"headerContains","name":"from","substring":"noreply@suspicious"}]},"actions":[{"type":"addLabel","value":"junk"},{"type":"setPriority","value":1}],"priority":10,"enabled":true}',
        10,
        TRUE,
        strftime('%s', 'now'),
        strftime('%s', 'now')
    );
