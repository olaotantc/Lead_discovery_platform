import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  QUEUE_NAMES,
  DiscoveryJobData,
  EmailVerificationJobData,
  ContactEnrichmentJobData,
  DraftGenerationJobData,
  ContactDiscoveryJobData,
} from '../config/jobs';
import { completeDraftJob, failDraftJob, generateDraftsPackage } from '../services/drafts';
import { DraftJobPayload } from '../types/draft';
import { completeContactDiscovery, failContactDiscovery, processContactDiscoveryJob, startContactDiscovery } from '../services/contactDiscovery';

// Redis connection for workers
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Discovery job processor
const processDiscoveryJob = async (job: Job<DiscoveryJobData | ContactDiscoveryJobData>) => {
  // Branch on job name
  if (job.name === 'contact-discovery') {
    const data = job.data as ContactDiscoveryJobData;
    console.log(`👥 Contact discovery job ${job.id} for ${data.url}`);
    try {
      await startContactDiscovery(job.id as string, { url: data.url, roles: data.roles, threshold: data.threshold, limit: data.limit, brief: data.brief });
      const contacts = await processContactDiscoveryJob(job.id as string, { url: data.url, roles: data.roles, threshold: data.threshold, limit: data.limit, brief: data.brief });
      await completeContactDiscovery(job.id as string, contacts);
      console.log(`✅ Contact discovery job ${job.id} completed with ${contacts.length} contacts`);
      return { jobId: job.id, contacts: contacts.length };
    } catch (err: any) {
      console.error(`❌ Contact discovery job ${job.id} failed:`, err?.message || err);
      await failContactDiscovery(job.id as string, err?.message || 'Unknown error');
      throw err;
    }
  }

  const { url, brief, userId, timestamp } = job.data as DiscoveryJobData;

  console.log(`🔍 Processing discovery job for URL: ${url}`);

  // Simulate discovery processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock discovery results
  const result = {
    jobId: job.id,
    url,
    brief,
    accountsFound: Math.floor(Math.random() * 10) + 5,
    contactsDiscovered: Math.floor(Math.random() * 25) + 10,
    processingTime: Date.now() - new Date(timestamp).getTime(),
    status: 'completed',
  };

  console.log(`✅ Discovery job ${job.id} completed: ${result.accountsFound} accounts, ${result.contactsDiscovered} contacts`);

  return result;
};

// Email verification job processor
const processEmailVerificationJob = async (job: Job<EmailVerificationJobData>) => {
  const { email, contactId, userId } = job.data;

  console.log(`📧 Verifying email: ${email}`);

  // Simulate email verification
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock verification result
  const isValid = Math.random() > 0.3; // 70% success rate
  const confidence = isValid ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 50) + 20;

  const result = {
    jobId: job.id,
    email,
    contactId,
    isValid,
    confidence,
    status: 'completed',
  };

  console.log(`✅ Email verification ${job.id} completed: ${email} (${isValid ? 'valid' : 'invalid'}, ${confidence}% confidence)`);

  return result;
};

// Contact enrichment job processor
const processContactEnrichmentJob = async (job: Job<ContactEnrichmentJobData>) => {
  const { contactId, companyDomain, userId } = job.data;

  console.log(`🔍 Enriching contact: ${contactId} from ${companyDomain}`);

  // Simulate contact enrichment
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock enrichment data
  const result = {
    jobId: job.id,
    contactId,
    companyDomain,
    enrichedData: {
      linkedinProfile: Math.random() > 0.5 ? `https://linkedin.com/in/contact-${contactId}` : null,
      title: ['CEO', 'CTO', 'VP Sales', 'Marketing Director'][Math.floor(Math.random() * 4)],
      department: ['Sales', 'Marketing', 'Engineering', 'Operations'][Math.floor(Math.random() * 4)],
      seniority: ['Executive', 'Senior', 'Mid-level', 'Junior'][Math.floor(Math.random() * 4)],
    },
    status: 'completed',
  };

  console.log(`✅ Contact enrichment ${job.id} completed for ${contactId}`);

  return result;
};

// Draft generation job processor
const processDraftGenerationJob = async (job: Job<DraftGenerationJobData>) => {
  const { contactId, evidenceData, tone, userId } = job.data;

  console.log(`✍️ Generating draft for contact: ${contactId} (${tone} tone)`);

  // Generate drafts package with citations + headers
  const pkg = generateDraftsPackage({
    contactId,
    email: (evidenceData as any)?.email || 'unknown@example.com',
    name: (evidenceData as any)?.name as string | undefined,
    tone: (tone as any) || 'direct',
    evidenceData,
  });

  console.log(`✅ Draft generation ${job.id} completed for ${contactId}`);

  try {
    const payload: DraftJobPayload = {
      jobId: job.id as string,
      contactId,
      email: (evidenceData as any)?.email || 'unknown@example.com',
      tone: (tone as any) || 'direct',
      drafts: pkg.content,
      citations: pkg.citations,
      emailHeaders: pkg.emailHeaders,
      status: 'completed',
      generatedAt: new Date().toISOString(),
    };
    await completeDraftJob(job.id as string, payload);
  } catch (e) {
    console.error('Failed to persist draft job result', e);
  }
  return { jobId: job.id, contactId, status: 'completed' };
};

// Create workers
export const discoveryWorker = new Worker(
  QUEUE_NAMES.DISCOVERY,
  processDiscoveryJob,
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

export const emailVerificationWorker = new Worker(
  QUEUE_NAMES.EMAIL_VERIFICATION,
  processEmailVerificationJob,
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

export const contactEnrichmentWorker = new Worker(
  QUEUE_NAMES.CONTACT_ENRICHMENT,
  processContactEnrichmentJob,
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

export const draftGenerationWorker = new Worker(
  QUEUE_NAMES.DRAFT_GENERATION,
  processDraftGenerationJob,
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

// Worker event handlers
const setupWorkerEvents = (worker: Worker, workerName: string) => {
  worker.on('completed', (job) => {
    console.log(`✅ ${workerName} job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ ${workerName} job ${job?.id} failed:`, err.message);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`⚠️ ${workerName} job ${jobId} stalled`);
  });
};

// Setup events for all workers
setupWorkerEvents(discoveryWorker, 'Discovery');
setupWorkerEvents(emailVerificationWorker, 'EmailVerification');
setupWorkerEvents(contactEnrichmentWorker, 'ContactEnrichment');
setupWorkerEvents(draftGenerationWorker, 'DraftGeneration');

// Graceful shutdown
export const closeWorkers = async () => {
  await Promise.all([
    discoveryWorker.close(),
    emailVerificationWorker.close(),
    contactEnrichmentWorker.close(),
    draftGenerationWorker.close(),
  ]);

  await redisConnection.quit();
  console.log('✅ All workers closed gracefully');
};

console.log('🚀 Job workers initialized');
