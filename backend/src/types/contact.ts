export type VerificationStatus = 'unverified' | 'verified' | 'invalid' | 'unknown' | 'pending';

export interface ContactSource {
  provider: 'patterns' | 'hunter' | 'clearbit' | 'manual' | 'verification' | 'inference' | 'mock';
  url?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role?: string;
  title?: string;
  domain: string;
  pattern?: string;
  confidence: number; // 0-100
  verification: {
    status: VerificationStatus;
    score?: number; // 0-100 from provider
    provider?: 'bouncer' | 'neverbounce' | 'mock' | 'unknown';
    verifiedAt?: string;
  };
  sources: ContactSource[];
}

export interface PatternSuggestion {
  pattern: string; // e.g., first.last, first, flast, role, etc.
  example: string; // example email for a sample name
  confidence: number; // heuristic score
  roleBased?: boolean;
}

export interface DiscoveryRequest {
  url: string;
  roles?: string[]; // e.g., ['Owner/GM', 'Decision Makers']
  threshold?: number; // 70-95
  limit?: number; // limit contacts returned
  brief?: string;
}

export interface DiscoveryResult {
  jobId: string;
  domain: string;
  contacts: Contact[];
  threshold: number;
  startedAt: string;
  finishedAt?: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

