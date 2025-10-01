import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createUser, generateJWT, getRateLimitStatus, getUserByEmail, verifyPassword } from '../services/auth';
import { Plan } from '../types/user';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          plan: { type: 'string', enum: ['free','starter','pro','team'], nullable: true },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { email: string; password: string; plan?: Plan } }>, reply: FastifyReply) => {
    const { email, password, plan } = request.body;
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        reply.status(400).send({ success: false, error: 'Email already registered' });
        return;
      }
      const user = await createUser(email, password, plan);
      const token = generateJWT(user);
      reply.send({ success: true, token, user: sanitize(user) });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ success: false, error: 'Registration failed' });
    }
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object', required: ['email','password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } }
      }
    }
  }, async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = request.body;
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        reply.status(401).send({ success: false, error: 'Invalid credentials' });
        return;
      }
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        reply.status(401).send({ success: false, error: 'Invalid credentials' });
        return;
      }
      const token = generateJWT(user);
      reply.send({ success: true, token, user: sanitize(user) });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ success: false, error: 'Login failed' });
    }
  });

  // Me
  fastify.get('/me', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : undefined;
    if (!token) { reply.status(401).send({ success: false, error: 'Unauthorized' }); return; }
    const { verifyJWT } = await import('../services/auth');
    const decoded = verifyJWT(token);
    if (!decoded) { reply.status(401).send({ success: false, error: 'Unauthorized' }); return; }
    const user = await getUserByEmail(decoded.email);
    if (!user) { reply.status(401).send({ success: false, error: 'Unauthorized' }); return; }
    const rateLimit = await getRateLimitStatus(user.id);
    reply.send({ success: true, user: sanitize(user), rateLimit });
  });
}

function sanitize(u: any) {
  return {
    id: u.id,
    email: u.email,
    plan: u.plan,
    discoveryLimit: u.discoveryLimit,
    discoveryCount: u.discoveryCount,
    createdAt: u.createdAt,
  };
}

