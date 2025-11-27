-- Migration: Create discovery_sessions table for storing discovery wizard state
-- This allows users to save and resume their discovery sessions

CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Session identification (for anonymous users)
  session_key VARCHAR(64) UNIQUE,

  -- Current step in the wizard (1-5)
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),

  -- Step 1: Input
  url VARCHAR(2048),
  brief TEXT,

  -- Step 2: ICP data (stored as JSONB)
  icp_data JSONB,
  -- Expected structure matches ICPData interface:
  -- {
  --   "businessCategory": "string",
  --   "companySize": "string",
  --   "businessModel": "string",
  --   "growthStage": "string",
  --   "targetMarket": "string",
  --   "marketPosition": "string",
  --   "competitiveAdvantage": "string",
  --   "revenueModel": "string",
  --   "decisionMakingProcess": "string",
  --   "buyingBehavior": "string",
  --   "technologyAdoption": "string",
  --   "regulatoryEnvironment": "string",
  --   "buyerRoles": ["array"],
  --   "customerSegments": ["array"],
  --   "painPoints": ["array"],
  --   "valueProposition": "string",
  --   "keywords": ["array"],
  --   "confidence": 85,
  --   "sourceUrl": "string",
  --   "inferredAt": "timestamp"
  -- }

  -- Step 3: Companies discovered (stored as JSONB array)
  companies JSONB DEFAULT '[]'::jsonb,
  selected_companies TEXT[] DEFAULT '{}',

  -- Step 4: Contacts discovered (stored as JSONB array)
  contacts JSONB DEFAULT '[]'::jsonb,
  selected_contacts TEXT[] DEFAULT '{}',
  confidence_threshold INTEGER DEFAULT 85,

  -- Step 5: Drafts generated (stored as JSONB map)
  drafts JSONB DEFAULT '{}'::jsonb,
  draft_tone VARCHAR(50) DEFAULT 'direct',

  -- Session metadata
  is_demo BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user_id ON discovery_sessions(user_id);

-- Index for session key lookups (anonymous users)
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_session_key ON discovery_sessions(session_key);

-- Index for recent sessions
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_updated_at ON discovery_sessions(updated_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_status ON discovery_sessions(status);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discovery_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discovery_sessions_updated_at
  BEFORE UPDATE ON discovery_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_sessions_updated_at();
