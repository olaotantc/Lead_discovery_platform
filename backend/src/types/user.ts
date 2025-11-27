export type Plan = 'free' | 'starter' | 'pro' | 'team';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  plan: Plan;
  discoveryLimit: number;
  discoveryCount: number;
  createdAt: string;
  lastResetAt: string;
  oauthProvider?: string | null;
  oauthId?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface AuthToken {
  userId: string;
  email: string;
  plan: Plan | string;
  exp: number; // epoch seconds
}

export interface RateLimitStatus {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

