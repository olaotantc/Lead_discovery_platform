/**
 * ICP Parsing utilities for extracting business information from URLs and briefs
 */

export interface IcpPreview {
  businessCategory: string;
  companySize: string;
  region: string;
  buyerRoles: string[];
  keywords: string[];
  confidence: 'Low' | 'Medium' | 'High';
  sources: Array<{
    type: string;
    url?: string;
    extractedData: string[];
  }>;
  metadata: Record<string, unknown>;
  // Enhanced industry-agnostic features
  businessModel: string;
  targetMarket: string;
  growthStage: string;
  decisionMakingProcess: string;
  painPoints: string[];
  valueProposition: string;
  competitiveAdvantage: string;
  marketPosition: string;
  revenueModel: string;
  customerSegments: string[];
  geographicFocus: string;
  technologyAdoption: string;
  regulatoryEnvironment: string;
  seasonality: string;
  buyingBehavior: string;
  budgetIndicators: string[];
  urgencySignals: string[];
  successMetrics: string[];
}

export interface ParsedUrlData {
  domain: string;
  companyName: string;
  subdomain?: string;
  path?: string;
  tld: string;
  isSubdomain: boolean;
  potentialIndustry: string[];
  potentialSize: string;
  potentialRegion: string;
}

export interface ParsedBriefData {
  keywords: string[];
  industry: string[];
  size: string;
  region: string;
  buyerRoles: string[];
  businessType: string;
  services: string[];
}

// Industry classification patterns
const INDUSTRY_PATTERNS = {
  'Technology/SaaS': [
    'software', 'saas', 'tech', 'app', 'platform', 'api', 'cloud', 'digital',
    'automation', 'ai', 'ml', 'data', 'analytics', 'crm', 'erp', 'integration'
  ],
  'E-commerce': [
    'ecommerce', 'e-commerce', 'online store', 'retail', 'shopping', 'marketplace',
    'dropship', 'fulfillment', 'inventory', 'catalog', 'checkout', 'payment'
  ],
  'Professional Services': [
    'consulting', 'agency', 'services', 'advisory', 'strategy', 'management',
    'legal', 'accounting', 'finance', 'marketing', 'design', 'creative'
  ],
  'Healthcare': [
    'healthcare', 'medical', 'health', 'clinic', 'hospital', 'pharmacy',
    'wellness', 'fitness', 'therapy', 'treatment', 'diagnosis', 'patient'
  ],
  'Education': [
    'education', 'school', 'university', 'college', 'training', 'learning',
    'course', 'academy', 'institute', 'tutoring', 'edtech', 'e-learning'
  ],
  'Manufacturing': [
    'manufacturing', 'production', 'factory', 'industrial', 'machinery',
    'equipment', 'supply chain', 'logistics', 'distribution', 'assembly'
  ],
  'Real Estate': [
    'real estate', 'property', 'housing', 'construction', 'development',
    'architect', 'building', 'commercial', 'residential', 'leasing'
  ],
  'Financial Services': [
    'finance', 'banking', 'investment', 'insurance', 'fintech', 'payments',
    'lending', 'credit', 'wealth', 'trading', 'cryptocurrency', 'blockchain'
  ],
  'Local Services': [
    'local', 'service', 'repair', 'maintenance', 'cleaning', 'plumbing',
    'electrical', 'hvac', 'landscaping', 'contractor', 'handyman'
  ]
};

// Company size indicators
const SIZE_INDICATORS = {
  'Solo/1-10': [
    'solo', 'freelance', 'independent', 'consultant', 'contractor', 'startup',
    'small team', 'boutique', 'personal', 'individual'
  ],
  '11-50': [
    'small business', 'smb', 'growing team', 'expanding', 'scale up',
    'medium sized', 'mid-size'
  ],
  '51-200': [
    'established', 'mature', 'enterprise', 'corporate', 'large team',
    'multiple locations', 'branch offices'
  ],
  '200+': [
    'large enterprise', 'fortune', 'multinational', 'global', 'conglomerate',
    'public company', 'corporation', 'inc', 'llc', 'ltd'
  ]
};

// Regional indicators
const REGION_INDICATORS = {
  'Local': ['local', 'neighborhood', 'community', 'city', 'town', 'area'],
  'Regional': ['regional', 'state', 'province', 'county', 'district', 'territory'],
  'National': ['national', 'country', 'nationwide', 'domestic', 'usa', 'canada'],
  'International': ['international', 'global', 'worldwide', 'multinational', 'overseas']
};

// Buyer role patterns
const BUYER_ROLE_PATTERNS = {
  'CEO/Founder': ['ceo', 'founder', 'owner', 'president', 'executive', 'leader'],
  'CTO/Technical': ['cto', 'technical', 'engineering', 'development', 'it', 'tech'],
  'VP Sales': ['vp sales', 'sales director', 'revenue', 'business development', 'partnerships'],
  'Marketing Lead': ['marketing', 'cmo', 'brand', 'growth', 'demand', 'content'],
  'Operations': ['operations', 'coo', 'operations manager', 'process', 'efficiency'],
  'Finance': ['cfo', 'finance', 'accounting', 'controller', 'treasurer', 'financial'],
  'HR': ['hr', 'human resources', 'talent', 'recruiting', 'people', 'culture']
};

// Industry-agnostic business model patterns
const BUSINESS_MODEL_PATTERNS = {
  'B2B SaaS': ['saas', 'software as a service', 'subscription', 'platform', 'api'],
  'B2C E-commerce': ['ecommerce', 'online store', 'retail', 'marketplace', 'consumer'],
  'B2B Services': ['consulting', 'agency', 'professional services', 'advisory', 'outsourcing'],
  'Marketplace': ['marketplace', 'platform', 'two-sided', 'peer-to-peer', 'gig economy'],
  'Freemium': ['freemium', 'free tier', 'premium', 'upgrade', 'trial'],
  'Enterprise': ['enterprise', 'large scale', 'corporate', 'fortune 500', 'b2b enterprise'],
  'Local Services': ['local', 'on-demand', 'service provider', 'contractor', 'handyman'],
  'Content/Media': ['content', 'media', 'publishing', 'streaming', 'advertising'],
  'Manufacturing': ['manufacturing', 'production', 'supply chain', 'wholesale', 'distribution']
};

// Growth stage indicators
const GROWTH_STAGE_PATTERNS = {
  'Startup': ['startup', 'early stage', 'seed', 'pre-seed', 'mvp', 'beta', 'launching'],
  'Growth': ['growing', 'scaling', 'expanding', 'hiring', 'funding', 'series a', 'series b'],
  'Mature': ['established', 'mature', 'stable', 'profitable', 'market leader', 'incumbent'],
  'Decline': ['declining', 'struggling', 'downsizing', 'restructuring', 'pivot', 'crisis']
};

// Decision making process indicators
const DECISION_MAKING_PATTERNS = {
  'Individual': ['solo', 'individual', 'personal', 'freelancer', 'consultant', 'owner'],
  'Small Team': ['small team', 'startup', 'boutique', 'partnership', '2-5 people'],
  'Committee': ['committee', 'board', 'stakeholders', 'multiple decision makers', 'consensus'],
  'Hierarchical': ['hierarchical', 'corporate', 'enterprise', 'approval process', 'chain of command']
};

// Pain points and challenges
const PAIN_POINT_PATTERNS = {
  'Cost Reduction': ['cost', 'expensive', 'budget', 'savings', 'efficiency', 'roi'],
  'Scalability': ['scale', 'growth', 'capacity', 'expansion', 'bottleneck', 'limitation'],
  'Technology': ['technology', 'digital', 'automation', 'integration', 'system', 'platform'],
  'Competition': ['competition', 'competitive', 'market share', 'differentiation', 'advantage'],
  'Compliance': ['compliance', 'regulation', 'legal', 'audit', 'security', 'privacy'],
  'Customer Acquisition': ['customers', 'leads', 'marketing', 'sales', 'conversion', 'retention'],
  'Operations': ['operations', 'process', 'workflow', 'productivity', 'management', 'coordination']
};

// Value proposition indicators
const VALUE_PROPOSITION_PATTERNS = {
  'Time Saving': ['time', 'fast', 'quick', 'efficient', 'automated', 'instant'],
  'Cost Effective': ['affordable', 'cost-effective', 'budget-friendly', 'value', 'savings'],
  'Quality': ['quality', 'premium', 'excellent', 'superior', 'best-in-class', 'high-end'],
  'Innovation': ['innovative', 'cutting-edge', 'advanced', 'modern', 'next-generation', 'revolutionary'],
  'Reliability': ['reliable', 'trusted', 'proven', 'stable', 'consistent', 'dependable'],
  'Customization': ['custom', 'personalized', 'tailored', 'flexible', 'configurable', 'adaptable']
};

/**
 * Parse URL to extract business information
 */
export function parseUrl(url: string): ParsedUrlData {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const domainParts = domain.split('.');
    
    // Extract company name (remove www, subdomains, and TLD)
    let companyName = domainParts[0];
    if (companyName === 'www') {
      companyName = domainParts[1] || domainParts[0];
    }
    
    // Check if it's a subdomain
    const isSubdomain = domainParts.length > 2 && domainParts[0] !== 'www';
    const subdomain = isSubdomain ? domainParts[0] : undefined;
    
    // Extract TLD
    const tld = domainParts[domainParts.length - 1];
    
    // Analyze domain for industry hints
    const potentialIndustry = analyzeDomainForIndustry(domain, companyName);
    
    // Analyze domain for size hints
    const potentialSize = analyzeDomainForSize(domain, companyName);
    
    // Analyze domain for region hints
    const potentialRegion = analyzeDomainForRegion(domain, companyName);
    
    return {
      domain,
      companyName,
      subdomain,
      path: urlObj.pathname,
      tld,
      isSubdomain,
      potentialIndustry,
      potentialSize,
      potentialRegion
    };
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Parse brief text to extract business information
 */
export function parseBrief(brief: string): ParsedBriefData {
  const briefLower = brief.toLowerCase();
  const words = briefLower.split(/\s+/);
  
  // Extract keywords (remove common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const keywords = words
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Top 10 keywords
  
  // Analyze for industry
  const industry = analyzeTextForIndustry(briefLower);
  
  // Analyze for size
  const size = analyzeTextForSize(briefLower);
  
  // Analyze for region
  const region = analyzeTextForRegion(briefLower);
  
  // Analyze for buyer roles
  const buyerRoles = analyzeTextForBuyerRoles(briefLower);
  
  // Analyze for business type
  const businessType = analyzeTextForBusinessType(briefLower);
  
  // Extract services
  const services = extractServices(briefLower);
  
  return {
    keywords,
    industry,
    size,
    region,
    buyerRoles,
    businessType,
    services
  };
}

/**
 * Generate comprehensive industry-agnostic ICP preview from parsed URL and brief data
 */
export function generateIcpPreview(
  urlData: ParsedUrlData,
  briefData: ParsedBriefData,
  metadata: Record<string, unknown> = {}
): IcpPreview {
  // Combine and prioritize industry information
  const allIndustries = [...urlData.potentialIndustry, ...briefData.industry];
  const businessCategory = selectBestIndustry(allIndustries);
  
  // Combine and prioritize size information
  const allSizes = [urlData.potentialSize, briefData.size].filter(Boolean);
  const companySize = selectBestSize(allSizes);
  
  // Combine and prioritize region information
  const allRegions = [urlData.potentialRegion, briefData.region].filter(Boolean);
  const region = selectBestRegion(allRegions);
  
  // Combine buyer roles
  const buyerRoles = [...new Set(briefData.buyerRoles)].slice(0, 5);
  
  // Combine keywords
  const keywords = [...new Set([...briefData.keywords, ...briefData.services])].slice(0, 8);
  
  // Enhanced industry-agnostic analysis
  const combinedText = `${urlData.domain} ${urlData.companyName} ${briefData.keywords.join(' ')} ${briefData.services.join(' ')}`.toLowerCase();
  
  // Analyze business model
  const businessModel = analyzeBusinessModel(combinedText, businessCategory);
  
  // Analyze target market
  const targetMarket = analyzeTargetMarket(combinedText, companySize, region);
  
  // Analyze growth stage
  const growthStage = analyzeGrowthStage(combinedText, companySize);
  
  // Analyze decision making process
  const decisionMakingProcess = analyzeDecisionMaking(combinedText, companySize);
  
  // Analyze pain points
  const painPoints = analyzePainPoints(combinedText);
  
  // Analyze value proposition
  const valueProposition = analyzeValueProposition(combinedText);
  
  // Analyze competitive advantage
  const competitiveAdvantage = analyzeCompetitiveAdvantage(combinedText, businessCategory);
  
  // Analyze market position
  const marketPosition = analyzeMarketPosition(combinedText, companySize, businessCategory);
  
  // Analyze revenue model
  const revenueModel = analyzeRevenueModel(combinedText, businessModel);
  
  // Analyze customer segments
  const customerSegments = analyzeCustomerSegments(combinedText, businessCategory);
  
  // Analyze geographic focus
  const geographicFocus = analyzeGeographicFocus(combinedText, region);
  
  // Analyze technology adoption
  const technologyAdoption = analyzeTechnologyAdoption(combinedText, businessCategory);
  
  // Analyze regulatory environment
  const regulatoryEnvironment = analyzeRegulatoryEnvironment(combinedText, businessCategory);
  
  // Analyze seasonality
  const seasonality = analyzeSeasonality(combinedText, businessCategory);
  
  // Analyze buying behavior
  const buyingBehavior = analyzeBuyingBehavior(combinedText, companySize, businessModel);
  
  // Analyze budget indicators
  const budgetIndicators = analyzeBudgetIndicators(combinedText, companySize, businessCategory);
  
  // Analyze urgency signals
  const urgencySignals = analyzeUrgencySignals(combinedText, growthStage);
  
  // Analyze success metrics
  const successMetrics = analyzeSuccessMetrics(combinedText, businessCategory, businessModel);
  
  // Calculate enhanced confidence based on data quality
  const confidence = calculateEnhancedConfidence(
    urlData, briefData, businessCategory, companySize, region,
    businessModel, growthStage, painPoints.length, valueProposition
  );
  
  // Create enhanced sources
  const sources = [
    {
      type: 'URL Analysis',
      url: `https://${urlData.domain}`,
      extractedData: [
        `Domain: ${urlData.domain}`,
        `Company: ${urlData.companyName}`,
        `Industry indicators: ${urlData.potentialIndustry.join(', ') || 'None'}`,
        `Size indicators: ${urlData.potentialSize || 'Unknown'}`,
        `Region indicators: ${urlData.potentialRegion || 'Unknown'}`,
        `Business model: ${businessModel}`,
        `Growth stage: ${growthStage}`
      ]
    },
    {
      type: 'Brief Analysis',
      extractedData: [
        `Keywords: ${briefData.keywords.join(', ')}`,
        `Industry: ${briefData.industry.join(', ') || 'None'}`,
        `Business type: ${briefData.businessType}`,
        `Services: ${briefData.services.join(', ') || 'None'}`,
        `Buyer roles: ${briefData.buyerRoles.join(', ') || 'None'}`,
        `Pain points: ${painPoints.join(', ') || 'None'}`,
        `Value proposition: ${valueProposition}`
      ]
    },
    {
      type: 'Industry-Agnostic Analysis',
      extractedData: [
        `Target market: ${targetMarket}`,
        `Decision process: ${decisionMakingProcess}`,
        `Competitive advantage: ${competitiveAdvantage}`,
        `Market position: ${marketPosition}`,
        `Revenue model: ${revenueModel}`,
        `Technology adoption: ${technologyAdoption}`,
        `Buying behavior: ${buyingBehavior}`
      ]
    }
  ];
  
  return {
    businessCategory,
    companySize,
    region,
    buyerRoles,
    keywords,
    confidence,
    sources,
    metadata,
    // Enhanced industry-agnostic features
    businessModel,
    targetMarket,
    growthStage,
    decisionMakingProcess,
    painPoints,
    valueProposition,
    competitiveAdvantage,
    marketPosition,
    revenueModel,
    customerSegments,
    geographicFocus,
    technologyAdoption,
    regulatoryEnvironment,
    seasonality,
    buyingBehavior,
    budgetIndicators,
    urgencySignals,
    successMetrics
  };
}

// Helper functions

function analyzeDomainForIndustry(domain: string, companyName: string): string[] {
  const industries: string[] = [];
  const text = `${domain} ${companyName}`.toLowerCase();
  
  for (const [industry, patterns] of Object.entries(INDUSTRY_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      industries.push(industry);
    }
  }
  
  return industries;
}

function analyzeDomainForSize(domain: string, companyName: string): string {
  const text = `${domain} ${companyName}`.toLowerCase();
  
  for (const [size, patterns] of Object.entries(SIZE_INDICATORS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return size;
    }
  }
  
  return 'Unknown';
}

function analyzeDomainForRegion(domain: string, companyName: string): string {
  const text = `${domain} ${companyName}`.toLowerCase();
  
  for (const [region, patterns] of Object.entries(REGION_INDICATORS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return region;
    }
  }
  
  return 'Unknown';
}

function analyzeTextForIndustry(text: string): string[] {
  const industries: string[] = [];
  
  for (const [industry, patterns] of Object.entries(INDUSTRY_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      industries.push(industry);
    }
  }
  
  return industries;
}

function analyzeTextForSize(text: string): string {
  for (const [size, patterns] of Object.entries(SIZE_INDICATORS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return size;
    }
  }
  
  return 'Unknown';
}

function analyzeTextForRegion(text: string): string {
  for (const [region, patterns] of Object.entries(REGION_INDICATORS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return region;
    }
  }
  
  return 'Unknown';
}

function analyzeTextForBuyerRoles(text: string): string[] {
  const roles: string[] = [];
  
  for (const [role, patterns] of Object.entries(BUYER_ROLE_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      roles.push(role);
    }
  }
  
  return roles;
}

function analyzeTextForBusinessType(text: string): string {
  if (text.includes('b2b') || text.includes('business to business')) return 'B2B';
  if (text.includes('b2c') || text.includes('business to consumer')) return 'B2C';
  if (text.includes('saas') || text.includes('software as a service')) return 'SaaS';
  if (text.includes('ecommerce') || text.includes('e-commerce')) return 'E-commerce';
  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('platform')) return 'Platform';
  if (text.includes('agency') || text.includes('consulting')) return 'Service';
  if (text.includes('manufacturing') || text.includes('production')) return 'Manufacturing';
  
  return 'General Business';
}

function extractServices(text: string): string[] {
  const serviceKeywords = [
    'service', 'services', 'solution', 'solutions', 'product', 'products',
    'offering', 'offerings', 'consulting', 'development', 'design', 'marketing',
    'support', 'maintenance', 'training', 'implementation', 'integration'
  ];
  
  const words = text.split(/\s+/);
  const services: string[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    if (serviceKeywords.includes(words[i])) {
      const service = `${words[i]} ${words[i + 1]}`;
      services.push(service);
    }
  }
  
  return services.slice(0, 5);
}

function selectBestIndustry(industries: string[]): string {
  if (industries.length === 0) return 'General Business';
  
  // Count occurrences and return most common
  const counts = industries.reduce((acc, industry) => {
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0];
}

function selectBestSize(sizes: string[]): string {
  if (sizes.length === 0) return 'Unknown';
  
  // Prefer more specific sizes
  const sizeOrder = ['Solo/1-10', '11-50', '51-200', '200+'];
  for (const size of sizeOrder) {
    if (sizes.includes(size)) return size;
  }
  
  return sizes[0];
}

function selectBestRegion(regions: string[]): string {
  if (regions.length === 0) return 'Unknown';
  
  // Prefer more specific regions
  const regionOrder = ['Local', 'Regional', 'National', 'International'];
  for (const region of regionOrder) {
    if (regions.includes(region)) return region;
  }
  
  return regions[0];
}

function calculateEnhancedConfidence(
  urlData: ParsedUrlData,
  briefData: ParsedBriefData,
  businessCategory: string,
  companySize: string,
  region: string,
  businessModel: string,
  growthStage: string,
  painPointsCount: number,
  valueProposition: string
): 'Low' | 'Medium' | 'High' {
  let score = 0;
  
  // URL analysis score
  if (urlData.potentialIndustry.length > 0) score += 2;
  if (urlData.potentialSize !== 'Unknown') score += 1;
  if (urlData.potentialRegion !== 'Unknown') score += 1;
  
  // Brief analysis score
  if (briefData.industry.length > 0) score += 2;
  if (briefData.size !== 'Unknown') score += 1;
  if (briefData.region !== 'Unknown') score += 1;
  if (briefData.buyerRoles.length > 0) score += 1;
  if (briefData.keywords.length > 3) score += 1;
  
  // Enhanced analysis score
  if (businessCategory !== 'General Business') score += 1;
  if (companySize !== 'Unknown') score += 1;
  if (region !== 'Unknown') score += 1;
  if (businessModel !== 'Unknown') score += 1;
  if (growthStage !== 'Unknown') score += 1;
  if (painPointsCount > 0) score += 1;
  if (valueProposition !== 'Unknown') score += 1;
  
  if (score >= 12) return 'High';
  if (score >= 8) return 'Medium';
  return 'Low';
}

// Enhanced analysis functions

function analyzeBusinessModel(text: string, businessCategory: string): string {
  for (const [model, patterns] of Object.entries(BUSINESS_MODEL_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return model;
    }
  }
  
  // Fallback based on business category
  if (businessCategory.includes('Technology/SaaS')) return 'B2B SaaS';
  if (businessCategory.includes('E-commerce')) return 'B2C E-commerce';
  if (businessCategory.includes('Professional Services')) return 'B2B Services';
  if (businessCategory.includes('Local Services')) return 'Local Services';
  
  return 'Unknown';
}

function analyzeTargetMarket(text: string, companySize: string, region: string): string {
  if (companySize === 'Solo/1-10') return 'Micro businesses and freelancers';
  if (companySize === '11-50') return 'Small to medium businesses';
  if (companySize === '51-200') return 'Mid-market companies';
  if (companySize === '200+') return 'Enterprise and large corporations';
  
  if (text.includes('consumer') || text.includes('b2c')) return 'Consumer market';
  if (text.includes('enterprise') || text.includes('b2b')) return 'Business market';
  if (text.includes('government') || text.includes('public')) return 'Public sector';
  
  return 'Mixed market';
}

function analyzeGrowthStage(text: string, companySize: string): string {
  for (const [stage, patterns] of Object.entries(GROWTH_STAGE_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return stage;
    }
  }
  
  // Infer from company size
  if (companySize === 'Solo/1-10') return 'Startup';
  if (companySize === '11-50') return 'Growth';
  if (companySize === '51-200') return 'Growth';
  if (companySize === '200+') return 'Mature';
  
  return 'Unknown';
}

function analyzeDecisionMaking(text: string, companySize: string): string {
  for (const [process, patterns] of Object.entries(DECISION_MAKING_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return process;
    }
  }
  
  // Infer from company size
  if (companySize === 'Solo/1-10') return 'Individual';
  if (companySize === '11-50') return 'Small Team';
  if (companySize === '51-200') return 'Committee';
  if (companySize === '200+') return 'Hierarchical';
  
  return 'Unknown';
}

function analyzePainPoints(text: string): string[] {
  const painPoints: string[] = [];
  
  for (const [painPoint, patterns] of Object.entries(PAIN_POINT_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      painPoints.push(painPoint);
    }
  }
  
  return painPoints.slice(0, 5); // Top 5 pain points
}

function analyzeValueProposition(text: string): string {
  for (const [proposition, patterns] of Object.entries(VALUE_PROPOSITION_PATTERNS)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      return proposition;
    }
  }
  
  return 'Unknown';
}

function analyzeCompetitiveAdvantage(text: string, businessCategory: string): string {
  if (text.includes('innovative') || text.includes('cutting-edge')) return 'Innovation and technology';
  if (text.includes('quality') || text.includes('premium')) return 'Quality and reliability';
  if (text.includes('cost') || text.includes('affordable')) return 'Cost efficiency';
  if (text.includes('local') || text.includes('personal')) return 'Local expertise and personal service';
  if (text.includes('scale') || text.includes('enterprise')) return 'Scale and resources';
  
  return 'Standard market offering';
}

function analyzeMarketPosition(text: string, companySize: string, businessCategory: string): string {
  if (text.includes('leader') || text.includes('market leader')) return 'Market leader';
  if (text.includes('challenger') || text.includes('disruptor')) return 'Market challenger';
  if (text.includes('niche') || text.includes('specialist')) return 'Niche specialist';
  if (companySize === '200+') return 'Established player';
  if (companySize === 'Solo/1-10') return 'Emerging player';
  
  return 'Competitive player';
}

function analyzeRevenueModel(text: string, businessModel: string): string {
  if (text.includes('subscription') || text.includes('recurring')) return 'Subscription-based';
  if (text.includes('transaction') || text.includes('commission')) return 'Transaction-based';
  if (text.includes('license') || text.includes('perpetual')) return 'License-based';
  if (text.includes('freemium') || text.includes('free tier')) return 'Freemium';
  if (text.includes('consulting') || text.includes('hourly')) return 'Service-based';
  
  return 'Mixed revenue model';
}

function analyzeCustomerSegments(text: string, businessCategory: string): string[] {
  const segments: string[] = [];
  
  if (text.includes('startup') || text.includes('early stage')) segments.push('Startups');
  if (text.includes('enterprise') || text.includes('large')) segments.push('Enterprise');
  if (text.includes('small business') || text.includes('smb')) segments.push('SMBs');
  if (text.includes('consumer') || text.includes('individual')) segments.push('Consumers');
  if (text.includes('government') || text.includes('public')) segments.push('Public sector');
  
  return segments.length > 0 ? segments : ['General market'];
}

function analyzeGeographicFocus(text: string, region: string): string {
  if (region === 'Local') return 'Local market focus';
  if (region === 'Regional') return 'Regional market focus';
  if (region === 'National') return 'National market focus';
  if (region === 'International') return 'Global market focus';
  
  return 'Mixed geographic focus';
}

function analyzeTechnologyAdoption(text: string, businessCategory: string): string {
  if (text.includes('ai') || text.includes('machine learning') || text.includes('automation')) return 'High technology adoption';
  if (text.includes('cloud') || text.includes('digital') || text.includes('online')) return 'Moderate technology adoption';
  if (text.includes('traditional') || text.includes('legacy')) return 'Low technology adoption';
  
  if (businessCategory.includes('Technology/SaaS')) return 'High technology adoption';
  if (businessCategory.includes('Local Services')) return 'Low technology adoption';
  
  return 'Moderate technology adoption';
}

function analyzeRegulatoryEnvironment(text: string, businessCategory: string): string {
  if (businessCategory.includes('Healthcare')) return 'Highly regulated';
  if (businessCategory.includes('Financial Services')) return 'Highly regulated';
  if (businessCategory.includes('Education')) return 'Moderately regulated';
  if (businessCategory.includes('Technology/SaaS')) return 'Moderately regulated';
  
  return 'Low regulation';
}

function analyzeSeasonality(text: string, businessCategory: string): string {
  if (text.includes('seasonal') || text.includes('holiday')) return 'Highly seasonal';
  if (businessCategory.includes('E-commerce')) return 'Moderately seasonal';
  if (businessCategory.includes('Local Services')) return 'Moderately seasonal';
  
  return 'Low seasonality';
}

function analyzeBuyingBehavior(text: string, companySize: string, businessModel: string): string {
  if (companySize === 'Solo/1-10') return 'Quick decision making';
  if (companySize === '11-50') return 'Moderate decision process';
  if (companySize === '51-200') return 'Formal decision process';
  if (companySize === '200+') return 'Complex decision process';
  
  return 'Standard decision process';
}

function analyzeBudgetIndicators(text: string, companySize: string, businessCategory: string): string[] {
  const indicators: string[] = [];
  
  if (companySize === '200+') indicators.push('Large budget capacity');
  if (companySize === '51-200') indicators.push('Moderate budget capacity');
  if (companySize === '11-50') indicators.push('Limited budget capacity');
  if (companySize === 'Solo/1-10') indicators.push('Very limited budget');
  
  if (businessCategory.includes('Technology/SaaS')) indicators.push('Technology investment focus');
  if (businessCategory.includes('Healthcare')) indicators.push('Compliance and quality focus');
  if (businessCategory.includes('Financial Services')) indicators.push('ROI and efficiency focus');
  
  return indicators;
}

function analyzeUrgencySignals(text: string, growthStage: string): string[] {
  const signals: string[] = [];
  
  if (growthStage === 'Startup') signals.push('Rapid growth needs');
  if (growthStage === 'Growth') signals.push('Scaling challenges');
  if (text.includes('urgent') || text.includes('immediate')) signals.push('Immediate needs');
  if (text.includes('competition') || text.includes('competitive')) signals.push('Competitive pressure');
  
  return signals;
}

function analyzeSuccessMetrics(text: string, businessCategory: string, businessModel: string): string[] {
  const metrics: string[] = [];
  
  if (businessModel.includes('SaaS')) metrics.push('User engagement', 'Churn rate', 'MRR growth');
  if (businessModel.includes('E-commerce')) metrics.push('Conversion rate', 'Average order value', 'Customer lifetime value');
  if (businessModel.includes('Services')) metrics.push('Client satisfaction', 'Project completion rate', 'Revenue per client');
  
  metrics.push('Revenue growth', 'Customer acquisition cost', 'Return on investment');
  
  return metrics.slice(0, 5);
}
