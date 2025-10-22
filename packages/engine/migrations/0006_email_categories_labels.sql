ALTER TABLE emails ADD COLUMN category TEXT;
ALTER TABLE emails ADD COLUMN labels TEXT;
ALTER TABLE emails ADD COLUMN priority INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(priority DESC);

CREATE VIEW IF NOT EXISTS emails_categorized AS
SELECT 
    e.*,
    CASE 
        WHEN e.category IS NOT NULL THEN 1 
        ELSE 0 
    END as is_categorized
FROM emails e;
