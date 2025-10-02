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

    // Build search query from ICP TARGET CUSTOMER fields (not the seller's business)
    const searchQuery = [
      icp.targetMarket,
      ...((icp.customerSegments || []).slice(0, 2)),
      icp.companySize
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
 * Extract Industry Verticals from ICP (Phase 1: Multi-Pass Refinement)
 */
async function extractVerticals(icp: ICPData): Promise<string[]> {
  console.log('Extracting industry verticals from ICP...');

  const prompt = `Given this target customer profile, identify 5-7 SPECIFIC INDUSTRY VERTICALS that would buy this product/service.

TARGET CUSTOMER PROFILE:
- Who buys: ${icp.targetMarket}
- Customer types: ${(icp.customerSegments || []).join(', ')}
- Business model: ${icp.businessModel}
- Company size: ${icp.companySize}

CRITICAL INSTRUCTIONS:
1. Return SPECIFIC verticals, NOT broad categories
2. Each vertical should be actionable for company search
3. Focus on industries where target buyers work/exist

EXAMPLES:
- Target: "Founders, Developers" → ["Mobile app development agencies", "B2B SaaS startups (Series A-B)", "E-commerce technology teams", "Design and product studios", "Developer tools companies"]
- Target: "Marketing teams" → ["Digital marketing agencies", "E-commerce brands", "SaaS marketing departments", "Content creation studios", "Growth-stage startups"]
- Target: "HR managers" → ["Mid-market tech companies", "Professional services firms", "Healthcare organizations", "Financial services companies", "Retail chains"]

Return ONLY a JSON array of 5-7 specific verticals:
["vertical 1", "vertical 2", "vertical 3", "vertical 4", "vertical 5"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.ICP_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert at identifying specific industry verticals. Return ONLY a JSON array of 5-7 specific, actionable industry verticals.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{"verticals":[]}';
    console.log('Vertical extraction response:', responseText);

    const parsed = JSON.parse(responseText);
    const verticals = parsed.verticals || parsed.industries || parsed.segments || [];

    if (!Array.isArray(verticals)) {
      console.error('Failed to extract verticals array, using fallback');
      return [`${icp.targetMarket} companies`, `${icp.customerSegments?.[0] || 'target'} organizations`];
    }

    console.log(`Extracted ${verticals.length} verticals:`, verticals);
    return verticals.slice(0, 7); // Max 7 verticals
  } catch (error) {
    console.error('Vertical extraction error:', error);
    // Fallback: use customer segments as verticals
    const fallbackVerticals = icp.customerSegments || (icp.targetMarket ? [icp.targetMarket] : []);
    return fallbackVerticals.slice(0, 5);
  }
}

/**
 * AI-Generated Customer Matches for Specific Vertical
 */
async function sourceAIGeneratedForVertical(icp: ICPData, vertical: string, companiesPerVertical: number = 10): Promise<CandidateCompany[]> {
  console.log(`Searching vertical: "${vertical}" for ${companiesPerVertical} companies`);

  const prompt = `Find ${companiesPerVertical} REAL companies in this specific vertical: "${vertical}"

ADDITIONAL CONTEXT:
- Target buyer profile: ${icp.targetMarket}
- Company size preference: ${icp.companySize}
- Business model: ${icp.businessModel}

CRITICAL INSTRUCTIONS:
1. Return ONLY companies that fit the vertical: "${vertical}"
2. Prioritize SPECIFIC, REACHABLE companies (not just famous brands)
3. Include a mix of well-known and lesser-known companies in this vertical
4. Companies should have ${icp.companySize} employees if possible

Return JSON:
{
  "companies": [
    {
      "name": "Company Name",
      "domain": "company.com",
      "description": "What they do",
      "industry": "${vertical}",
      "size": "Employee count",
      "confidence": 85,
      "matchReasons": ["Specific characteristic about THIS company"]
    }
  ]
}

MATCH REASON EXAMPLES (describe THEIR characteristics):
✅ CORRECT: "B2B SaaS company with 100 employees", "Mobile-first development agency in SF", "Has distributed engineering team"
❌ WRONG: "Needs our product", "Would benefit from our solution"`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.ICP_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a B2B sales researcher specializing in finding companies in specific industry verticals. Return ONLY valid JSON with exactly ${companiesPerVertical} companies.` },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8, // Slightly higher for diversity
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{"companies":[]}';
    const parsed = JSON.parse(responseText);
    const companies = parsed.companies || [];

    console.log(`Found ${companies.length} companies for vertical: ${vertical}`);

    return companies.map((c: any) => ({
      name: c.name,
      domain: c.domain,
      description: c.description,
      industry: c.industry || vertical,
      size: c.size || icp.companySize,
      confidence: c.confidence || 75,
      matchReasons: c.matchReasons || [`Matches vertical: ${vertical}`],
      source: 'ai-generated' as const,
    }));
  } catch (error) {
    console.error(`Error searching vertical "${vertical}":`, error);
    return [];
  }
}

/**
 * AI-Generated Customer Matches (Fallback when no API keys available)
 * Now uses multi-pass refinement strategy
 */
async function sourceAIGenerated(icp: ICPData): Promise<CandidateCompany[]> {
  console.log('Using AI multi-pass strategy to generate companies matching ICP target customers');
  console.log('ICP fields:', {
    targetMarket: icp.targetMarket,
    customerSegments: icp.customerSegments,
    businessCategory: icp.businessCategory,
    companySize: icp.companySize,
    businessModel: icp.businessModel,
  });

  // Phase 1: Extract specific industry verticals
  const verticals = await extractVerticals(icp);

  if (verticals.length === 0) {
    console.error('No verticals extracted, falling back to single-pass search');
    return sourceAIGeneratedSinglePass(icp);
  }

  // Phase 2: Search each vertical in parallel (limit to 5 verticals for API efficiency)
  const verticalsToSearch = verticals.slice(0, 5);
  const companiesPerVertical = 10; // 5 verticals × 10 companies = 50 total

  console.log(`Searching ${verticalsToSearch.length} verticals in parallel (${companiesPerVertical} companies each)...`);

  const searchPromises = verticalsToSearch.map(vertical =>
    sourceAIGeneratedForVertical(icp, vertical, companiesPerVertical)
  );

  const results = await Promise.all(searchPromises);
  const allCompanies = results.flat();

  console.log(`Multi-pass search complete: ${allCompanies.length} companies found across ${verticalsToSearch.length} verticals`);

  return allCompanies;
}

/**
 * Single-Pass AI Search (Fallback for multi-pass)
 */
async function sourceAIGeneratedSinglePass(icp: ICPData): Promise<CandidateCompany[]> {
  console.log('Using single-pass AI search (fallback)');

  const prompt = `You must find POTENTIAL CUSTOMER COMPANIES (businesses that would BUY/SUBSCRIBE to the product/service).

TARGET BUYER PROFILE:
- Who buys: ${icp.targetMarket}
- Customer types: ${(icp.customerSegments || []).join(', ')}
- Company size: ${icp.companySize}
- Business model: ${icp.businessModel}

CRITICAL INSTRUCTIONS:
1. Return 30 REAL companies that MATCH this buyer profile
2. These should be companies that would PURCHASE/SUBSCRIBE - NOT competitors
3. If targetMarket mentions job titles (Founders, Developers, etc), find COMPANIES WHERE THESE PEOPLE WORK

EXAMPLES:
- Target: "Founders, Developers" → Return: Tech startups, dev agencies, software companies
- Target: "Marketing teams" → Return: Digital agencies, SaaS companies, e-commerce brands
- Target: "Software agencies" → Return: Thoughtbot, Toptal, Netguru (NOT Asana, ClickUp)
- Target: "HR managers" → Return: Mid-size companies, enterprise corporations (NOT HR software vendors)

If the target market is "Founders, Developers, Project Managers", return companies like:
- Software development agencies
- Tech startups
- Web development firms
- Digital product studios
- Innovation labs
DO NOT return project management tools like Asana, ClickUp, Monday.com

Return JSON:
{
  "companies": [
    {
      "name": "Company Name",
      "domain": "company.com",
      "description": "What they do",
      "industry": "Industry",
      "size": "Employee count",
      "confidence": 85,
      "matchReasons": ["Why WE should sell TO them - describe THEIR characteristics, NOT what they need"]
    }
  ]
}

MATCH REASON EXAMPLES:
✅ CORRECT: "Tech startup with 50-200 employees", "B2B SaaS company", "Has distributed engineering team"
❌ WRONG: "Needs project management tools", "Founders need better workflows", "Would benefit from our solution"`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.ICP_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert B2B sales researcher. Your job is to find POTENTIAL CUSTOMERS (buyers) based on a target customer profile. Return companies who would BUY the product/service, NOT competitors or similar sellers. CRITICAL: Return ONLY valid JSON - no explanations, no markdown, just the JSON array.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{"companies":[]}';
    console.log('AI response preview:', responseText.substring(0, 500));

    // Parse JSON response - GPT with json_object mode returns {"companies": [...]}
    let companies = [];
    try {
      const parsed = JSON.parse(responseText);
      companies = parsed.companies || parsed.results || parsed;
      if (!Array.isArray(companies)) {
        // If it's still an object, try to extract array from any property
        const firstKey = Object.keys(parsed)[0];
        companies = Array.isArray(parsed[firstKey]) ? parsed[firstKey] : [];
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback: try to extract JSON array with regex
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : '[]';
      companies = JSON.parse(jsonText);
    }

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
export async function sourceCandidates(icp: ICPData, limit?: number): Promise<CandidateSourcingResult> {
  const startTime = Date.now();
  const targetCount = limit || 30; // Default to 30 if no limit specified

  console.log(`Starting candidate sourcing with ICP: ${icp.businessCategory}, target: ${targetCount}`);

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
        if (allCandidates.length >= targetCount) break;
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
