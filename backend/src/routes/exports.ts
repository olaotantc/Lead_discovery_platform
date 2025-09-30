import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getContactDiscovery } from '../services/contactDiscovery';

interface ContactsCsvBody {
  jobId: string;
  selectedIds?: string[];
}

export default async function exportsRoutes(fastify: FastifyInstance) {
  // Export contacts from a discovery job as CSV
  fastify.post<{ Body: ContactsCsvBody }>('/contacts/csv', async (request, reply) => {
    const { jobId, selectedIds } = request.body;
    const res = await getContactDiscovery(jobId);
    if (!res || !Array.isArray(res.contacts)) {
      reply.status(404).send({ success: false, error: 'Discovery job not found or empty' });
      return;
    }
    let contacts = res.contacts;
    if (selectedIds && selectedIds.length > 0) {
      const set = new Set(selectedIds);
      contacts = contacts.filter(c => set.has(c.id));
    }
    const headers = [
      'name','email','role','title','domain','confidence','verification_status','verification_score','sources','score_fit','score_intent','score_reach','score_recency'
    ];
    const escape = (v: any) => {
      const s = (v ?? '').toString();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const rows = contacts.map(c => {
      const sources = (c.sources || []).map(s => s.url || s.provider || '').filter(Boolean).join(' | ');
      const fit = c.scoreFacets?.fit?.score ?? '';
      const intent = c.scoreFacets?.intent?.score ?? '';
      const reach = c.scoreFacets?.reachability?.score ?? '';
      const recency = c.scoreFacets?.recency?.score ?? '';
      return [
        c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        c.email,
        c.role || '',
        c.title || '',
        c.domain,
        c.confidence,
        c.verification?.status || '',
        c.verification?.score ?? '',
        sources,
        fit, intent, reach, recency,
      ].map(escape).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="contacts_${jobId}.csv"`);
    reply.send(csv);
  });
}

