import axios from 'axios';
import OpenAI from 'openai';
import { ICPData } from './icpInference';
import { scoreAndRankCandidates, ScoredCandidate, CompanyScore } from './companyScoring';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CandidateCompany {
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  confidence: number; // 0-100 match score
  matchReasons: string[]; // Why this is a good match
  source: 'clearbit' | 'web-search' | 'ai-generated';
  sourceUrl?: string;
}

export interface CandidateSourcingResult {
  candidates: ScoredCandidate[]; // Now returns scored candidates
  totalFound: number;
  sourcedFrom: string[];
  durationMs: number;
  averageScore?: number;
  topScore?: number;
}

/**
 * Check robots.txt before crawling
 */
async function canCrawl(domain: string, userAgent: string = 'SignalRunner-Bot'): Promise<boolean> {
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await axios.get(robotsUrl, { timeout: 5000 });
    const robotsTxt = response.data.toLowerCase();

    // Simple check - look for User-agent: * or our bot
    // and check if we're disallowed
    if (robotsTxt.includes('disallow: /')) {
      return false;
    }

    return true;
  } catch {
    // If no robots.txt, assume crawling is allowed
    return true;
  }
}

/**
 * Rate limiter - simple in-memory implementation
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Clearbit Discovery Adapter (Mock for now - requires paid API key)
 */
async function sourceClearbit(icp: ICPData): Promise<CandidateCompany[]> {
  // Mock implementation - in production, use real Clearbit Discovery API
  // https://dashboard.clearbit.com/docs#discovery-api

  if (!process.env.CLEARBIT_DISCOVERY_API_KEY) {
    console.log('Clearbit API key not found, skipping Clearbit adapter');
    return [];
  }

  try {
    // Check rate limit (10 requests per minute)
    const canProceed = await rateLimiter.checkLimit('clearbit', 10, 60000);
    if (!canProceed) {
      console.log('Clearbit rate limit exceeded, skipping');
      return [];
    }

    // Real implementation would call Clearbit API here
    // const response = await axios.get('https://discovery.clearbit.com/v1/companies/search', {
    //   headers: { Authorization: `Bearer ${process.env.CLEARBIT_DISCOVERY_API_KEY}` },
    //   params: {
    //     query: { industry: icp.businessCategory, size: icp.companySize },
    //     limit: 50
    //   }
    // });

    console.log('Clearbit adapter: Would query with ICP:', icp.businessCategory);
    return [];
  } catch (error) {
    console.error('Clearbit adapter error:', error);
    return [];
  }
}

/**
 * Bing Web Search Adapter
 */
async function sourceWebSearch(icp: ICPData): Promise<CandidateCompany[]> {
  if (!process.env.BING_SEARCH_API_KEY) {
    console.log('Bing Search API key not found, using AI fallback');
    return sourceAIGenerated(icp);
  }

  try {
    // Check rate limit
    const canProceed = await rateLimiter.checkLimit('bing', 10, 60000);
    if (!canProceed) {
      console.log('Bing rate limit exceeded, using AI fallback');
      return sourceAIGenerated(icp);
    }

    // Build search query from ICP keywords
    const searchQuery = [
      icp.businessCategory,
      icp.businessModel,
      ...((icp.keywords || []).slice(0, 3))
    ].filter(Boolean).join(' ');

    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY
      },
      params: {
        q: `${searchQuery} company`,
        count: 30,
        mkt: 'en-US'
      }
    });

    // Parse Bing results into candidate companies
    const candidates: CandidateCompany[] = [];

    for (const result of response.data.webPages?.value || []) {
      // Extract domain from URL
      const urlMatch = result.url.match(/https?:\/\/([^\/]+)/);
      if (!urlMatch) continue;

      const domain = urlMatch[1].replace('www.', '');

      // Check robots.txt before adding
      const canCrawlDomain = await canCrawl(domain);
      if (!canCrawlDomain) {
        console.log(`Skipping ${domain} - robots.txt disallows`);
        continue;
      }

      candidates.push({
        name: result.name,
        domain,
        description: result.snippet,
        confidence: 70, // Base confidence for web search
        matchReasons: ['Found via web search', `Matches: ${searchQuery}`],
        source: 'web-search',
        sourceUrl: result.url,
      });

      if (candidates.length >= 30) break;
    }

    return candidates;
  } catch (error) {
    console.error('Bing search error:', error);
    return sourceAIGenerated(icp);
  }
}

/**
 * AI-Generated Lookalikes (Fallback when no API keys available)
 */
async function sourceAIGenerated(icp: ICPData): Promise<CandidateCompany[]> {
  console.log('Using AI to generate lookalike companies');

  const prompt = `Given this Ideal Customer Profile (ICP), generate a list of 30 real companies that match this profile.

ICP:
- Business Category: ${icp.businessCategory}
- Company Size: ${icp.companySize}
- Business Model: ${icp.businessModel}
- Target Market: ${icp.targetMarket}
- Keywords: ${(icp.keywords || []).join(', ')}
- Customer Segments: ${(icp.customerSegments || []).join(', ')}

Return a JSON array of companies in this format:
[
  {
    "name": "Company Name",
    "domain": "company.com",
    "description": "Brief description",
    "industry": "Industry name",
    "confidence": 85,
    "matchReasons": ["Reason 1", "Reason 2"]
  }
]

Focus on real, existing companies. Prioritize well-known companies in the space. Return ONLY valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.ICP_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert at identifying companies that match specific customer profiles. Always return valid JSON arrays.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : '[]';

    const companies = JSON.parse(jsonText);

    return companies.map((c: any) => ({
      name: c.name,
      domain: c.domain,
      description: c.description,
      industry: c.industry || icp.businessCategory,
      confidence: c.confidence || 75,
      matchReasons: c.matchReasons || ['AI-generated match'],
      source: 'ai-generated' as const,
    }));
  } catch (error) {
    console.error('AI generation error:', error);
    return [];
  }
}

/**
 * Main candidate sourcing function with scoring and ranking
 */
export async function sourceCandidates(icp: ICPData): Promise<CandidateSourcingResult> {
  const startTime = Date.now();

  console.log('Starting candidate sourcing with ICP:', icp.businessCategory);

  // Try adapters in order of preference
  const adapters = [
    { name: 'clearbit', fn: sourceClearbit },
    { name: 'web-search', fn: sourceWebSearch },
    { name: 'ai-generated', fn: sourceAIGenerated },
  ];

  let allCandidates: CandidateCompany[] = [];
  const sourcedFrom: string[] = [];

  for (const adapter of adapters) {
    try {
      const candidates = await adapter.fn(icp);
      if (candidates.length > 0) {
        allCandidates = allCandidates.concat(candidates);
        sourcedFrom.push(adapter.name);
        console.log(`${adapter.name}: Found ${candidates.length} candidates`);

        // Stop if we have enough candidates
        if (allCandidates.length >= 30) break;
      }
    } catch (error) {
      console.error(`${adapter.name} adapter failed:`, error);
      continue;
    }
  }

  // Deduplicate by domain
  const uniqueCandidates = Array.from(
    new Map(allCandidates.map(c => [c.domain, c])).values()
  );

  console.log(`Found ${uniqueCandidates.length} unique candidates, now scoring...`);

  // Score and rank all candidates by ICP fit
  const scoredCandidates = scoreAndRankCandidates(uniqueCandidates, icp);

  // Calculate statistics
  const scores = scoredCandidates.map(c => c.score);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;

  const durationMs = Date.now() - startTime;

  console.log(`Candidate sourcing complete: ${scoredCandidates.length} candidates scored and ranked in ${durationMs}ms`);
  console.log(`Score stats - Average: ${averageScore}, Top: ${topScore}`);

  return {
    candidates: scoredCandidates,
    totalFound: scoredCandidates.length,
    sourcedFrom,
    durationMs,
    averageScore,
    topScore,
  };
}
