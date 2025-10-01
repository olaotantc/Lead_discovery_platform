import { Pool } from 'pg';
import { createPostgresPool } from '../config/database';

const pool: Pool = createPostgresPool();

export interface Account {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string;
  businessModel?: string;
  confidence?: number;
  score?: number;
  scoreFacets?: Record<string, unknown>;
  source: string;
  matchReasons?: string[];
  sourcedFrom?: Record<string, unknown>;
  status: string;
  discoveredAt: string;
  updatedAt: string;
}

export interface SaveAccountInput {
  name: string;
  domain: string;
  description?: string;
  industry?: string;
  size?: string;
  businessModel?: string;
  confidence?: number;
  score?: number;
  scoreFacets?: Record<string, unknown>;
  source: string;
  matchReasons?: string[];
  sourcedFrom?: Record<string, unknown>;
}

// Save a single account
export async function saveAccount(userId: string, input: SaveAccountInput): Promise<Account> {
  const result = await pool.query(
    `INSERT INTO accounts (
      user_id, name, domain, description, industry, size, business_model,
      confidence, score, score_facets, source, match_reasons, sourced_from
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (user_id, domain)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      industry = EXCLUDED.industry,
      size = EXCLUDED.size,
      business_model = EXCLUDED.business_model,
      confidence = EXCLUDED.confidence,
      score = EXCLUDED.score,
      score_facets = EXCLUDED.score_facets,
      match_reasons = EXCLUDED.match_reasons,
      sourced_from = EXCLUDED.sourced_from,
      updated_at = NOW()
    RETURNING *`,
    [
      userId,
      input.name,
      input.domain,
      input.description || null,
      input.industry || null,
      input.size || null,
      input.businessModel || null,
      input.confidence || null,
      input.score || null,
      input.scoreFacets ? JSON.stringify(input.scoreFacets) : null,
      input.source,
      input.matchReasons || null,
      input.sourcedFrom ? JSON.stringify(input.sourcedFrom) : null,
    ]
  );

  return mapDbRow(result.rows[0]);
}

// Bulk save accounts
export async function saveAccountsBulk(userId: string, accounts: SaveAccountInput[]): Promise<Account[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saved: Account[] = [];
    for (const acc of accounts) {
      const result = await client.query(
        `INSERT INTO accounts (
          user_id, name, domain, description, industry, size, business_model,
          confidence, score, score_facets, source, match_reasons, sourced_from
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (user_id, domain)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          industry = EXCLUDED.industry,
          size = EXCLUDED.size,
          business_model = EXCLUDED.business_model,
          confidence = EXCLUDED.confidence,
          score = EXCLUDED.score,
          score_facets = EXCLUDED.score_facets,
          match_reasons = EXCLUDED.match_reasons,
          sourced_from = EXCLUDED.sourced_from,
          updated_at = NOW()
        RETURNING *`,
        [
          userId,
          acc.name,
          acc.domain,
          acc.description || null,
          acc.industry || null,
          acc.size || null,
          acc.businessModel || null,
          acc.confidence || null,
          acc.score || null,
          acc.scoreFacets ? JSON.stringify(acc.scoreFacets) : null,
          acc.source,
          acc.matchReasons || null,
          acc.sourcedFrom ? JSON.stringify(acc.sourcedFrom) : null,
        ]
      );
      saved.push(mapDbRow(result.rows[0]));
    }

    await client.query('COMMIT');
    return saved;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// List accounts with pagination
export async function listAccounts(
  userId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'discovered_at' | 'score' | 'name';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{ accounts: Account[]; total: number }> {
  const { status, limit = 50, offset = 0, sortBy = 'discovered_at', sortOrder = 'desc' } = options;

  const limitNum = Math.min(limit, 100);

  let query = 'SELECT * FROM accounts WHERE user_id = $1';
  const params: unknown[] = [userId];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  // Validate sortBy and sortOrder
  const allowedSortBy = ['discovered_at', 'score', 'name'];
  const allowedSortOrder = ['asc', 'desc'];
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'discovered_at';
  const safeSortOrder = allowedSortOrder.includes(sortOrder) ? sortOrder : 'desc';

  query += ` ORDER BY ${safeSortBy} ${safeSortOrder.toUpperCase()}`;
  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limitNum, offset);

  const result = await pool.query(query, params);
  const accounts = result.rows.map(mapDbRow);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM accounts WHERE user_id = $1';
  const countParams: unknown[] = [userId];
  if (status) {
    countParams.push(status);
    countQuery += ` AND status = $2`;
  }
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return { accounts, total };
}

// Get single account
export async function getAccountById(userId: string, accountId: string): Promise<Account | null> {
  const result = await pool.query(
    'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
    [accountId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapDbRow(result.rows[0]);
}

// Update account status
export async function updateAccountStatus(
  userId: string,
  accountId: string,
  status: string
): Promise<Account | null> {
  const result = await pool.query(
    'UPDATE accounts SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [status, accountId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapDbRow(result.rows[0]);
}

// Delete account
export async function deleteAccount(userId: string, accountId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
    [accountId, userId]
  );

  return result.rows.length > 0;
}

// Helper function to map database row to Account interface
function mapDbRow(row: any): Account {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    domain: row.domain,
    description: row.description,
    industry: row.industry,
    size: row.size,
    businessModel: row.business_model,
    confidence: row.confidence ? parseFloat(row.confidence) : undefined,
    score: row.score ? parseFloat(row.score) : undefined,
    scoreFacets: row.score_facets,
    source: row.source,
    matchReasons: row.match_reasons,
    sourcedFrom: row.sourced_from,
    status: row.status,
    discoveredAt: row.discovered_at,
    updatedAt: row.updated_at,
  };
}
