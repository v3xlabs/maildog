--- Create accounts table

CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    account_name TEXT NOT NULL,
    account_email TEXT NOT NULL,
    account_password TEXT NOT NULL,
    account_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
