/**
 * Company Scoring Service
 * Scores candidate companies based on fit with ICP
 * Simpler than contact scoring - focuses on ICP alignment
 */

import { ICPData } from './icpInference';
import { CandidateCompany } from './candidateSourcing';

export interface CompanyScoreEvidence {
  reason: string;
  source?: string;
  value?: string;
}

export interface CompanyScoreFacet {
  score: number;
  maxScore: number;
  weight: number;
  reasonCodes: string[];
  evidence: CompanyScoreEvidence[];
}

export interface CompanyScore {
  companyDomain: string;
  totalScore: number;
  facets: {
    industryFit: CompanyScoreFacet;
    sizeFit: CompanyScoreFacet;
    modelFit: CompanyScoreFacet;
    keywordMatch: CompanyScoreFacet;
  };
  calculatedAt: string;
}

export interface ScoredCandidate extends CandidateCompany {
  score: number;
  scoreFacets?: CompanyScore['facets'];
}

/**
 * Scoring Weights for Company Fit
 */
const COMPANY_FACET_WEIGHTS = {
  industryFit: 0.40,    // 40% - Industry alignment most important
  sizeFit: 0.25,        // 25% - Company size match
  modelFit: 0.20,       // 20% - Business model similarity
  keywordMatch: 0.15,   // 15% - Keyword/signal alignment
};

/**
 * Calculate Industry Fit Score (0-100)
 */
function calculateIndustryFit(candidate: CandidateCompany, icp: ICPData): CompanyScoreFacet {
  const evidence: CompanyScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Exact industry match (100 points)
  if (candidate.industry && icp.businessCategory) {
    const candidateIndustry = candidate.industry.toLowerCase();
    const icpCategory = icp.businessCategory.toLowerCase();

    if (candidateIndustry === icpCategory) {
      score = 100;
      reasonCodes.push('EXACT_INDUSTRY_MATCH');
      evidence.push({
        reason: `Exact match: ${candidate.industry}`,
        source: 'industry_classification',
        value: candidate.industry,
      });
    } else if (candidateIndustry.includes(icpCategory) || icpCategory.includes(candidateIndustry)) {
      score = 80;
      reasonCodes.push('PARTIAL_INDUSTRY_MATCH');
      evidence.push({
        reason: `Partial match: ${candidate.industry} ~ ${icp.businessCategory}`,
        source: 'industry_classification',
      });
    } else {
      // Check for related industries based on common keywords
      const icpWords = icpCategory.split(/\s+/);
      const candidateWords = candidateIndustry.split(/\s+/);
      const overlap = icpWords.filter(w => candidateWords.some(cw => cw.includes(w) || w.includes(cw)));

      if (overlap.length > 0) {
        score = 50;
        reasonCodes.push('RELATED_INDUSTRY');
        evidence.push({
          reason: `Related via keywords: ${overlap.join(', ')}`,
          source: 'semantic_analysis',
        });
      } else {
        score = 20; // Different industry but still a valid candidate
        reasonCodes.push('DIFFERENT_INDUSTRY');
      }
    }
  } else {
    // No industry data, use base score
    score = 50;
    reasonCodes.push('INDUSTRY_UNKNOWN');
    evidence.push({
      reason: 'Industry data unavailable',
      source: 'discovery',
    });
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: COMPANY_FACET_WEIGHTS.industryFit,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Size Fit Score (0-100)
 */
function calculateSizeFit(candidate: CandidateCompany, icp: ICPData): CompanyScoreFacet {
  const evidence: CompanyScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  if (!candidate.size || !icp.companySize) {
    // No size data available
    score = 50; // Neutral score
    reasonCodes.push('SIZE_UNKNOWN');
    evidence.push({
      reason: 'Company size data unavailable',
      source: 'discovery',
    });
  } else {
    const candidateSize = candidate.size.toLowerCase();
    const icpSize = icp.companySize.toLowerCase();

    // Exact match
    if (candidateSize === icpSize) {
      score = 100;
      reasonCodes.push('EXACT_SIZE_MATCH');
      evidence.push({
        reason: `Exact match: ${candidate.size}`,
        source: 'company_data',
        value: candidate.size,
      });
    } else if (candidateSize.includes(icpSize) || icpSize.includes(candidateSize)) {
      score = 80;
      reasonCodes.push('SIMILAR_SIZE');
      evidence.push({
        reason: `Similar size: ${candidate.size} ~ ${icp.companySize}`,
        source: 'company_data',
      });
    } else {
      // Adjacent size categories still acceptable
      score = 60;
      reasonCodes.push('ADJACENT_SIZE');
      evidence.push({
        reason: `Different but acceptable: ${candidate.size}`,
        source: 'company_data',
      });
    }
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: COMPANY_FACET_WEIGHTS.sizeFit,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Business Model Fit Score (0-100)
 */
function calculateModelFit(candidate: CandidateCompany, icp: ICPData): CompanyScoreFacet {
  const evidence: CompanyScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Check description for business model keywords
  const description = (candidate.description || '').toLowerCase();
  const businessModel = (icp.businessModel || '').toLowerCase();

  if (!businessModel || businessModel === 'unknown') {
    // No business model specified in ICP
    score = 70; // Neutral positive
    reasonCodes.push('MODEL_NOT_SPECIFIED');
  } else {
    // Look for business model keywords in description
    const modelKeywords = businessModel.split(/\s+/);
    const matches = modelKeywords.filter(kw => description.includes(kw));

    if (matches.length === modelKeywords.length) {
      score = 100;
      reasonCodes.push('MODEL_MATCH');
      evidence.push({
        reason: `Business model match: ${icp.businessModel}`,
        source: 'description_analysis',
      });
    } else if (matches.length > 0) {
      score = 70;
      reasonCodes.push('PARTIAL_MODEL_MATCH');
      evidence.push({
        reason: `Partial model match: ${matches.join(', ')}`,
        source: 'description_analysis',
      });
    } else {
      // Check for common B2B/B2C/SaaS patterns
      const hasB2B = description.includes('b2b') || description.includes('business') || description.includes('enterprise');
      const hasB2C = description.includes('b2c') || description.includes('consumer') || description.includes('retail');
      const hasSaaS = description.includes('saas') || description.includes('software') || description.includes('platform');

      if ((businessModel.includes('b2b') && hasB2B) ||
          (businessModel.includes('b2c') && hasB2C) ||
          (businessModel.includes('saas') && hasSaaS)) {
        score = 60;
        reasonCodes.push('MODEL_INDICATOR_MATCH');
      } else {
        score = 40;
        reasonCodes.push('MODEL_MISMATCH');
      }
    }
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: COMPANY_FACET_WEIGHTS.modelFit,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate Keyword Match Score (0-100)
 */
function calculateKeywordMatch(candidate: CandidateCompany, icp: ICPData): CompanyScoreFacet {
  const evidence: CompanyScoreEvidence[] = [];
  const reasonCodes: string[] = [];
  let score = 0;
  const maxScore = 100;

  const keywords = icp.keywords || [];
  if (keywords.length === 0) {
    score = 50; // No keywords to match
    reasonCodes.push('NO_KEYWORDS');
    return {
      score,
      maxScore,
      weight: COMPANY_FACET_WEIGHTS.keywordMatch,
      reasonCodes,
      evidence,
    };
  }

  // Search for keywords in candidate description and name
  const searchText = `${candidate.name} ${candidate.description || ''}`.toLowerCase();
  const matchedKeywords = keywords.filter(kw => searchText.includes(kw.toLowerCase()));

  if (matchedKeywords.length === 0) {
    score = 20;
    reasonCodes.push('NO_KEYWORD_MATCH');
  } else {
    const matchRatio = matchedKeywords.length / keywords.length;
    score = Math.round(matchRatio * 100);

    if (matchRatio >= 0.75) {
      reasonCodes.push('STRONG_KEYWORD_MATCH');
    } else if (matchRatio >= 0.5) {
      reasonCodes.push('MODERATE_KEYWORD_MATCH');
    } else {
      reasonCodes.push('WEAK_KEYWORD_MATCH');
    }

    evidence.push({
      reason: `Matched ${matchedKeywords.length}/${keywords.length} keywords`,
      source: 'keyword_analysis',
      value: matchedKeywords.join(', '),
    });
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    weight: COMPANY_FACET_WEIGHTS.keywordMatch,
    reasonCodes,
    evidence,
  };
}

/**
 * Calculate total company score
 */
export function calculateCompanyScore(candidate: CandidateCompany, icp: ICPData): CompanyScore {
  const industryFit = calculateIndustryFit(candidate, icp);
  const sizeFit = calculateSizeFit(candidate, icp);
  const modelFit = calculateModelFit(candidate, icp);
  const keywordMatch = calculateKeywordMatch(candidate, icp);

  // Calculate weighted total score
  const totalScore = Math.round(
    industryFit.score * industryFit.weight +
    sizeFit.score * sizeFit.weight +
    modelFit.score * modelFit.weight +
    keywordMatch.score * keywordMatch.weight
  );

  return {
    companyDomain: candidate.domain,
    totalScore,
    facets: {
      industryFit,
      sizeFit,
      modelFit,
      keywordMatch,
    },
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Score and rank all candidates
 */
export function scoreAndRankCandidates(
  candidates: CandidateCompany[],
  icp: ICPData
): ScoredCandidate[] {
  // Calculate scores for all candidates
  const scoredCandidates: ScoredCandidate[] = candidates.map(candidate => {
    const companyScore = calculateCompanyScore(candidate, icp);
    return {
      ...candidate,
      score: companyScore.totalScore,
      scoreFacets: companyScore.facets,
    };
  });

  // Sort by total score (descending)
  return scoredCandidates.sort((a, b) => b.score - a.score);
}
