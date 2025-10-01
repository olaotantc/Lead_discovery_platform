import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '../middleware/auth';
import {
  saveAccount,
  saveAccountsBulk,
  listAccounts,
  getAccountById,
  updateAccountStatus,
  deleteAccount,
  SaveAccountInput,
} from '../services/accounts';

interface SaveAccountBody extends SaveAccountInput {}

interface ListAccountsQuery {
  status?: string;
  limit?: string;
  offset?: string;
  sortBy?: 'discovered_at' | 'score' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export default async function accountsRoutes(fastify: FastifyInstance) {
  // Save a single account
  fastify.post<{ Body: SaveAccountBody }>('/save', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'domain', 'source'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          domain: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          industry: { type: 'string' },
          size: { type: 'string' },
          businessModel: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          score: { type: 'number', minimum: 0, maximum: 100 },
          scoreFacets: { type: 'object' },
          source: { type: 'string' },
          matchReasons: { type: 'array', items: { type: 'string' } },
          sourcedFrom: { type: 'object' },
        },
      },
    },
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Body: SaveAccountBody }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    try {
      const account = await saveAccount(userId, request.body);
      reply.send({ success: true, account });
    } catch (error: unknown) {
      console.error('[Accounts] Save error:', error);
      reply.status(500).send({ success: false, error: 'Failed to save account' });
    }
  });

  // Bulk save accounts
  fastify.post<{ Body: { accounts: SaveAccountBody[] } }>('/save/bulk', {
    schema: {
      body: {
        type: 'object',
        required: ['accounts'],
        properties: {
          accounts: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'domain', 'source'],
              properties: {
                name: { type: 'string' },
                domain: { type: 'string' },
                description: { type: 'string' },
                industry: { type: 'string' },
                size: { type: 'string' },
                businessModel: { type: 'string' },
                confidence: { type: 'number' },
                score: { type: 'number' },
                scoreFacets: { type: 'object' },
                source: { type: 'string' },
                matchReasons: { type: 'array' },
                sourcedFrom: { type: 'object' },
              },
            },
          },
        },
      },
    },
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Body: { accounts: SaveAccountBody[] } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const { accounts } = request.body;

    if (!accounts || accounts.length === 0) {
      reply.status(400).send({ success: false, error: 'No accounts provided' });
      return;
    }

    try {
      const saved = await saveAccountsBulk(userId, accounts);
      reply.send({ success: true, accounts: saved, count: saved.length });
    } catch (error: unknown) {
      console.error('[Accounts] Bulk save error:', error);
      reply.status(500).send({ success: false, error: 'Failed to save accounts' });
    }
  });

  // List accounts with pagination and filtering
  fastify.get<{ Querystring: ListAccountsQuery }>('/list', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Querystring: ListAccountsQuery }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const {
      status,
      limit = '50',
      offset = '0',
      sortBy = 'discovered_at',
      sortOrder = 'desc',
    } = request.query;

    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    try {
      const { accounts, total } = await listAccounts(userId, {
        status,
        limit: limitNum,
        offset: offsetNum,
        sortBy,
        sortOrder,
      });

      reply.send({
        success: true,
        accounts,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + accounts.length < total,
        },
      });
    } catch (error: unknown) {
      console.error('[Accounts] List error:', error);
      reply.status(500).send({ success: false, error: 'Failed to list accounts' });
    }
  });

  // Get single account by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const { id } = request.params;

    try {
      const account = await getAccountById(userId, id);
      if (!account) {
        reply.status(404).send({ success: false, error: 'Account not found' });
        return;
      }
      reply.send({ success: true, account });
    } catch (error: unknown) {
      console.error('[Accounts] Get error:', error);
      reply.status(500).send({ success: false, error: 'Failed to get account' });
    }
  });

  // Update account status
  fastify.patch<{ Params: { id: string }; Body: { status: string } }>('/:id/status', {
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['discovered', 'selected', 'contacted', 'qualified', 'disqualified'],
          },
        },
      },
    },
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const { id } = request.params;
    const { status } = request.body;

    try {
      const account = await updateAccountStatus(userId, id, status);
      if (!account) {
        reply.status(404).send({ success: false, error: 'Account not found' });
        return;
      }
      reply.send({ success: true, account });
    } catch (error: unknown) {
      console.error('[Accounts] Update status error:', error);
      reply.status(500).send({ success: false, error: 'Failed to update account status' });
    }
  });

  // Delete account
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const { id } = request.params;

    try {
      const deleted = await deleteAccount(userId, id);
      if (!deleted) {
        reply.status(404).send({ success: false, error: 'Account not found' });
        return;
      }
      reply.send({ success: true, message: 'Account deleted' });
    } catch (error: unknown) {
      console.error('[Accounts] Delete error:', error);
      reply.status(500).send({ success: false, error: 'Failed to delete account' });
    }
  });
}
