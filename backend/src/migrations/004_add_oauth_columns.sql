-- Add OAuth support columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create unique index for OAuth lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
  ON users(oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL;

-- Add index for faster OAuth queries
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
