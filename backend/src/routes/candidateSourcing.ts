import { FastifyPluginAsync } from 'fastify';
import { sourceCandidates } from '../services/candidateSourcing';
import { ICPData } from '../services/icpInference';

const candidateSourcingRoutes: FastifyPluginAsync = async (server) => {
  // Health check
  server.get('/health', async (request, reply) => {
    return {
      service: 'Candidate Sourcing Service',
      status: 'healthy',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Search for candidate companies based on ICP
  server.post<{
    Body: {
      icp: ICPData;
      limit?: number;
    };
  }>('/search', async (request, reply) => {
    try {
      const { icp, limit } = request.body;

      // Validate ICP data
      if (!icp || !icp.businessCategory) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid ICP data: businessCategory is required',
        });
      }

      console.log(`[Candidate Sourcing] Starting search for ICP: ${icp.businessCategory}, limit: ${limit || 'none'}`);

      // Source candidates with limit for performance
      const result = await sourceCandidates(icp, limit);

      // Results are already limited by service
      const fullTotalFound = result.totalFound;
      const candidates = result.candidates;

      console.log(`[Candidate Sourcing] Found ${fullTotalFound} candidates, returning ${candidates.length} in ${result.durationMs}ms`);

      return {
        success: true,
        data: {
          ...result,
          candidates,
          totalFound: fullTotalFound, // Keep original total for "show more" UI
          returnedCount: candidates.length,
        },
      };
    } catch (error: any) {
      console.error('[Candidate Sourcing] Error:', error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to source candidates',
      });
    }
  });
};

export default candidateSourcingRoutes;
