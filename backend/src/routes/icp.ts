/**
 * ICP (Ideal Customer Profile) API routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IcpValidationService, ValidationRateLimit } from '../services/validation';

// Request types
interface IcpInputRequest {
  Body: {
    url: string;
    brief: string;
  };
}

interface IcpValidateRequest {
  Body: {
    url: string;
    brief: string;
  };
}

/**
 * ICP routes plugin
 */
export default async function icpRoutes(fastify: FastifyInstance) {
  // Rate limiting middleware
  fastify.addHook('preValidation', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientIp = request.ip;

    if (!ValidationRateLimit.canProceed(clientIp)) {
      const remaining = ValidationRateLimit.getRemainingAttempts(clientIp);
      reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        remaining,
        resetTime: new Date(Date.now() + 60000).toISOString()
      });
      return;
    }

    ValidationRateLimit.recordAttempt(clientIp);
  });

  /**
   * POST /api/icp/validate
   * Validate ICP inputs without generating preview
   */
  fastify.post<IcpValidateRequest>('/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['url', 'brief'],
        properties: {
          url: {
            type: 'string',
            minLength: 1,
            maxLength: 2048,
            format: 'uri'
          },
          brief: {
            type: 'string',
            minLength: 10,
            maxLength: 1000
          }
        }
      }
    }
  }, async (request: FastifyRequest<IcpValidateRequest>, reply: FastifyReply) => {
    try {
      const { url, brief } = request.body;

      // Validate inputs
      const validationResult = IcpValidationService.validateIcpInputs(url, brief);

      if (!validationResult.isValid) {
        reply.status(400).send({
          success: false,
          errors: validationResult.errors
        });
        return;
      }

      // Additional business context validation
      const businessValidation = IcpValidationService.validateBusinessContext(url, brief);

      reply.send({
        success: true,
        data: {
          isValid: true,
          sanitizedInputs: businessValidation.sanitizedData,
          metadata: businessValidation.sanitizedData?.metadata
        }
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error during validation'
      });
    }
  });

  /**
   * POST /api/icp/preview
   * Generate ICP preview from validated inputs
   */
  fastify.post<IcpInputRequest>('/preview', {
    schema: {
      body: {
        type: 'object',
        required: ['url', 'brief'],
        properties: {
          url: {
            type: 'string',
            minLength: 1,
            maxLength: 2048
          },
          brief: {
            type: 'string',
            minLength: 10,
            maxLength: 1000
          }
        }
      }
    }
  }, async (request: FastifyRequest<IcpInputRequest>, reply: FastifyReply) => {
    try {
      const { url, brief } = request.body;

      // First validate inputs
      const validationResult = IcpValidationService.validateBusinessContext(url, brief);

      if (!validationResult.isValid) {
        reply.status(400).send({
          success: false,
          errors: validationResult.errors
        });
        return;
      }

      const { sanitizedData } = validationResult;

      // TODO: Implement actual ICP generation logic
      // For now, return a mock ICP preview
      const mockIcpPreview = {
        businessCategory: 'Technology Services',
        companySize: '51-200 employees',
        region: 'West Coast',
        buyerRoles: ['CEO/Founder', 'VP Engineering', 'CTO'],
        keywords: ['SaaS', 'B2B', 'Enterprise Software'],
        confidence: 'High',
        sources: [
          {
            type: 'Website Analysis',
            url: sanitizedData!.url,
            extractedData: ['Company size indicators', 'Technology stack', 'Contact information']
          }
        ],
        metadata: sanitizedData!.metadata
      };

      reply.send({
        success: true,
        data: {
          inputs: {
            url: sanitizedData!.url,
            brief: sanitizedData!.brief
          },
          preview: mockIcpPreview,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        success: false,
        error: 'Internal server error during ICP generation'
      });
    }
  });

  /**
   * GET /api/icp/health
   * Health check for ICP service
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      service: 'ICP Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}