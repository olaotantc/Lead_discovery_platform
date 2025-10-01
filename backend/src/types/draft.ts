export type DraftTone = 'direct' | 'consultative' | 'warm';

export interface DraftEvidence {
  id: number;
  url: string;
  title: string;
  snippet?: string;
}

export interface DraftEmailContent {
  opener: string;
  followUp1: string;
  followUp2: string;
}

export interface DraftEmailPackage {
  content: DraftEmailContent;
  citations: DraftEvidence[];
  emailHeaders: Record<string, string>;
}

export interface DraftJobPayload {
  jobId: string;
  contactId: string;
  email: string;
  tone: DraftTone;
  drafts: DraftEmailContent;
  citations: DraftEvidence[];
  emailHeaders: Record<string, string>;
  status: 'completed' | 'failed';
  error?: string;
  generatedAt: string;
  draftId?: string; // Database ID for permanent storage
}

