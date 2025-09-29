import { Pool } from 'pg';
import Redis from 'ioredis';

// PostgreSQL connection pool
export const createPostgresPool = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  return pool;
};

// Redis connection
export const createRedisClient = () => {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  return redis;
};

// Database health check functions
export const checkPostgresHealth = async (pool: Pool): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connection healthy');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  }
};

export const checkRedisHealth = async (redis: Redis): Promise<boolean> => {
  try {
    await redis.ping();
    console.log('✅ Redis connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
};