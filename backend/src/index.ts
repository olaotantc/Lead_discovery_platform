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
import './workers'; // Initialize workers
// import icpRoutes from './routes/icp';
import discoveryRoutes from './routes/discovery';

// Load environment variables
dotenv.config();

// Create Fastify instance
const server = fastify({
  logger: true,
});

// Initialize database connections
const postgresPool = createPostgresPool();
const redisClient = createRedisClient();

// Register CORS plugin
server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
});

// Register routes
// server.register(icpRoutes, { prefix: '/api/icp' }); // Temporarily disabled
server.register(discoveryRoutes, { prefix: '/api/discovery' });

// Health check route with database and queue status
server.get('/health', async (request, reply) => {
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
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
