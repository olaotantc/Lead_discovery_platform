import { PatternSuggestion } from '../types/contact';

const DEFAULT_ROLE_PREFIXES = [
  'owner',
  'founder',
  'cofounder',
  'ceo',
  'gm',
  'managingdirector',
  'principal',
];

function sanitizeDomain(domainOrUrl: string): string {
  try {
    const u = new URL(domainOrUrl);
    return u.hostname.toLowerCase();
  } catch {
    return domainOrUrl.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

export function detectEmailPatterns(domainOrUrl: string, sampleFirst = 'alex', sampleLast = 'taylor', roles: string[] = []): PatternSuggestion[] {
  const domain = sanitizeDomain(domainOrUrl);

  // Core person-based patterns
  const base: PatternSuggestion[] = [
    { pattern: 'first.last', example: `${sampleFirst}.${sampleLast}@${domain}`, confidence: 82 },
    { pattern: 'first', example: `${sampleFirst}@${domain}`, confidence: 70 },
    { pattern: 'flast', example: `${sampleFirst[0]}${sampleLast}@${domain}`, confidence: 78 },
    { pattern: 'firstl', example: `${sampleFirst}${sampleLast[0]}@${domain}`, confidence: 72 },
    { pattern: 'f.last', example: `${sampleFirst[0]}.${sampleLast}@${domain}`, confidence: 74 },
    { pattern: 'first_last', example: `${sampleFirst}_${sampleLast}@${domain}`, confidence: 60 },
    { pattern: 'first-last', example: `${sampleFirst}-${sampleLast}@${domain}`, confidence: 58 },
    { pattern: 'last', example: `${sampleLast}@${domain}`, confidence: 50 },
  ];

  // Role-based guesses
  const rolePrefixes = new Set<string>();
  const lowerRoles = roles.map((r) => r.toLowerCase());
  if (lowerRoles.some((r) => r.includes('owner') || r.includes('gm'))) {
    ['owner', 'gm'].forEach((p) => rolePrefixes.add(p));
  }
  if (lowerRoles.some((r) => r.includes('decision'))) {
    ['ceo', 'founder'].forEach((p) => rolePrefixes.add(p));
  }
  DEFAULT_ROLE_PREFIXES.forEach((p) => rolePrefixes.add(p));

  const roleBased: PatternSuggestion[] = Array.from(rolePrefixes).map((p) => ({
    pattern: `role:${p}`,
    example: `${p}@${domain}`,
    confidence: 55,
    roleBased: true,
  }));

  return [...base, ...roleBased]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12);
}

export function generateCandidates(first: string, last: string, domainOrUrl: string, patterns: PatternSuggestion[]): string[] {
  const domain = sanitizeDomain(domainOrUrl);
  const f = first.toLowerCase();
  const l = last.toLowerCase();

  const emails = new Set<string>();
  for (const p of patterns) {
    switch (p.pattern) {
      case 'first.last':
        emails.add(`${f}.${l}@${domain}`);
        break;
      case 'first':
        emails.add(`${f}@${domain}`);
        break;
      case 'flast':
        emails.add(`${f[0]}${l}@${domain}`);
        break;
      case 'firstl':
        emails.add(`${f}${l[0]}@${domain}`);
        break;
      case 'f.last':
        emails.add(`${f[0]}.${l}@${domain}`);
        break;
      case 'first_last':
        emails.add(`${f}_${l}@${domain}`);
        break;
      case 'first-last':
        emails.add(`${f}-${l}@${domain}`);
        break;
      case 'last':
        emails.add(`${l}@${domain}`);
        break;
      default:
        if (p.pattern.startsWith('role:')) {
          const role = p.pattern.split(':')[1];
          emails.add(`${role}@${domain}`);
        }
    }
  }
  return Array.from(emails);
}

