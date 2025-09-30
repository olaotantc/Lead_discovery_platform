import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { runDiscovery } from '../services/discovery';

interface DiscoveryRunBody {
  url: string;
  brief?: string;
  icp?: {
    businessCategory?: string;
    companySize?: string;
    targetMarket?: string;
  };
}

interface DiscoveryRunRequest {
  Body: DiscoveryRunBody;
}

export default async function discoveryRoutes(fastify: FastifyInstance) {
  // Simple health endpoint
  fastify.get('/health', async () => ({
    service: 'Discovery Service',
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  // Run discovery (offline heuristics)
  fastify.post<DiscoveryRunRequest>('/run', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 2048 },
          brief: { type: 'string', minLength: 0, maxLength: 1000 },
          icp: {
            type: 'object',
            properties: {
              businessCategory: { type: 'string' },
              companySize: { type: 'string' },
              targetMarket: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<DiscoveryRunRequest>, reply: FastifyReply) => {
    const { url, brief, icp } = request.body;

    // Basic guardrails (server-side) without importing the full validation service
    if (!/^https?:\/\//i.test(url) && !/^[\w.-]+\.[a-z]{2,}$/i.test(url)) {
      reply.status(400).send({ success: false, error: 'Invalid URL format' });
      return;
    }
    if (brief && brief.length > 1000) {
      reply.status(400).send({ success: false, error: 'Brief too long' });
      return;
    }

    const result = await runDiscovery({ url, brief, icp });
    reply.send({ success: true, data: result });
  });
}

