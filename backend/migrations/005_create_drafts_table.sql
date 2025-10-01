-- Create drafts table for permanent draft storage
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  domain VARCHAR(255),
  tone VARCHAR(50) NOT NULL DEFAULT 'direct',
  opener TEXT NOT NULL,
  follow_up_1 TEXT NOT NULL,
  follow_up_2 TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  email_headers JSONB DEFAULT '{}'::jsonb,
  evidence_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_drafts_contact_id ON drafts(contact_id);
CREATE INDEX IF NOT EXISTS idx_drafts_email ON drafts(email);
CREATE INDEX IF NOT EXISTS idx_drafts_domain ON drafts(domain);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_drafts_updated_at();
