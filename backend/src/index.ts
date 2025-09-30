import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { createPostgresPool, createRedisClient, checkPostgresHealth, checkRedisHealth } from './config/database';
import {
  checkQueuesHealth,
  addDiscoveryJob,
  addEmailVerificationJob,
  addContactEnrichmentJob,
  addDraftGenerationJob,
  closeQueues
} from './config/jobs';
// Workers are initialized conditionally below to avoid crashes in dev when Redis is unavailable
// import icpRoutes from './routes/icp';
import discoveryRoutes from './routes/discovery';
import contactRoutes from './routes/contacts';
import draftsRoutes from './routes/drafts';
import scoringRoutes from './routes/scoring';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server = fastify({
  logger: true,
});

// Initialize database connections
const postgresPool = createPostgresPool();
const redisClient = createRedisClient();

// CORS configuration (env-driven)
const buildAllowedOrigins = () => {
  const envList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const frontend = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : [];
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  // If user provided env list, use it plus FRONTEND_URL; else use defaults + FRONTEND_URL
  const list = (envList.length > 0 ? envList : defaults).concat(frontend);
  // De-duplicate
  return Array.from(new Set(list));
};

const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const allowAll = isDev || (process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true' || (process.env.CORS_ORIGINS || '').trim() === '*';

// Register CORS plugin
server.register(cors, {
  origin: (origin, cb) => {
    if (allowAll) {
      server.log.info({ origin: origin || 'undefined' }, 'CORS allowAll enabled');
      cb(null, true);
      return;
    }
    const allowedOrigins = buildAllowedOrigins();
    const decision = !origin || allowedOrigins.includes(origin);
    server.log.info({ origin: origin || 'undefined', decision, allowedOrigins }, 'CORS origin check');
    if (decision) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});

// Register routes
// server.register(icpRoutes, { prefix: '/api/icp' }); // Temporarily disabled
server.register(discoveryRoutes, { prefix: '/api/discovery' });
server.register(contactRoutes, { prefix: '/api/contacts' });
server.register(draftsRoutes, { prefix: '/api/drafts' });
server.register(scoringRoutes, { prefix: '/api/scoring' });

// Initialize workers conditionally (avoid hard fail if Redis not running during dev)
async function initWorkersIfEnabled() {
  const disableWorkers = (process.env.DISABLE_WORKERS || '').toLowerCase() === 'true';
  const hasRedisUrl = !!process.env.REDIS_URL;
  if (disableWorkers) {
    server.log.warn('Workers disabled via DISABLE_WORKERS env');
    return;
  }
  if (isDev && !hasRedisUrl) {
    server.log.warn('Skipping workers init in dev (no REDIS_URL set)');
    return;
  }
  try {
    await import('./workers');
    server.log.info('🚀 Job workers initialized');
  } catch (err) {
    server.log.error({ err }, 'Failed to initialize workers');
  }
}

// Health check route with database and queue status
server.get('/health', async (request, reply) => {
  server.log.info({ origin: request.headers.origin || 'undefined' }, 'Health check request');
  const postgresHealthy = await checkPostgresHealth(postgresPool);
  const redisHealthy = await checkRedisHealth(redisClient);
  const queuesHealth = await checkQueuesHealth();

  return {
    status: 'ok',
    message: 'SignalRunner API v0.2',
    databases: {
      postgres: postgresHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected'
    },
    queues: queuesHealth
  };
});

// API routes will be added here as we develop features
server.get('/api/v1/status', async (request, reply) => {
  return {
    api: 'SignalRunner Discovery API',
    version: '0.2.0',
    status: 'ready'
  };
});

// Database connectivity test route
server.get('/api/v1/db-test', async (request, reply) => {
  const postgresHealthy = await checkPostgresHealth(postgresPool);
  const redisHealthy = await checkRedisHealth(redisClient);

  return {
    databases: {
      postgres: {
        status: postgresHealthy ? 'connected' : 'error',
        url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@') // Hide password
      },
      redis: {
        status: redisHealthy ? 'connected' : 'error',
        url: process.env.REDIS_URL
      }
    },
    timestamp: new Date().toISOString()
  };
});

// Job queue test routes
server.post('/api/v1/jobs/discovery/test', async (request, reply) => {
  const job = await addDiscoveryJob({
    url: 'https://example.com',
    brief: 'Test discovery job',
    userId: 'test-user',
    timestamp: new Date().toISOString(),
  });

  return {
    message: 'Discovery job added to queue',
    jobId: job.id,
    queue: 'discovery'
  };
});

server.post('/api/v1/jobs/email-verification/test', async (request, reply) => {
  const job = await addEmailVerificationJob({
    email: 'test@example.com',
    contactId: 'contact-123',
    userId: 'test-user',
  });

  return {
    message: 'Email verification job added to queue',
    jobId: job.id,
    queue: 'email-verification'
  };
});

server.post('/api/v1/jobs/contact-enrichment/test', async (request, reply) => {
  const job = await addContactEnrichmentJob({
    contactId: 'contact-123',
    companyDomain: 'example.com',
    userId: 'test-user',
  });

  return {
    message: 'Contact enrichment job added to queue',
    jobId: job.id,
    queue: 'contact-enrichment'
  };
});

server.post('/api/v1/jobs/draft-generation/test', async (request, reply) => {
  const job = await addDraftGenerationJob({
    contactId: 'contact-123',
    evidenceData: { company: 'Example Corp', role: 'CEO' },
    tone: 'direct',
    userId: 'test-user',
  });

  return {
    message: 'Draft generation job added to queue',
    jobId: job.id,
    queue: 'draft-generation'
  };
});

// Queue status route
server.get('/api/v1/jobs/status', async (request, reply) => {
  const queuesHealth = await checkQueuesHealth();

  return {
    queues: queuesHealth,
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8000');
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    const allowedOrigins = allowAll ? ['*'] : buildAllowedOrigins();
    console.log(`🚀 Server running at http://${host}:${port}`);
    server.log.info({ allowedOrigins, frontendUrl: process.env.FRONTEND_URL }, 'Server started with CORS allowlist');
    await initWorkersIfEnabled();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
