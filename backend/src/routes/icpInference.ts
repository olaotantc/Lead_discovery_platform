import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { inferICP } from '../services/icpInference';

interface InferICPBody {
  url: string;
}

interface InferICPRequest {
  Body: InferICPBody;
}

export default async function icpInferenceRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => ({
    service: 'ICP Inference Service',
    status: 'healthy',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  // Infer ICP from company URL
  fastify.post<InferICPRequest>('/infer', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 1, maxLength: 2048 },
        },
      },
    },
  }, async (request: FastifyRequest<InferICPRequest>, reply: FastifyReply) => {
    const { url } = request.body;

    // Basic URL validation
    if (!/^https?:\/\//i.test(url) && !/^[\w.-]+\.[a-z]{2,}$/i.test(url)) {
      reply.status(400).send({ success: false, error: 'Invalid URL format' });
      return;
    }

    try {
      const icp = await inferICP(url);
      reply.send({ success: true, data: icp });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'ICP inference failed',
      });
    }
  });
}
