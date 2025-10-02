import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ICPData {
  // Core Business Profile
  businessCategory?: string;
  companySize?: string;
  businessModel?: string;
  growthStage?: string;

  // Market Analysis
  targetMarket?: string;
  marketPosition?: string;
  competitiveAdvantage?: string;
  revenueModel?: string;

  // Decision Making & Behavior
  decisionMakingProcess?: string;
  buyingBehavior?: string;
  technologyAdoption?: string;
  regulatoryEnvironment?: string;

  // Target Profiles
  buyerRoles?: string[];
  customerSegments?: string[];
  painPoints?: string[];
  valueProposition?: string;

  // Keywords for lookalike search
  keywords?: string[];

  // Metadata
  sourceUrl: string;
  inferredAt: string;
  confidence: number;
}

interface PageContent {
  url: string;
  title?: string;
  content: string;
  pageType: 'homepage' | 'product' | 'pricing' | 'about' | 'case-study' | 'other';
}

/**
 * Crawl a company's website to gather content from key pages
 */
async function crawlSite(baseUrl: string): Promise<PageContent[]> {
  const pages: PageContent[] = [];

  // Normalize base URL
  let normalizedUrl = baseUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Define priority pages to crawl (relative to base URL)
  const priorityPaths = [
    { path: '', type: 'homepage' as const },
    { path: '/product', type: 'product' as const },
    { path: '/products', type: 'product' as const },
    { path: '/solutions', type: 'product' as const },
    { path: '/pricing', type: 'pricing' as const },
    { path: '/about', type: 'about' as const },
    { path: '/customers', type: 'case-study' as const },
    { path: '/case-studies', type: 'case-study' as const },
  ];

  for (const { path, type } of priorityPaths) {
    try {
      const url = path ? `${normalizedUrl}${path}` : normalizedUrl;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SignalRunner-Bot/1.0 (Lead Discovery Platform)',
        },
      });

      const $ = cheerio.load(response.data);

      // Remove script, style, and nav elements
      $('script, style, nav, header, footer').remove();

      // Extract text content
      const title = $('title').text().trim() || $('h1').first().text().trim();
      const content = $('body').text().replace(/\s+/g, ' ').trim();

      if (content.length > 100) {
        pages.push({
          url,
          title,
          content: content.substring(0, 5000), // Limit content size
          pageType: type,
        });
      }
    } catch (error) {
      // Skip failed pages silently (404s, etc.)
      console.log(`Failed to crawl ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return pages;
}

/**
 * Fallback: Use AI with just the URL when crawling fails
 */
async function extractICPFromURLOnly(companyUrl: string): Promise<ICPData> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are an expert B2B market researcher. Based solely on the company URL "${companyUrl}", infer their Ideal Customer Profile (ICP).

Use your knowledge of this company to generate a detailed ICP with the following fields:

Return a JSON object (no markdown formatting, raw JSON only) with this exact structure:
{
  "businessCategory": "string",
  "companySize": "string (e.g., '10-50', '50-200', '200-1000', '1000+')",
  "businessModel": "string (e.g., 'B2B SaaS', 'B2C', 'Marketplace')",
  "growthStage": "string (e.g., 'Startup', 'Growth', 'Enterprise')",
  "targetMarket": "string",
  "marketPosition": "string",
  "competitiveAdvantage": "string",
  "revenueModel": "string",
  "decisionMakingProcess": "string",
  "buyingBehavior": "string",
  "technologyAdoption": "string",
  "regulatoryEnvironment": "string",
  "buyerRoles": ["array", "of", "job", "titles"],
  "customerSegments": ["array", "of", "customer", "types"],
  "painPoints": ["array", "of", "pain", "points"],
  "valueProposition": "string",
  "keywords": ["array", "of", "relevant", "keywords"],
  "confidence": 50
}

IMPORTANT:
- Set confidence to 50 (lower than web-scraped since we're working without page content)
- Return ONLY the JSON object, no markdown code blocks
- Make educated guesses based on what you know about this company`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content || '';

    // Clean up potential markdown formatting
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      sourceUrl: companyUrl,
      inferredAt: new Date().toISOString(),
      confidence: 50, // Lower confidence for URL-only inference
    };
  } catch (error) {
    console.error('AI extraction error (URL-only):', error);
    throw new Error('Failed to generate ICP from URL');
  }
}

/**
 * Use AI to extract ICP fields from crawled content
 */
async function extractICPWithAI(pages: PageContent[], baseUrl: string): Promise<ICPData> {
  // Combine page content for analysis
  const combinedContent = pages.map(p =>
    `[${p.pageType.toUpperCase()}] ${p.title || 'Untitled'}\n${p.content.substring(0, 2000)}`
  ).join('\n\n---\n\n');

  const prompt = `Analyze this company website content and extract ICP (Ideal Customer Profile) characteristics:

${combinedContent}

Extract the following fields in JSON format:

{
  "businessCategory": "What industry/category is this company in?",
  "companySize": "What size companies do they target? (e.g., SMB, Mid-market, Enterprise)",
  "businessModel": "What's their business model? (e.g., B2B SaaS, Marketplace, Services)",
  "growthStage": "What stage are they at? (e.g., Startup, Scale-up, Enterprise)",
  "targetMarket": "Who is their target market? (industries, company types)",
  "marketPosition": "How do they position themselves? (e.g., Leader, Challenger, Niche)",
  "competitiveAdvantage": "What's their main competitive advantage?",
  "revenueModel": "How do they make money? (e.g., Subscription, Usage-based, Freemium)",
  "decisionMakingProcess": "How do their customers typically buy? (e.g., Bottom-up, Top-down, Committee)",
  "buyingBehavior": "What's their buying behavior? (e.g., Product-led, Sales-led, Partner-led)",
  "technologyAdoption": "How tech-savvy are their customers? (e.g., Early adopter, Mainstream, Conservative)",
  "regulatoryEnvironment": "Any regulatory considerations? (e.g., HIPAA, GDPR, SOC2)",
  "buyerRoles": ["Array of typical buyer roles/titles"],
  "customerSegments": ["Array of customer segments they serve"],
  "painPoints": ["Array of main pain points they solve"],
  "valueProposition": "Core value proposition",
  "keywords": ["Array of 5-10 keywords for lookalike company search"],
  "confidence": 85
}

Return ONLY valid JSON. Be specific and concise. Use "Unknown" for fields that cannot be determined.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.ICP_MODEL || 'gpt-4o-mini', // Default to gpt-4o-mini, override with ICP_MODEL env var
      messages: [
        { role: 'system', content: 'You are an expert at analyzing company websites to extract ICP data. Always return valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Try to extract JSON from response (in case model adds explanation)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;

    const extracted = JSON.parse(jsonText);

    return {
      ...extracted,
      sourceUrl: baseUrl,
      inferredAt: new Date().toISOString(),
      confidence: extracted.confidence || 70,
    };
  } catch (error) {
    console.error('AI extraction failed:', error);
    // Return minimal ICP with error indication
    return {
      sourceUrl: baseUrl,
      inferredAt: new Date().toISOString(),
      confidence: 0,
      businessCategory: 'Unknown',
      keywords: [],
    };
  }
}

/**
 * Main ICP inference function
 */
export async function inferICP(companyUrl: string): Promise<ICPData> {
  console.log(`Starting ICP inference for: ${companyUrl}`);

  // Step 1: Crawl site
  const pages = await crawlSite(companyUrl);
  console.log(`Crawled ${pages.length} pages`);

  if (pages.length === 0) {
    console.warn('⚠️  Unable to crawl pages - falling back to URL-only inference');
    // Fallback: Use AI with just the URL to generate a basic ICP
    return await extractICPFromURLOnly(companyUrl);
  }

  // Step 2: Extract ICP with AI
  const icp = await extractICPWithAI(pages, companyUrl);
  console.log(`ICP inference complete with ${icp.confidence}% confidence`);

  return icp;
}
