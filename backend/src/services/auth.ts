import crypto from 'crypto';
import { Pool } from 'pg';
import { createPostgresPool } from '../config/database';
import { AuthToken, Plan, RateLimitStatus, User } from '../types/user';
import Redis from 'ioredis';

const pool: Pool = createPostgresPool();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ---- Password hashing (PBKDF2-based; bcrypt-like strength) ----
const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) =>
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split('$');
  if (parts.length !== 4) return false;
  const [, iterStr, salt, stored] = parts;
  const iters = parseInt(iterStr, 10) || PBKDF2_ITERATIONS;
  const derived = await new Promise<Buffer>((resolve, reject) =>
    crypto.pbkdf2(password, salt, iters, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
  return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), derived);
}

// ---- JWT (HS256) ----
const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret-please-change').toString();

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function generateJWT(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const expSeconds = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  const payload: AuthToken = { userId: user.id, email: user.email, plan: user.plan, exp: expSeconds };
  const head = b64url(JSON.stringify(header));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest();
  return `${head}.${body}.${b64url(sig)}`;
}

export function verifyJWT(token: string): AuthToken | null {
  try {
    const [head, body, sig] = token.split('.');
    if (!head || !body || !sig) return null;
    const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest());
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const decoded = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()) as AuthToken;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

// ---- Users (Postgres with Redis fallback for counters) ----
const DEFAULT_LIMITS: Record<Plan, number> = { free: 10, starter: 50, pro: 250, team: 250 };

export async function createUser(email: string, password: string, plan: Plan = 'free'): Promise<User> {
  const passwordHash = await hashPassword(password);
  const limit = DEFAULT_LIMITS[plan] ?? 10;
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, plan, discovery_limit, discovery_count)
     VALUES ($1,$2,$3,$4,0) RETURNING id, email, password_hash, plan, discovery_limit, discovery_count, created_at, last_reset_at`,
    [email.toLowerCase(), passwordHash, plan, limit]
  );
  const row = result.rows[0];
  return mapRowToUser(row);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const r = await pool.query(
    `SELECT id, email, password_hash, plan, discovery_limit, discovery_count, created_at, last_reset_at
     FROM users WHERE email=$1 LIMIT 1`,
    [email.toLowerCase()]
  );
  if (!r || r.rows.length === 0) return null;
  return mapRowToUser(r.rows[0]);
}

export async function incrementUsage(userId: string): Promise<void> {
  const key = usageKey(userId);
  await redis.incr(key);
  await redis.expire(key, secondsUntilMonthEnd());
}

export async function getRateLimitStatus(userId: string): Promise<RateLimitStatus> {
  // Pull plan + limit from DB, usage from Redis (fallback to DB value)
  const r = await pool.query(`SELECT plan, discovery_limit FROM users WHERE id=$1`, [userId]);
  const planRow = (r && (r as any).rowCount > 0) ? r.rows[0] : { plan: 'free', discovery_limit: 10 };
  const limit = Number(planRow.discovery_limit) || 10;
  const usedStr = await redis.get(usageKey(userId));
  const used = Number(usedStr || 0);
  const remaining = Math.max(0, limit - used);
  const resetsAt = monthEndIso();
  return { limit, used, remaining, resetsAt };
}

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    plan: row.plan,
    discoveryLimit: row.discovery_limit,
    discoveryCount: row.discovery_count,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    lastResetAt: row.last_reset_at?.toISOString?.() || row.last_reset_at,
  } as User;
}

function usageKey(userId: string) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}`;
  return `usage:${userId}:${ym}`;
}

function secondsUntilMonthEnd(): number {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1, 0, 0, 0));
  return Math.max(60, Math.floor((end.getTime() - now.getTime())/1000));
}

function monthEndIso(): string {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1, 0, 0, 0));
  return end.toISOString();
}
