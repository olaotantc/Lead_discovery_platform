import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { findOrCreateOAuthUser, generateJWT } from '../services/auth';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/oauth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export default async function oauthRoutes(fastify: FastifyInstance) {
  // Initiate Google OAuth flow
  fastify.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!GOOGLE_CLIENT_ID) {
      reply.status(500).send({ error: 'Google OAuth not configured' });
      return;
    }

    const state = generateState();

    // Store state in cookie for CSRF protection
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // Google OAuth callback
  fastify.get('/google/callback', async (request: FastifyRequest<{
    Querystring: { code?: string; state?: string; error?: string }
  }>, reply: FastifyReply) => {
    const { code, state, error } = request.query;

    if (error) {
      fastify.log.error(`Google OAuth error: ${error}`);
      reply.redirect(`${FRONTEND_URL}/login?error=oauth_denied`);
      return;
    }

    if (!code) {
      reply.redirect(`${FRONTEND_URL}/login?error=no_code`);
      return;
    }

    // Verify state for CSRF protection
    const storedState = request.cookies.oauth_state;
    if (!storedState || storedState !== state) {
      fastify.log.error('OAuth state mismatch');
      reply.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
      return;
    }

    // Clear the state cookie
    reply.clearCookie('oauth_state', { path: '/' });

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        fastify.log.error(`Token exchange failed: ${errorText}`);
        reply.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
        return;
      }

      const tokens = await tokenResponse.json() as GoogleTokenResponse;

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        fastify.log.error('Failed to get user info from Google');
        reply.redirect(`${FRONTEND_URL}/login?error=user_info_failed`);
        return;
      }

      const googleUser = await userInfoResponse.json() as GoogleUserInfo;

      if (!googleUser.email) {
        reply.redirect(`${FRONTEND_URL}/login?error=no_email`);
        return;
      }

      // Find or create user in our database
      const user = await findOrCreateOAuthUser({
        email: googleUser.email,
        oauthProvider: 'google',
        oauthId: googleUser.id,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      });

      // Generate our JWT
      const jwt = generateJWT(user);

      // Redirect to frontend with token
      reply.redirect(`${FRONTEND_URL}/auth/callback?token=${jwt}`);
    } catch (err) {
      fastify.log.error(err);
      reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  });

  // Check OAuth configuration status
  fastify.get('/status', async (request, reply) => {
    reply.send({
      google: {
        configured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
        clientId: GOOGLE_CLIENT_ID ? '***configured***' : null,
      },
    });
  });
}

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
