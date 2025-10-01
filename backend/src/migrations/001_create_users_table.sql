-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  discovery_limit INTEGER DEFAULT 10,
  discovery_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_reset_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optional: Development seed user (replace hash if needed)
-- Password placeholder below will not match real login until replaced with a valid PBKDF2 hash
INSERT INTO users (email, password_hash, plan, discovery_limit)
VALUES ('dev@example.com', 'pbkdf2$120000$devsalt$0000', 'pro', 250)
ON CONFLICT (email) DO NOTHING;

