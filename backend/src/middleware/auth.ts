import { FastifyReply, FastifyRequest } from 'fastify';
import { getRateLimitStatus, verifyJWT } from '../services/auth';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.substring(7);
  const decoded = verifyJWT(token);
  if (!decoded) {
    reply.status(401).send({ success: false, error: 'Invalid or expired token' });
    return;
  }
  (request as any).user = decoded;
}

export async function checkRateLimitMw(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user) {
    reply.status(401).send({ success: false, error: 'User not authenticated' });
    return;
  }
  const status = await getRateLimitStatus(user.userId);
  if (status.remaining <= 0) {
    reply.status(429).send({ success: false, error: 'Rate limit exceeded', ...status });
    return;
  }
}

