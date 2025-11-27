import { Contact, ContactSource } from '../../types/contact';
import { EmailDiscoveryProvider, ProviderOptions } from './emailDiscovery';

interface HunterEmail {
  value: string;
  type: 'personal' | 'generic';
  confidence: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  seniority?: string;
  department?: string;
  linkedin?: string;
  twitter?: string;
  phone_number?: string;
  sources?: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
    last_seen_on: string;
    still_on_page: boolean;
  }>;
  verification?: {
    date: string;
    status: 'valid' | 'invalid' | 'unknown';
  };
}

interface HunterDomainSearchResponse {
  data: {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    accept_all: boolean;
    pattern: string;
    organization: string;
    country: string;
    state: string;
    city: string;
    emails: HunterEmail[];
  };
  meta: {
    results: number;
    limit: number;
    offset: number;
    params: {
      domain: string;
      company?: string;
      type?: string;
      seniority?: string;
      department?: string;
    };
  };
}

interface HunterErrorResponse {
  errors?: Array<{ id: string; code: number; details: string }>;
}

function sanitizeDomain(domainOrUrl: string): string {
  try {
    const u = new URL(domainOrUrl);
    return u.hostname.toLowerCase();
  } catch {
    return domainOrUrl.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

function mapHunterConfidence(hunterConfidence: number): number {
  // Hunter returns 0-100 confidence, we use the same scale
  return Math.min(95, Math.max(40, hunterConfidence));
}

function mapVerificationStatus(status?: string): 'verified' | 'invalid' | 'unverified' {
  if (status === 'valid') return 'verified';
  if (status === 'invalid') return 'invalid';
  return 'unverified';
}

export class HunterIoProvider implements EmailDiscoveryProvider {
  name: 'hunter' = 'hunter';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async discover(domainOrUrl: string, options?: ProviderOptions): Promise<Contact[]> {
    const domain = sanitizeDomain(domainOrUrl);
    const limit = options?.limit ?? 10;

    // Build query parameters
    const params = new URLSearchParams({
      domain,
      api_key: this.apiKey,
      limit: String(Math.min(limit, 100)), // Hunter max is 100
    });

    // Map roles to Hunter's seniority filter
    if (options?.roles?.length) {
      const roles = options.roles.map((r) => r.toLowerCase());
      if (roles.some((r) => r.includes('owner') || r.includes('ceo') || r.includes('founder'))) {
        params.set('seniority', 'executive');
      } else if (roles.some((r) => r.includes('director') || r.includes('vp'))) {
        params.set('seniority', 'senior');
      } else if (roles.some((r) => r.includes('manager'))) {
        params.set('seniority', 'manager');
      }
    }

    try {
      const response = await fetch(`https://api.hunter.io/v2/domain-search?${params.toString()}`);

      if (!response.ok) {
        const errorData = (await response.json()) as HunterErrorResponse;
        console.error('[HunterIo] API error:', response.status, errorData.errors);

        // Return empty on rate limit or other errors to allow fallback to mock
        if (response.status === 429) {
          console.warn('[HunterIo] Rate limited, returning empty to allow fallback');
          return [];
        }
        if (response.status === 401 || response.status === 403) {
          console.warn('[HunterIo] Invalid API key, returning empty to allow fallback');
          return [];
        }

        return [];
      }

      const data = (await response.json()) as HunterDomainSearchResponse;

      if (!data.data?.emails?.length) {
        console.log(`[HunterIo] No emails found for domain: ${domain}`);
        return [];
      }

      // Convert Hunter emails to our Contact format
      const contacts: Contact[] = data.data.emails.map((email, idx) => {
        const source: ContactSource = {
          provider: 'hunter',
          url: `https://hunter.io/search/${domain}`,
          notes: `Hunter.io ${email.type} email`,
        };

        // Add source URLs from Hunter
        if (email.sources?.length) {
          source.notes += ` | Found on: ${email.sources
            .slice(0, 3)
            .map((s) => s.domain)
            .join(', ')}`;
        }

        return {
          id: `hunter:${email.value}:${idx}`,
          email: email.value,
          firstName: email.first_name,
          lastName: email.last_name,
          name: [email.first_name, email.last_name].filter(Boolean).join(' ') || undefined,
          role: email.position || undefined,
          title: email.position || undefined,
          domain,
          pattern: data.data.pattern || 'unknown',
          confidence: mapHunterConfidence(email.confidence),
          verification: {
            status: mapVerificationStatus(email.verification?.status),
            score: email.verification?.status === 'valid' ? 95 : undefined,
          },
          sources: [source],
          // Store additional Hunter data for scoring/enrichment
          company: data.data.organization,
        };
      });

      console.log(`[HunterIo] Found ${contacts.length} contacts for domain: ${domain}`);
      return contacts;
    } catch (error) {
      console.error('[HunterIo] Network error:', error);
      return [];
    }
  }
}
