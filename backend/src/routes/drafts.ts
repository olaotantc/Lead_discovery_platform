import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { addDraftGenerationJob } from '../config/jobs';
import { getDraftJob, startDraftJob, getDraftsFromDatabase, getDraftById } from '../services/drafts';

interface GenerateDraftBody {
  contactId: string; // may be email if no persisted id exists
  email: string;
  name?: string;
  tone?: 'direct' | 'consultative' | 'warm';
  evidenceData?: Record<string, unknown>;
}

interface GenerateDraftRequest { Body: GenerateDraftBody }

export default async function draftsRoutes(fastify: FastifyInstance) {
  // Generate a draft for a single contact
  fastify.post<GenerateDraftRequest>('/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['contactId', 'email'],
        properties: {
          contactId: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 3 },
          name: { type: 'string' },
          tone: { type: 'string', enum: ['direct', 'consultative', 'warm'] },
          evidenceData: { type: 'object' },
        },
      },
    },
  }, async (request: FastifyRequest<GenerateDraftRequest>, reply: FastifyReply) => {
    const { contactId, email, name, tone = 'direct', evidenceData = {} } = request.body;

    const job = await addDraftGenerationJob({
      contactId,
      evidenceData: { ...evidenceData, email, name },
      tone,
      userId: 'anon',
    });

    await startDraftJob(job.id as string, { contactId, email, name, tone, evidenceData });
    reply.send({ success: true, jobId: job.id });
  });

  // Fetch draft job result
  fastify.get<{ Params: { jobId: string } }>('/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const res = await getDraftJob(jobId);
    if (!res) {
      reply.status(404).send({ success: false, error: 'Job not found' });
      return;
    }
    reply.send({ success: true, data: res });
  });

  // Get all drafts with filters
  fastify.get('/list/all', async (request, reply) => {
    const { contactId, email, domain, limit, offset } = request.query as any;

    try {
      const drafts = await getDraftsFromDatabase({
        contactId,
        email,
        domain,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });

      reply.send({ success: true, data: drafts, total: drafts.length });
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message || 'Failed to fetch drafts' });
    }
  });

  // Get single draft by database ID
  fastify.get<{ Params: { id: string } }>('/db/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const draft = await getDraftById(id);
      if (!draft) {
        reply.status(404).send({ success: false, error: 'Draft not found' });
        return;
      }

      reply.send({ success: true, data: draft });
    } catch (error: any) {
      reply.status(500).send({ success: false, error: error.message || 'Failed to fetch draft' });
    }
  });
}
