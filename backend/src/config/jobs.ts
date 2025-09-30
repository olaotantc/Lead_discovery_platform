import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection for BullMQ
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Job queue names
export const QUEUE_NAMES = {
  DISCOVERY: 'discovery',
  EMAIL_VERIFICATION: 'email-verification',
  CONTACT_ENRICHMENT: 'contact-enrichment',
  DRAFT_GENERATION: 'draft-generation',
} as const;

// Job types
export interface DiscoveryJobData {
  url: string;
  brief: string;
  userId?: string;
  timestamp: string;
}

export interface ContactDiscoveryJobData {
  url: string;
  roles?: string[];
  threshold?: number;
  limit?: number;
  brief?: string;
  userId?: string;
  timestamp: string;
}

export interface EmailVerificationJobData {
  email: string;
  contactId: string;
  userId?: string;
}

export interface ContactEnrichmentJobData {
  contactId: string;
  companyDomain: string;
  userId?: string;
}

export interface DraftGenerationJobData {
  contactId: string;
  evidenceData: Record<string, any>;
  tone: 'direct' | 'consultative' | 'warm';
  userId?: string;
}

// Create job queues
export const discoveryQueue = new Queue(QUEUE_NAMES.DISCOVERY, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const emailVerificationQueue = new Queue(QUEUE_NAMES.EMAIL_VERIFICATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const contactEnrichmentQueue = new Queue(QUEUE_NAMES.CONTACT_ENRICHMENT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1500,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const draftGenerationQueue = new Queue(QUEUE_NAMES.DRAFT_GENERATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

// Queue health check
export const checkQueuesHealth = async (): Promise<Record<string, any>> => {
  const queues = [
    { name: QUEUE_NAMES.DISCOVERY, queue: discoveryQueue },
    { name: QUEUE_NAMES.EMAIL_VERIFICATION, queue: emailVerificationQueue },
    { name: QUEUE_NAMES.CONTACT_ENRICHMENT, queue: contactEnrichmentQueue },
    { name: QUEUE_NAMES.DRAFT_GENERATION, queue: draftGenerationQueue },
  ];

  const health: Record<string, any> = {};

  for (const { name, queue } of queues) {
    try {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      health[name] = {
        status: 'healthy',
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      health[name] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return health;
};

// Utility function to add jobs
export const addDiscoveryJob = async (data: DiscoveryJobData) => {
  return await discoveryQueue.add('process-discovery', data, {
    priority: 10,
  });
};

export const addContactDiscoveryJob = async (data: ContactDiscoveryJobData) => {
  return await discoveryQueue.add('contact-discovery', data, {
    priority: 9,
  });
};

export const addEmailVerificationJob = async (data: EmailVerificationJobData) => {
  return await emailVerificationQueue.add('verify-email', data, {
    priority: 5,
  });
};

export const addContactEnrichmentJob = async (data: ContactEnrichmentJobData) => {
  return await contactEnrichmentQueue.add('enrich-contact', data, {
    priority: 3,
  });
};

export const addDraftGenerationJob = async (data: DraftGenerationJobData) => {
  return await draftGenerationQueue.add('generate-draft', data, {
    priority: 1,
  });
};

// Graceful shutdown
export const closeQueues = async () => {
  await Promise.all([
    discoveryQueue.close(),
    emailVerificationQueue.close(),
    contactEnrichmentQueue.close(),
    draftGenerationQueue.close(),
  ]);

  await redisConnection.quit();
  console.log('✅ All job queues closed gracefully');
};
