import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { calculateContactScore, calculateBatchScores, sortContactsByScore, ContactData, ContactScore } from '../services/scoring';

interface ScoreContactRequest {
  Body: ContactData;
}

interface BatchScoreRequest {
  Body: {
    contacts: ContactData[];
  };
}

interface GetScoreRequest {
  Params: {
    contactId: string;
  };
}

// In-memory cache for scores (in production, use Redis or database)
const scoreCache = new Map<string, ContactScore>();

export default async function scoringRoutes(fastify: FastifyInstance) {
  /**
   * POST /score
   * Calculate score for a single contact
   */
  fastify.post<ScoreContactRequest>('/score', {
    schema: {
      body: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string' },
          company: { type: 'string' },
          domain: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          verificationStatus: { type: 'string', enum: ['verified', 'pending', 'invalid'] },
          discoveredAt: { type: 'string' },
          icpIndustry: { type: 'string' },
          icpCompanySize: { type: 'string' },
          icpKeywords: { type: 'array', items: { type: 'string' } },
          recentActivity: { type: 'boolean' },
          engagement: { type: 'number', minimum: 0, maximum: 1 },
          metadata: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                contactId: { type: 'string' },
                totalScore: { type: 'number' },
                facets: { type: 'object' },
                calculatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ScoreContactRequest>, reply: FastifyReply) => {
    try {
      fastify.log.info({ contactId: request.body.id }, 'Calculating contact score');

      const score = calculateContactScore(request.body);

      // Cache the score
      scoreCache.set(score.contactId, score);

      return reply.send({
        success: true,
        data: score,
      });
    } catch (error: any) {
      fastify.log.error({ error, contactId: request.body.id }, 'Failed to calculate score');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to calculate score',
      });
    }
  });

  /**
   * POST /score/batch
   * Calculate scores for multiple contacts
   */
  fastify.post<BatchScoreRequest>('/score/batch', {
    schema: {
      body: {
        type: 'object',
        required: ['contacts'],
        properties: {
          contacts: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'email'],
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                company: { type: 'string' },
                confidence: { type: 'number' },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                scores: { type: 'array' },
                sorted: { type: 'array' },
                stats: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    averageScore: { type: 'number' },
                    highScoreCount: { type: 'number' },
                    mediumScoreCount: { type: 'number' },
                    lowScoreCount: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<BatchScoreRequest>, reply: FastifyReply) => {
    try {
      const { contacts } = request.body;
      fastify.log.info({ count: contacts.length }, 'Calculating batch scores');

      const scores = calculateBatchScores(contacts);
      const sorted = sortContactsByScore(scores);

      // Cache all scores
      scores.forEach(score => {
        scoreCache.set(score.contactId, score);
      });

      // Calculate stats
      const totalScore = scores.reduce((sum, s) => sum + s.totalScore, 0);
      const averageScore = Math.round(totalScore / scores.length);
      const highScoreCount = scores.filter(s => s.totalScore >= 70).length;
      const mediumScoreCount = scores.filter(s => s.totalScore >= 40 && s.totalScore < 70).length;
      const lowScoreCount = scores.filter(s => s.totalScore < 40).length;

      return reply.send({
        success: true,
        data: {
          scores,
          sorted,
          stats: {
            total: scores.length,
            averageScore,
            highScoreCount,
            mediumScoreCount,
            lowScoreCount,
          },
        },
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to calculate batch scores');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to calculate batch scores',
      });
    }
  });

  /**
   * GET /score/:contactId
   * Retrieve cached score for a contact
   */
  fastify.get<GetScoreRequest>('/score/:contactId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetScoreRequest>, reply: FastifyReply) => {
    const { contactId } = request.params;

    const score = scoreCache.get(contactId);

    if (!score) {
      return reply.status(404).send({
        success: false,
        error: 'Score not found for this contact',
      });
    }

    return reply.send({
      success: true,
      data: score,
    });
  });

  /**
   * DELETE /score/:contactId
   * Clear cached score for a contact
   */
  fastify.delete<GetScoreRequest>('/score/:contactId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<GetScoreRequest>, reply: FastifyReply) => {
    const { contactId } = request.params;
    const deleted = scoreCache.delete(contactId);

    return reply.send({
      success: true,
      deleted,
    });
  });
}