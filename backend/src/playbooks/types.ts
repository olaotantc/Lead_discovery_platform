export type SourceType =
  | 'CareerPage'
  | 'JobBoard'
  | 'Website'
  | 'Directory'
  | 'Social'
  | 'Unknown';

export interface Source {
  type: SourceType;
  url?: string;
  notes?: string;
}

export interface Signal {
  category: 'hiring' | 'profile';
  name: string;
  value: string;
  confidence: number; // 0-100
  source: Source;
  evidence?: string[];
}

export interface PlaybookInput {
  url: string;
  brief?: string;
}

export interface PlaybookResult {
  playbookId: string;
  name: string;
  signals: Signal[];
  sources: Source[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface Playbook {
  id: string;
  name: string;
  run(input: PlaybookInput): Promise<PlaybookResult>;
}

export function extractDomain(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    return u.hostname.toLowerCase();
  } catch {
    return inputUrl.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

