import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface ComplianceBody { senderDomain: string }
interface ComposeBody {
  to: string;
  from: string;
  subject: string;
  bodyText: string;
  listUnsubscribe?: string; // optional override
}

function mockCompliance(domain: string) {
  // Deterministic but mocked checks
  const base = domain.toLowerCase();
  const pass = (seed: number) => (seed % 3 !== 0);
  const code = base.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const spf = pass(code+1) ? 'pass' : 'unknown';
  const dkim = pass(code+2) ? 'pass' : 'unknown';
  const dmarc = pass(code+3) ? 'pass' : 'unknown';
  const okToSend = [spf,dkim,dmarc].every(v=>v==='pass');
  const reasons: string[] = [];
  if (!okToSend) reasons.push('Missing/unknown SPF/DKIM/DMARC — configure before sending at scale');
  return { spf, dkim, dmarc, okToSend, reasons };
}

export default async function handoffRoutes(fastify: FastifyInstance) {
  // Compliance check
  fastify.post<{ Body: ComplianceBody }>('/compliance-check', async (request, reply) => {
    const { senderDomain } = request.body;
    if (!senderDomain) {
      reply.status(400).send({ success: false, error: 'senderDomain required' });
      return;
    }
    const status = mockCompliance(senderDomain);
    reply.send({ success: true, data: status });
  });

  // Generate .eml payload (RFC822 style) for download
  fastify.post<{ Body: ComposeBody }>('/eml', async (request, reply) => {
    const { to, from, subject, bodyText, listUnsubscribe } = request.body;
    if (!to || !from || !subject || !bodyText) {
      reply.status(400).send({ success: false, error: 'to, from, subject, bodyText required' });
      return;
    }
    const fromDomain = (from.split('@')[1] || 'example.com').toLowerCase();
    const lu = listUnsubscribe || `<mailto:unsubscribe@${fromDomain}?subject=unsubscribe>, <https://${fromDomain}/unsubscribe>`;
    const eml = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      `List-Unsubscribe: ${lu}`,
      '',
      bodyText,
      ''
    ].join('\r\n');
    reply.header('Content-Type', 'message/rfc822');
    reply.header('Content-Disposition', 'attachment; filename="draft.eml"');
    reply.send(eml);
  });
}

