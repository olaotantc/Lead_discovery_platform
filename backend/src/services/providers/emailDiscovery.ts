import { Contact, ContactSource } from '../../types/contact';
import { detectEmailPatterns } from '../emailPatterns';

export interface ProviderOptions {
  roles?: string[];
  limit?: number;
}

export interface EmailDiscoveryProvider {
  name: 'hunter' | 'clearbit' | 'mock';
  discover(domainOrUrl: string, options?: ProviderOptions): Promise<Contact[]>;
}

function seedNames(domain: string): Array<{ firstName: string; lastName: string; role?: string; title?: string }> {
  // Simple deterministic seed based on domain chars
  const namesA = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Drew', 'Skyler'];
  const namesB = ['Smith', 'Johnson', 'Lee', 'Patel', 'Garcia', 'Brown', 'Davis', 'Martinez'];
  const roles = ['Owner', 'General Manager', 'CEO', 'CTO', 'VP Sales', 'Marketing Director'];
  const titles = roles;

  const n = domain.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const picks = [] as Array<{ firstName: string; lastName: string; role?: string; title?: string }>;
  for (let i = 0; i < 5; i++) {
    picks.push({
      firstName: namesA[(n + i) % namesA.length],
      lastName: namesB[(n + i * 3) % namesB.length],
      role: roles[(n + i * 2) % roles.length],
      title: titles[(n + i * 2) % titles.length],
    });
  }
  return picks;
}

function sanitizeDomain(domainOrUrl: string): string {
  try {
    const u = new URL(domainOrUrl);
    return u.hostname.toLowerCase();
  } catch {
    return domainOrUrl.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

function baseConfidenceForPattern(pattern: string): number {
  switch (pattern) {
    case 'first.last':
      return 88;
    case 'flast':
      return 82;
    case 'first':
      return 75;
    case 'firstl':
      return 74;
    case 'f.last':
      return 76;
    default:
      return 65;
  }
}

function toContact({ firstName, lastName, role, title }: any, email: string, pattern: string, domain: string, source: ContactSource, boost = 0): Contact {
  const id = `${email}`;
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
  const confidence = Math.min(95, Math.max(40, baseConfidenceForPattern(pattern) + boost));
  return {
    id,
    firstName,
    lastName,
    name,
    email,
    role,
    title,
    domain,
    pattern,
    confidence,
    verification: { status: 'unverified' },
    sources: [source],
  };
}

export class MockHunterProvider implements EmailDiscoveryProvider {
  name: 'hunter' | 'mock' = 'mock';

  async discover(domainOrUrl: string, options?: ProviderOptions): Promise<Contact[]> {
    const domain = sanitizeDomain(domainOrUrl);
    const patterns = detectEmailPatterns(domain, 'alex', 'taylor', options?.roles || []);
    const people = seedNames(domain);
    const source: ContactSource = { provider: 'mock', notes: 'MockHunter heuristic' };
    const contacts: Contact[] = [];
    const topPattern = patterns[0]?.pattern || 'first.last';
    for (const p of people) {
      const email = topPattern
        .replace('first.last', `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@${domain}`)
        .replace('first', `${p.firstName.toLowerCase()}@${domain}`)
        .replace('flast', `${p.firstName.toLowerCase()[0]}${p.lastName.toLowerCase()}@${domain}`)
        .replace('firstl', `${p.firstName.toLowerCase()}${p.lastName.toLowerCase()[0]}@${domain}`)
        .replace('f.last', `${p.firstName.toLowerCase()[0]}.${p.lastName.toLowerCase()}@${domain}`);
      contacts.push(toContact(p, email, topPattern, domain, source, 5));
    }

    // Add a couple of role-based guesses
    ['owner', 'ceo', 'gm'].forEach((roleKey) => {
      const email = `${roleKey}@${domain}`;
      contacts.push(
        toContact(
          { firstName: undefined, lastName: undefined, role: roleKey.toUpperCase(), title: roleKey.toUpperCase() },
          email,
          `role:${roleKey}`,
          domain,
          source,
          0,
        ),
      );
    });

    return (options?.limit ? contacts.slice(0, options.limit) : contacts).map((c, idx) => ({
      ...c,
      id: `${c.email}:${idx}`,
    }));
  }
}

export class MockClearbitProvider implements EmailDiscoveryProvider {
  name: 'clearbit' | 'mock' = 'mock';

  async discover(domainOrUrl: string, options?: ProviderOptions): Promise<Contact[]> {
    const domain = sanitizeDomain(domainOrUrl);
    const patterns = detectEmailPatterns(domain, 'morgan', 'lee', options?.roles || []);
    const people = seedNames(domain).reverse();
    const source: ContactSource = { provider: 'mock', notes: 'MockClearbit heuristic' };
    const contacts: Contact[] = [];
    const topPattern = patterns[0]?.pattern || 'flast';
    for (const p of people) {
      const email = topPattern
        .replace('first.last', `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@${domain}`)
        .replace('first', `${p.firstName.toLowerCase()}@${domain}`)
        .replace('flast', `${p.firstName.toLowerCase()[0]}${p.lastName.toLowerCase()}@${domain}`)
        .replace('firstl', `${p.firstName.toLowerCase()}${p.lastName.toLowerCase()[0]}@${domain}`)
        .replace('f.last', `${p.firstName.toLowerCase()[0]}.${p.lastName.toLowerCase()}@${domain}`);
      contacts.push(toContact(p, email, topPattern, domain, source));
    }
    return (options?.limit ? contacts.slice(0, options.limit) : contacts).map((c, idx) => ({
      ...c,
      id: `${c.email}:${idx}`,
    }));
  }
}

export function selectDiscoveryProviders(): EmailDiscoveryProvider[] {
  // With network disabled, return mock providers while preserving selection logic for future
  const providers: EmailDiscoveryProvider[] = [];

  if (process.env.HUNTER_API_KEY) {
    // Placeholder: would add real Hunter provider here
    providers.push(new MockHunterProvider());
  } else {
    providers.push(new MockHunterProvider());
  }

  if (process.env.CLEARBIT_API_KEY) {
    // Placeholder: would add real Clearbit provider here
    providers.push(new MockClearbitProvider());
  } else {
    providers.push(new MockClearbitProvider());
  }

  return providers;
}

