-- Migration: Create accounts table for storing discovered lookalike companies
-- This table stores accounts (companies) discovered through ICP-based search
-- with full provenance tracking (source, match reasons, confidence scores)

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Company identification
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,

  -- ICP match data
  description TEXT,
  industry VARCHAR(255),
  size VARCHAR(100),
  business_model VARCHAR(100),

  -- Scoring and confidence
  confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
  score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),

  -- Score facets (stored as JSONB for flexibility)
  score_facets JSONB,
  -- Expected structure:
  -- {
  --   "industryFit": { "score": 85, "reasonCodes": ["exact_match"] },
  --   "sizeFit": { "score": 90, "reasonCodes": ["within_range"] },
  --   "modelFit": { "score": 75, "reasonCodes": ["similar_model"] },
  --   "keywordMatch": { "score": 80, "reasonCodes": ["high_overlap"] }
  -- }

  -- Provenance tracking
  source VARCHAR(100) NOT NULL, -- e.g., "icp_search", "manual", "imported"
  match_reasons TEXT[], -- Array of match reason strings
  sourced_from JSONB, -- Details about the ICP that generated this account
  -- Expected structure:
  -- {
  --   "businessCategory": "SaaS",
  --   "companySize": "11-50",
  --   "targetMarket": "National",
  --   "keywords": ["automation", "workflow"]
  -- }

  -- Status tracking
  status VARCHAR(50) DEFAULT 'discovered', -- discovered, selected, contacted, qualified, disqualified

  -- Timestamps
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate accounts per user
  UNIQUE(user_id, domain)
);

-- Index for fast lookups by user
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Index for status filtering
CREATE INDEX idx_accounts_status ON accounts(status);

-- Index for domain lookups
CREATE INDEX idx_accounts_domain ON accounts(domain);

-- Index for scoring queries (find high-scoring accounts)
CREATE INDEX idx_accounts_score ON accounts(score DESC) WHERE score IS NOT NULL;

-- Index for recent discoveries
CREATE INDEX idx_accounts_discovered_at ON accounts(discovered_at DESC);

-- GIN index for JSONB fields (efficient querying of facets and sourced_from)
CREATE INDEX idx_accounts_score_facets ON accounts USING GIN(score_facets);
CREATE INDEX idx_accounts_sourced_from ON accounts USING GIN(sourced_from);

-- Full-text search on company name and description
CREATE INDEX idx_accounts_search ON accounts USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();
