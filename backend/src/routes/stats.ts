import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pool } from '../config/database';
import { verifyJWT } from '../services/auth';

interface DashboardStats {
  icpCount: number;
  discoveryRuns: number;
  totalCompaniesFound: number;
  totalContactsFound: number;
  averageScore: number;
  recentActivity: Array<{
    type: 'icp' | 'discovery' | 'contact';
    description: string;
    timestamp: string;
  }>;
}

export default async function statsRoutes(fastify: FastifyInstance) {
  // Get dashboard stats for authenticated user
  fastify.get('/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    // Optional auth - stats work for both logged-in and anonymous users
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : undefined;
    let userId: string | null = null;

    if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    try {
      let stats: DashboardStats = {
        icpCount: 0,
        discoveryRuns: 0,
        totalCompaniesFound: 0,
        totalContactsFound: 0,
        averageScore: 0,
        recentActivity: [],
      };

      // Get ICP count
      if (userId) {
        const icpResult = await pool.query(
          'SELECT COUNT(*) as count FROM icps WHERE user_id = $1',
          [userId]
        );
        stats.icpCount = parseInt(icpResult.rows[0]?.count || '0', 10);
      } else {
        // For anonymous, count all ICPs
        const icpResult = await pool.query('SELECT COUNT(*) as count FROM icps');
        stats.icpCount = parseInt(icpResult.rows[0]?.count || '0', 10);
      }

      // Get discovery run count and stats
      let discoveryQuery = `
        SELECT
          COUNT(*) as run_count,
          COALESCE(SUM(company_count), 0) as total_companies,
          COALESCE(AVG(average_score), 0) as avg_score
        FROM discovery_runs
      `;
      let discoveryParams: string[] = [];

      if (userId) {
        discoveryQuery += ' WHERE user_id = $1';
        discoveryParams = [userId];
      }

      const discoveryResult = await pool.query(discoveryQuery, discoveryParams);
      const discoveryRow = discoveryResult.rows[0];
      stats.discoveryRuns = parseInt(discoveryRow?.run_count || '0', 10);
      stats.totalCompaniesFound = parseInt(discoveryRow?.total_companies || '0', 10);
      stats.averageScore = parseFloat(discoveryRow?.avg_score || '0');

      // Get contact count from drafts (as a proxy since we persist drafts)
      let draftQuery = 'SELECT COUNT(DISTINCT contact_id) as count FROM drafts';
      let draftParams: string[] = [];

      if (userId) {
        draftQuery += ' WHERE user_id = $1';
        draftParams = [userId];
      }

      const draftResult = await pool.query(draftQuery, draftParams);
      stats.totalContactsFound = parseInt(draftResult.rows[0]?.count || '0', 10);

      // Get recent activity
      const recentIcps = await pool.query(
        `SELECT id, url, brief, created_at FROM icps
         ${userId ? 'WHERE user_id = $1' : ''}
         ORDER BY created_at DESC LIMIT 3`,
        userId ? [userId] : []
      );

      const recentDiscoveries = await pool.query(
        `SELECT id, icp_id, company_count, created_at FROM discovery_runs
         ${userId ? 'WHERE user_id = $1' : ''}
         ORDER BY created_at DESC LIMIT 3`,
        userId ? [userId] : []
      );

      // Combine and sort activity
      const activities: DashboardStats['recentActivity'] = [];

      for (const row of recentIcps.rows) {
        activities.push({
          type: 'icp',
          description: `Created ICP for ${row.url}`,
          timestamp: row.created_at,
        });
      }

      for (const row of recentDiscoveries.rows) {
        activities.push({
          type: 'discovery',
          description: `Discovered ${row.company_count || 0} companies`,
          timestamp: row.created_at,
        });
      }

      stats.recentActivity = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      reply.send({ success: true, data: stats });
    } catch (error) {
      fastify.log.error(error);
      // Return empty stats on error instead of failing
      reply.send({
        success: true,
        data: {
          icpCount: 0,
          discoveryRuns: 0,
          totalCompaniesFound: 0,
          totalContactsFound: 0,
          averageScore: 0,
          recentActivity: [],
        },
      });
    }
  });

  // Get quick summary for navigation/header
  fastify.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : undefined;
    let userId: string | null = null;

    if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    try {
      const icpResult = await pool.query(
        userId
          ? 'SELECT COUNT(*) as count FROM icps WHERE user_id = $1'
          : 'SELECT COUNT(*) as count FROM icps',
        userId ? [userId] : []
      );

      const discoveryResult = await pool.query(
        userId
          ? 'SELECT COUNT(*) as count FROM discovery_runs WHERE user_id = $1'
          : 'SELECT COUNT(*) as count FROM discovery_runs',
        userId ? [userId] : []
      );

      reply.send({
        success: true,
        data: {
          icpCount: parseInt(icpResult.rows[0]?.count || '0', 10),
          discoveryCount: parseInt(discoveryResult.rows[0]?.count || '0', 10),
        },
      });
    } catch (error) {
      reply.send({
        success: true,
        data: { icpCount: 0, discoveryCount: 0 },
      });
    }
  });
}
