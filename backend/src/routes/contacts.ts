import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { addContactDiscoveryJob } from '../config/jobs';
import { getContactDiscovery, updateThreshold, startContactDiscovery } from '../services/contactDiscovery';
import { verifyEmails } from '../services/emailVerification';
import { DiscoveryRequest } from '../types/contact';

interface DiscoverBody extends DiscoveryRequest {}
interface DiscoverRequest {
  Body: DiscoverBody;
}

interface VerifyBody {
  emails: string[];
}
interface VerifyRequest { Body: VerifyBody }

interface ThresholdBody { threshold: number }
interface ThresholdRequest { Params: { id: string }, Body: ThresholdBody }

function sanitizeUrlOrDomain(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export default async function contactRoutes(fastify: FastifyInstance) {
  console.log('✅ Contact routes registered at /api/contacts');

  // Start contact discovery
  fastify.post<DiscoverRequest>('/discover', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 2048 },
          roles: { type: 'array', items: { type: 'string' } },
          threshold: { type: 'number', minimum: 70, maximum: 95 },
          limit: { type: 'number', minimum: 1, maximum: 200 },
          brief: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<DiscoverRequest>, reply: FastifyReply) => {
    console.log('📨 POST /api/contacts/discover received:', request.body);
    const { url, roles, threshold, limit, brief } = request.body;
    const safeUrl = sanitizeUrlOrDomain(url);
    try {
      const job = await addContactDiscoveryJob({
        url: safeUrl,
        roles,
        threshold,
        limit,
        brief,
        timestamp: new Date().toISOString(),
      });
      // Eagerly create a pending record so clients can poll immediately even if workers are not running
      try {
        await startContactDiscovery(job.id as string, { url: safeUrl, roles, threshold, limit, brief });
      } catch (preErr) {
        request.log.warn({ preErr, jobId: job.id }, 'contacts.discover could not seed pending record');
      }
      request.log.info({ jobId: job.id, safeUrl }, 'contacts.discover enqueued');
      reply.send({ success: true, jobId: job.id });
    } catch (err: any) {
      // Fallback: inline processing + in-memory/redis store
      try {
        const { startContactDiscovery, processContactDiscoveryJob, completeContactDiscovery } = await import('../services/contactDiscovery');
        const jobId = `inline-${Date.now()}`;
        await startContactDiscovery(jobId, { url: safeUrl, roles, threshold, limit, brief });
        const contacts = await processContactDiscoveryJob(jobId, { url: safeUrl, roles, threshold, limit, brief });
        await completeContactDiscovery(jobId, contacts);
        request.log.warn({ jobId, err }, 'contacts.discover queued failed; served via inline fallback');
        reply.send({ success: true, jobId });
      } catch (inner: any) {
        request.log.error({ err, inner }, 'contacts.discover failed (no queue, inline fallback failed)');
        reply.status(500).send({ success: false, error: 'Contact discovery unavailable (queue and fallback failed)' });
      }
    }
  });

  // Get discovery results by jobId
  fastify.get<{ Params: { jobId: string } }>('/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const res = await getContactDiscovery(jobId);
    request.log.info({ jobId, found: !!res }, 'contacts.status');
    if (!res) {
      // Gracefully return pending status instead of 404 to tolerate race conditions
      reply.send({ success: true, data: { jobId, status: 'pending' } });
      return;
    }
    reply.send({ success: true, data: res });
  });

  // Verify specific emails
  fastify.post<VerifyRequest>('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['emails'],
        properties: {
          emails: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const { emails } = request.body;
    const results = await verifyEmails(emails);
    reply.send({ success: true, data: results });
  });

  // Update confidence threshold
  fastify.patch<ThresholdRequest>('/:id/confidence', {
    schema: {
      body: {
        type: 'object',
        required: ['threshold'],
        properties: { threshold: { type: 'number', minimum: 70, maximum: 95 } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { threshold } = request.body;
    const updated = await updateThreshold(id, threshold);
    if (!updated) {
      reply.status(404).send({ success: false, error: 'Job not found' });
      return;
    }
    reply.send({ success: true, data: updated });
  });
}
