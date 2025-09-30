import { Playbook, PlaybookInput, PlaybookResult, Signal, Source, extractDomain, nowIso } from './types';

// Lightweight business profile playbook mirroring frontend parsing heuristics (offline)

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Technology/SaaS': ['saas', 'software', 'platform', 'api', 'cloud', 'automation', 'ai'],
  'E-commerce': ['ecommerce', 'shop', 'store', 'retail', 'cart', 'checkout'],
  'Professional Services': ['agency', 'consulting', 'advisory', 'design', 'marketing'],
  'Healthcare': ['health', 'clinic', 'hospital', 'medical'],
  'Financial Services': ['fintech', 'bank', 'finance', 'payment', 'credit'],
  'Local Services': ['plumbing', 'hvac', 'landscaping', 'contractor', 'repair'],
};

const SIZE_BANDS: Record<string, string[]> = {
  'Solo/1-10': ['solo', 'freelance', 'independent', 'boutique', 'startup'],
  '11-50': ['smb', 'small business', 'growing'],
  '51-200': ['established', 'mature', 'multi-office'],
  '200+': ['enterprise', 'global', 'fortune'],
};

const REGION_HINTS: Record<string, string[]> = {
  Local: ['local', 'city', 'neighborhood'],
  Regional: ['state', 'province', 'county'],
  National: ['nationwide', 'domestic', 'usa', 'canada'],
  International: ['global', 'worldwide', 'international', 'multinational'],
};

function guessIndustry(text: string): string {
  for (const [label, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (kws.some((k) => text.includes(k))) return label;
  }
  return 'General Business';
}

function guessSize(text: string): string {
  for (const [label, kws] of Object.entries(SIZE_BANDS)) {
    if (kws.some((k) => text.includes(k))) return label;
  }
  return 'Unknown';
}

function guessRegion(text: string): string {
  for (const [label, kws] of Object.entries(REGION_HINTS)) {
    if (kws.some((k) => text.includes(k))) return label;
  }
  return 'Unknown';
}

export const BusinessProfilePlaybook: Playbook = {
  id: 'playbook.profile.v1',
  name: 'Business Profile',
  async run(input: PlaybookInput): Promise<PlaybookResult> {
    const startedAt = nowIso();
    const domain = extractDomain(input.url);
    const brief = (input.brief || '').toLowerCase();

    // Prefer ICP data if available (AI-inferred), otherwise fallback to heuristics
    const text = `${domain} ${brief}`;
    const industry = input.icp?.businessCategory || guessIndustry(text);
    const size = input.icp?.companySize || guessSize(text);
    const region = input.icp?.targetMarket || guessRegion(text);

    const sources: Source[] = [
      { type: 'Website', url: `https://${domain}`, notes: 'Heuristic profile analysis (offline)' },
    ];

    // Higher confidence if using ICP data (AI-inferred)
    const usingIcp = !!input.icp;
    const signals: Signal[] = [
      {
        category: 'profile',
        name: 'IndustryGuess',
        value: industry,
        confidence: usingIcp ? 95 : (industry === 'General Business' ? 40 : 65),
        source: sources[0],
        evidence: usingIcp ? ['AI-inferred from ICP analysis'] : undefined
      },
      {
        category: 'profile',
        name: 'CompanySizeHint',
        value: size,
        confidence: usingIcp ? 90 : (size === 'Unknown' ? 30 : 55),
        source: sources[0],
        evidence: usingIcp ? ['AI-inferred from ICP analysis'] : undefined
      },
      {
        category: 'profile',
        name: 'RegionHint',
        value: region,
        confidence: usingIcp ? 85 : (region === 'Unknown' ? 30 : 50),
        source: sources[0],
        evidence: usingIcp ? ['AI-inferred from ICP analysis'] : undefined
      },
    ];

    const finishedAt = nowIso();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    return {
      playbookId: this.id,
      name: this.name,
      signals,
      sources,
      startedAt,
      finishedAt,
      durationMs,
    };
  },
};

