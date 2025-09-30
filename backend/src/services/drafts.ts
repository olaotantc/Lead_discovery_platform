import Redis from 'ioredis';
import { createRedisClient } from '../config/database';

const redis: Redis = createRedisClient();
const KEY_PREFIX = 'drafts:job:';

export interface DraftInputs {
  contactId: string;
  email: string;
  name?: string;
  tone?: 'direct' | 'consultative';
  evidenceData?: Record<string, unknown>;
}

export interface DraftContent {
  opener: string;
  followUp1: string;
  followUp2: string;
}

export interface DraftJobResult {
  jobId: string;
  contactId: string;
  email: string;
  tone: 'direct' | 'consultative';
  drafts: DraftContent;
  evidenceLinks: number;
  status: 'completed' | 'failed';
  error?: string;
  generatedAt: string;
}

export async function startDraftJob(jobId: string, inputs: DraftInputs): Promise<void> {
  const payload = {
    jobId,
    inputs,
    status: 'pending' as const,
    startedAt: new Date().toISOString(),
  };
  await redis.set(`${KEY_PREFIX}${jobId}`, JSON.stringify(payload));
}

export async function completeDraftJob(jobId: string, result: DraftJobResult): Promise<void> {
  await redis.set(`${KEY_PREFIX}${jobId}`, JSON.stringify(result));
}

export async function failDraftJob(jobId: string, error: string): Promise<void> {
  await redis.set(
    `${KEY_PREFIX}${jobId}`,
    JSON.stringify({ jobId, status: 'failed', error, generatedAt: new Date().toISOString() })
  );
}

export async function getDraftJob(jobId: string): Promise<DraftJobResult | null> {
  const raw = await redis.get(`${KEY_PREFIX}${jobId}`);
  return raw ? (JSON.parse(raw) as DraftJobResult) : null;
}

