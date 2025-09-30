/**
 * Scoring Service
 * Calculates contact scores based on 4 facets: Fit, Intent, Reachability, Recency
 * Each score ranges from 0-100, with total score being the weighted average
 */

export interface ScoreEvidence {
  reason: string;
  source?: string;
  timestamp?: string;
}

export interface ScoreFacet {
  score: number;
  maxScore: number;
  weight: number;
  reasonCodes: string[];
  evidence: ScoreEvidence[];
}

export interface ContactScore {
  contactId: string;
  totalScore: number;
  facets: {
    fit: ScoreFacet;
    intent: ScoreFacet;
    reachability: ScoreFacet;
    recency: ScoreFacet;
  };
  calculatedAt: string;
}

export interface ContactData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  company?: string;
  domain?: string;
  confidence?: number;
  verificationStatus?: 'verified' | 'pending' | 'invalid';
  discoveredAt?: string;
  // ICP-related data
  icpIndustry?: string;
  icpCompanySize?: string;
  icpKeywords?: string[];
  // Intent signals
  recentActivity?: boolean;
  engagement?: number;
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Scoring Weights (must sum to 1.0)
 */
const FACET_WEIGHTS = {
  fit: 0.35,        // 35% - Most important for lead quality
  intent: 0.30,     // 30% - Buying signals and engagement
  reachability: 0.25, // 25% - Email deliverability confidence
  recency: 0.10,    // 10% - Freshness of data
};

/**
 * Calculate Fit Score (0-100)
 * Measures how well the contact matches the ICP criteria
 */
function calculateFitScore(contact: ContactData): ScoreFacet {
  const evidence: ScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Role match (30 points)
  if (contact.role) {
    const roleKeywords = ['director', 'vp', 'head', 'chief', 'manager', 'lead', 'founder'];
    const roleMatch = roleKeywords.some(kw => contact.role!.toLowerCase().includes(kw));
    if (roleMatch) {
      score += 30;
      reasonCodes.push('ROLE_MATCH');
      evidence.push({
        reason: `Senior role: ${contact.role}`,
        source: 'profile_analysis',
      });
    } else {
      score += 10; // Partial credit for having role
      reasonCodes.push('ROLE_KNOWN');
    }
  }

  // Company/Domain match (25 points)
  if (contact.company || contact.domain) {
    score += 25;
    reasonCodes.push('COMPANY_IDENTIFIED');
    evidence.push({
      reason: `Company: ${contact.company || contact.domain}`,
      source: 'discovery',
    });
  }

  // ICP Industry match (25 points)
  if (contact.icpIndustry) {
    score += 25;
    reasonCodes.push('INDUSTRY_MATCH');
    evidence.push({
      reason: `Industry: ${contact.icpIndustry}`,
      source: 'icp_analysis',
    });
  }

  // ICP Keywords match (20 points)
  if (contact.icpKeywords && contact.icpKeywords.length > 0) {
    const keywordScore = Math.min(20, contact.icpKeywords.length * 5);
    score += keywordScore;
    reasonCodes.push('KEYWORD_MATCH');
    evidence.push({
      reason: `Keywords: ${contact.icpKeywords.join(', ')}`,
      source: 'content_analysis',
    });
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: FACET_WEIGHTS.fit,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Intent Score (0-100)
 * Measures buying signals and engagement levels
 */
function calculateIntentScore(contact: ContactData): ScoreFacet {
  const evidence: ScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 20; // Base score for being discovered
  const maxScore = 100;

  // Recent activity signals (40 points)
  if (contact.recentActivity) {
    score += 40;
    reasonCodes.push('RECENT_ACTIVITY');
    evidence.push({
      reason: 'Recent activity detected on company site/socials',
      source: 'activity_monitoring',
    });
  }

  // Engagement level (40 points)
  if (contact.engagement !== undefined) {
    const engagementScore = Math.min(40, contact.engagement * 40);
    score += engagementScore;
    if (contact.engagement > 0.7) {
      reasonCodes.push('HIGH_ENGAGEMENT');
      evidence.push({
        reason: 'High engagement signals (>70%)',
        source: 'engagement_tracking',
      });
    } else if (contact.engagement > 0.3) {
      reasonCodes.push('MODERATE_ENGAGEMENT');
      evidence.push({
        reason: 'Moderate engagement signals (30-70%)',
        source: 'engagement_tracking',
      });
    }
  }

  // Company growth signals (20 points)
  if (contact.metadata?.growthSignals) {
    score += 20;
    reasonCodes.push('GROWTH_SIGNALS');
    evidence.push({
      reason: 'Company showing growth indicators',
      source: 'market_intelligence',
    });
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: FACET_WEIGHTS.intent,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Reachability Score (0-100)
 * Measures email deliverability and contact quality
 */
function calculateReachabilityScore(contact: ContactData): ScoreFacet {
  const evidence: ScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Verification status (60 points)
  if (contact.verificationStatus === 'verified') {
    score += 60;
    reasonCodes.push('EMAIL_VERIFIED');
    evidence.push({
      reason: 'Email verified by provider',
      source: 'email_verification',
    });
  } else if (contact.verificationStatus === 'pending') {
    score += 30;
    reasonCodes.push('EMAIL_PENDING');
  }

  // Confidence level (40 points)
  if (contact.confidence !== undefined) {
    const confidenceScore = Math.min(40, contact.confidence * 0.4);
    score += confidenceScore;
    if (contact.confidence >= 85) {
      reasonCodes.push('HIGH_CONFIDENCE');
      evidence.push({
        reason: `High confidence pattern match (${contact.confidence}%)`,
        source: 'pattern_detection',
      });
    } else if (contact.confidence >= 70) {
      reasonCodes.push('MODERATE_CONFIDENCE');
      evidence.push({
        reason: `Moderate confidence pattern match (${contact.confidence}%)`,
        source: 'pattern_detection',
      });
    }
  }

  // Email format validation (bonus points)
  if (contact.email && isValidEmailFormat(contact.email)) {
    if (!reasonCodes.includes('EMAIL_VERIFIED')) {
      score += 10; // Bonus only if not already verified
      reasonCodes.push('VALID_FORMAT');
    }
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: FACET_WEIGHTS.reachability,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Recency Score (0-100)
 * Measures freshness of contact data
 */
function calculateRecencyScore(contact: ContactData): ScoreFacet {
  const evidence: ScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  if (!contact.discoveredAt) {
    // No timestamp = assume fresh (current session)
    score = 90;
    reasonCodes.push('FRESH_DISCOVERY');
    evidence.push({
      reason: 'Discovered in current session',
      source: 'discovery',
      timestamp: new Date().toISOString(),
    });
    return { score, maxScore, weight: FACET_WEIGHTS.recency, reasonCodes, evidence };
  }

  const discoveredDate = new Date(contact.discoveredAt);
  const now = new Date();
  const ageInHours = (now.getTime() - discoveredDate.getTime()) / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;

  // Scoring based on age
  if (ageInHours < 24) {
    // Less than 24 hours: 100 points
    score = 100;
    reasonCodes.push('VERY_FRESH');
    evidence.push({
      reason: `Discovered ${Math.round(ageInHours)} hours ago`,
      source: 'discovery',
      timestamp: contact.discoveredAt,
    });
  } else if (ageInDays < 7) {
    // Less than 7 days: 90-70 points
    score = 90 - ((ageInDays - 1) * 3.33);
    reasonCodes.push('FRESH');
    evidence.push({
      reason: `Discovered ${Math.round(ageInDays)} days ago`,
      source: 'discovery',
      timestamp: contact.discoveredAt,
    });
  } else if (ageInDays < 30) {
    // Less than 30 days: 70-40 points
    score = 70 - ((ageInDays - 7) * 1.3);
    reasonCodes.push('RECENT');
    evidence.push({
      reason: `Discovered ${Math.round(ageInDays)} days ago`,
      source: 'discovery',
      timestamp: contact.discoveredAt,
    });
  } else if (ageInDays < 90) {
    // Less than 90 days: 40-20 points
    score = 40 - ((ageInDays - 30) * 0.33);
    reasonCodes.push('MODERATE');
    evidence.push({
      reason: `Discovered ${Math.round(ageInDays)} days ago`,
      source: 'discovery',
      timestamp: contact.discoveredAt,
    });
  } else {
    // 90+ days: 20-0 points
    score = Math.max(0, 20 - ((ageInDays - 90) * 0.1));
    reasonCodes.push('STALE');
    evidence.push({
      reason: `Discovered ${Math.round(ageInDays)} days ago (stale)`,
      source: 'discovery',
      timestamp: contact.discoveredAt,
    });
  }

  return {
    score: Math.round(score),
    maxScore,
    weight: FACET_WEIGHTS.recency,
    reasonCodes,
    evidence,
  };
}

/**
 * Email format validation helper
 */
function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate total contact score with all facets
 */
export function calculateContactScore(contact: ContactData): ContactScore {
  const fit = calculateFitScore(contact);
  const intent = calculateIntentScore(contact);
  const reachability = calculateReachabilityScore(contact);
  const recency = calculateRecencyScore(contact);

  // Calculate weighted total score
  const totalScore = Math.round(
    fit.score * fit.weight +
    intent.score * intent.weight +
    reachability.score * reachability.weight +
    recency.score * recency.weight
  );

  return {
    contactId: contact.id,
    totalScore,
    facets: {
      fit,
      intent,
      reachability,
      recency,
    },
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Batch calculate scores for multiple contacts
 */
export function calculateBatchScores(contacts: ContactData[]): ContactScore[] {
  return contacts.map(contact => calculateContactScore(contact));
}

/**
 * Sort contacts by total score (descending)
 */
export function sortContactsByScore(scores: ContactScore[]): ContactScore[] {
  return [...scores].sort((a, b) => b.totalScore - a.totalScore);
}