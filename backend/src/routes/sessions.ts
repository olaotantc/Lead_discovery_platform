import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createPostgresPool } from '../config/database';
import crypto from 'crypto';

const pool = createPostgresPool();

// Types
interface DiscoverySession {
  id: string;
  user_id?: string;
  session_key?: string;
  current_step: number;
  url?: string;
  brief?: string;
  icp_data?: any;
  companies?: any[];
  selected_companies?: string[];
  contacts?: any[];
  selected_contacts?: string[];
  confidence_threshold?: number;
  drafts?: Record<string, any>;
  draft_tone?: string;
  is_demo?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateSessionBody {
  url?: string;
  brief?: string;
  isDemo?: boolean;
}

interface UpdateSessionBody {
  current_step?: number;
  url?: string;
  brief?: string;
  icp_data?: any;
  companies?: any[];
  selected_companies?: string[];
  contacts?: any[];
  selected_contacts?: string[];
  confidence_threshold?: number;
  drafts?: Record<string, any>;
  draft_tone?: string;
  status?: string;
}

// Generate session key for anonymous users
function generateSessionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Extract user ID from JWT token if available
async function getUserIdFromRequest(request: FastifyRequest): Promise<string | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    // Decode JWT (we're not verifying here, just extracting)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.userId || null;
  } catch {
    return null;
  }
}

export default async function sessionsRoutes(fastify: FastifyInstance) {
  // Create a new discovery session
  fastify.post<{ Body: CreateSessionBody }>('/', async (request, reply) => {
    const { url, brief, isDemo } = request.body || {};
    const userId = await getUserIdFromRequest(request);
    const sessionKey = userId ? null : generateSessionKey();

    try {
      const result = await pool.query(
        `INSERT INTO discovery_sessions (user_id, session_key, url, brief, is_demo, current_step)
         VALUES ($1, $2, $3, $4, $5, 1)
         RETURNING *`,
        [userId, sessionKey, url || null, brief || null, isDemo || false]
      );

      const session = result.rows[0];

      reply.send({
        success: true,
        data: {
          ...session,
          sessionKey: sessionKey, // Return session key for anonymous users to store
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to create discovery session');
      reply.status(500).send({ success: false, error: 'Failed to create session' });
    }
  });

  // Get session by ID or session key
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const userId = await getUserIdFromRequest(request);
    const sessionKey = request.headers['x-session-key'] as string;

    try {
      let result;

      // Try to find by UUID first
      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        result = await pool.query(
          `SELECT * FROM discovery_sessions
           WHERE id = $1 AND (user_id = $2 OR session_key = $3 OR user_id IS NULL)`,
          [id, userId, sessionKey]
        );
      } else {
        // Try to find by session key
        result = await pool.query(
          `SELECT * FROM discovery_sessions WHERE session_key = $1`,
          [id]
        );
      }

      if (result.rows.length === 0) {
        reply.status(404).send({ success: false, error: 'Session not found' });
        return;
      }

      reply.send({ success: true, data: result.rows[0] });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch discovery session');
      reply.status(500).send({ success: false, error: 'Failed to fetch session' });
    }
  });

  // Update session
  fastify.patch<{ Params: { id: string }; Body: UpdateSessionBody }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const userId = await getUserIdFromRequest(request);
    const sessionKey = request.headers['x-session-key'] as string;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.current_step !== undefined) {
      updateFields.push(`current_step = $${paramIndex++}`);
      values.push(updates.current_step);
    }
    if (updates.url !== undefined) {
      updateFields.push(`url = $${paramIndex++}`);
      values.push(updates.url);
    }
    if (updates.brief !== undefined) {
      updateFields.push(`brief = $${paramIndex++}`);
      values.push(updates.brief);
    }
    if (updates.icp_data !== undefined) {
      updateFields.push(`icp_data = $${paramIndex++}`);
      values.push(JSON.stringify(updates.icp_data));
    }
    if (updates.companies !== undefined) {
      updateFields.push(`companies = $${paramIndex++}`);
      values.push(JSON.stringify(updates.companies));
    }
    if (updates.selected_companies !== undefined) {
      updateFields.push(`selected_companies = $${paramIndex++}`);
      values.push(updates.selected_companies);
    }
    if (updates.contacts !== undefined) {
      updateFields.push(`contacts = $${paramIndex++}`);
      values.push(JSON.stringify(updates.contacts));
    }
    if (updates.selected_contacts !== undefined) {
      updateFields.push(`selected_contacts = $${paramIndex++}`);
      values.push(updates.selected_contacts);
    }
    if (updates.confidence_threshold !== undefined) {
      updateFields.push(`confidence_threshold = $${paramIndex++}`);
      values.push(updates.confidence_threshold);
    }
    if (updates.drafts !== undefined) {
      updateFields.push(`drafts = $${paramIndex++}`);
      values.push(JSON.stringify(updates.drafts));
    }
    if (updates.draft_tone !== undefined) {
      updateFields.push(`draft_tone = $${paramIndex++}`);
      values.push(updates.draft_tone);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
      if (updates.status === 'completed') {
        updateFields.push(`completed_at = NOW()`);
      }
    }

    if (updateFields.length === 0) {
      reply.status(400).send({ success: false, error: 'No fields to update' });
      return;
    }

    try {
      const idParam = paramIndex++;
      const userIdParam = paramIndex++;
      const sessionKeyParam = paramIndex++;

      // Try UUID first, then session key
      let query: string;
      let queryValues: any[];

      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = `UPDATE discovery_sessions
                 SET ${updateFields.join(', ')}
                 WHERE id = $${idParam} AND (user_id = $${userIdParam} OR session_key = $${sessionKeyParam} OR user_id IS NULL)
                 RETURNING *`;
        queryValues = [...values, id, userId, sessionKey];
      } else {
        query = `UPDATE discovery_sessions
                 SET ${updateFields.join(', ')}
                 WHERE session_key = $${idParam}
                 RETURNING *`;
        queryValues = [...values, id];
      }

      const result = await pool.query(query, queryValues);

      if (result.rows.length === 0) {
        reply.status(404).send({ success: false, error: 'Session not found or access denied' });
        return;
      }

      reply.send({ success: true, data: result.rows[0] });
    } catch (error) {
      fastify.log.error(error, 'Failed to update discovery session');
      reply.status(500).send({ success: false, error: 'Failed to update session' });
    }
  });

  // List sessions for current user
  fastify.get('/', async (request, reply) => {
    const userId = await getUserIdFromRequest(request);
    const sessionKey = request.headers['x-session-key'] as string;

    try {
      let result;

      if (userId) {
        result = await pool.query(
          `SELECT id, current_step, url, status, is_demo, created_at, updated_at
           FROM discovery_sessions
           WHERE user_id = $1
           ORDER BY updated_at DESC
           LIMIT 20`,
          [userId]
        );
      } else if (sessionKey) {
        result = await pool.query(
          `SELECT id, current_step, url, status, is_demo, created_at, updated_at
           FROM discovery_sessions
           WHERE session_key = $1
           ORDER BY updated_at DESC
           LIMIT 5`,
          [sessionKey]
        );
      } else {
        reply.status(401).send({ success: false, error: 'Authentication required' });
        return;
      }

      reply.send({ success: true, data: result.rows });
    } catch (error) {
      fastify.log.error(error, 'Failed to list discovery sessions');
      reply.status(500).send({ success: false, error: 'Failed to list sessions' });
    }
  });

  // Delete session
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const userId = await getUserIdFromRequest(request);
    const sessionKey = request.headers['x-session-key'] as string;

    try {
      let result;

      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        result = await pool.query(
          `DELETE FROM discovery_sessions
           WHERE id = $1 AND (user_id = $2 OR session_key = $3 OR user_id IS NULL)
           RETURNING id`,
          [id, userId, sessionKey]
        );
      } else {
        result = await pool.query(
          `DELETE FROM discovery_sessions WHERE session_key = $1 RETURNING id`,
          [id]
        );
      }

      if (result.rows.length === 0) {
        reply.status(404).send({ success: false, error: 'Session not found' });
        return;
      }

      reply.send({ success: true, message: 'Session deleted' });
    } catch (error) {
      fastify.log.error(error, 'Failed to delete discovery session');
      reply.status(500).send({ success: false, error: 'Failed to delete session' });
    }
  });

  // Get latest session or resume
  fastify.get('/latest', async (request, reply) => {
    const userId = await getUserIdFromRequest(request);
    const sessionKey = request.headers['x-session-key'] as string;

    try {
      let result;

      if (userId) {
        result = await pool.query(
          `SELECT * FROM discovery_sessions
           WHERE user_id = $1 AND status = 'in_progress'
           ORDER BY updated_at DESC
           LIMIT 1`,
          [userId]
        );
      } else if (sessionKey) {
        result = await pool.query(
          `SELECT * FROM discovery_sessions
           WHERE session_key = $1 AND status = 'in_progress'
           ORDER BY updated_at DESC
           LIMIT 1`,
          [sessionKey]
        );
      } else {
        reply.send({ success: true, data: null });
        return;
      }

      reply.send({ success: true, data: result.rows[0] || null });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch latest session');
      reply.status(500).send({ success: false, error: 'Failed to fetch latest session' });
    }
  });
}
