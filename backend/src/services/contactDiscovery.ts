import Redis from 'ioredis';
import { createRedisClient } from '../config/database';
import { detectEmailPatterns } from './emailPatterns';
import { selectDiscoveryProviders } from './providers/emailDiscovery';
import { applyVerificationToContacts, verifyEmails } from './emailVerification';
import { Contact, DiscoveryRequest, DiscoveryResult } from '../types/contact';

const redis: Redis = createRedisClient();

const KEY_PREFIX = 'contacts:job:';

export async function startContactDiscovery(jobId: string, req: DiscoveryRequest): Promise<void> {
  const domain = sanitizeDomain(req.url);
  const result: DiscoveryResult = {
    jobId,
    domain,
    contacts: [],
    threshold: clampThreshold(req.threshold ?? 85),
    startedAt: new Date().toISOString(),
    status: 'pending',
  };
  await redis.set(`${KEY_PREFIX}${jobId}`, JSON.stringify(result));
}

export async function completeContactDiscovery(jobId: string, contacts: Contact[]): Promise<void> {
  const key = `${KEY_PREFIX}${jobId}`;
  const raw = await redis.get(key);
  if (!raw) return;
  const stored = JSON.parse(raw) as DiscoveryResult;
  stored.contacts = contacts;
  stored.finishedAt = new Date().toISOString();
  stored.status = 'completed';
  await redis.set(key, JSON.stringify(stored));
}

export async function failContactDiscovery(jobId: string, error: string): Promise<void> {
  const key = `${KEY_PREFIX}${jobId}`;
  const raw = await redis.get(key);
  const base: DiscoveryResult = raw ? JSON.parse(raw) : {
    jobId,
    domain: 'unknown',
    contacts: [],
    threshold: 85,
    startedAt: new Date().toISOString(),
    status: 'pending',
  };
  base.status = 'failed';
  (base as any).error = error;
  base.finishedAt = new Date().toISOString();
  await redis.set(key, JSON.stringify(base));
}

export async function getContactDiscovery(jobId: string): Promise<DiscoveryResult | null> {
  const raw = await redis.get(`${KEY_PREFIX}${jobId}`);
  return raw ? (JSON.parse(raw) as DiscoveryResult) : null;
}

export async function updateThreshold(jobId: string, threshold: number): Promise<DiscoveryResult | null> {
  const key = `${KEY_PREFIX}${jobId}`;
  const stored = await getContactDiscovery(jobId);
  if (!stored) return null;
  stored.threshold = clampThreshold(threshold);
  await redis.set(key, JSON.stringify(stored));
  return stored;
}

export async function processContactDiscoveryJob(jobId: string, req: DiscoveryRequest): Promise<Contact[]> {
  const domain = sanitizeDomain(req.url);

  // Heuristic patterns
  const patterns = detectEmailPatterns(domain, 'alex', 'taylor', req.roles || []);

  // Provider lookups (mocked while offline)
  const providers = selectDiscoveryProviders();
  const results = await Promise.all(providers.map((p) => p.discover(domain, { roles: req.roles, limit: req.limit ?? 10 })));
  let contacts = dedupeContacts(results.flat());

  // Optional: apply verification in-line to set initial status/score
  const toVerify = contacts.map((c) => c.email);
  const verifications = await verifyEmails(toVerify);
  contacts = applyVerificationToContacts(contacts, verifications);

  return contacts;
}

function dedupeContacts(contacts: Contact[]): Contact[] {
  const byEmail = new Map<string, Contact>();
  for (const c of contacts) {
    const key = c.email.toLowerCase();
    if (!byEmail.has(key)) {
      byEmail.set(key, c);
    } else {
      const prev = byEmail.get(key)!;
      // Merge sources and take max confidence
      byEmail.set(key, {
        ...prev,
        confidence: Math.max(prev.confidence, c.confidence),
        sources: [...prev.sources, ...c.sources],
      });
    }
  }
  return Array.from(byEmail.values()).sort((a, b) => (b.verification.score ?? b.confidence) - (a.verification.score ?? a.confidence));
}

function sanitizeDomain(domainOrUrl: string): string {
  try {
    const u = new URL(domainOrUrl);
    return u.hostname.toLowerCase();
  } catch {
    return domainOrUrl.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

function clampThreshold(n: number): number {
  return Math.max(70, Math.min(95, Math.round(n)));
}

