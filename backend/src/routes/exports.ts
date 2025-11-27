import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getContactDiscovery } from '../services/contactDiscovery';

interface ContactsCsvBody {
  jobId: string;
  selectedIds?: string[];
}

interface CompaniesCsvBody {
  companies: Array<{
    name: string;
    domain: string;
    description?: string;
    industry?: string;
    size?: string;
    score: number;
    scoreFacets?: {
      industryFit: { score: number };
      sizeFit: { score: number };
      modelFit: { score: number };
      keywordMatch: { score: number };
    };
    matchReasons?: string[];
  }>;
}

export default async function exportsRoutes(fastify: FastifyInstance) {
  // Export companies/leads as CSV
  fastify.post<{ Body: CompaniesCsvBody }>('/companies/csv', async (request, reply) => {
    const { companies } = request.body;
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      reply.status(400).send({ success: false, error: 'No companies provided' });
      return;
    }

    const headers = [
      'name', 'domain', 'description', 'industry', 'size', 'total_score',
      'industry_fit', 'size_fit', 'model_fit', 'keyword_match', 'match_reasons'
    ];

    const escape = (v: unknown) => {
      const s = (v ?? '').toString();
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const rows = companies.map(c => {
      const reasons = (c.matchReasons || []).join(' | ');
      return [
        c.name,
        c.domain,
        c.description || '',
        c.industry || '',
        c.size || '',
        c.score,
        c.scoreFacets?.industryFit?.score ?? '',
        c.scoreFacets?.sizeFit?.score ?? '',
        c.scoreFacets?.modelFit?.score ?? '',
        c.scoreFacets?.keywordMatch?.score ?? '',
        reasons,
      ].map(escape).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="companies_${Date.now()}.csv"`);
    reply.send(csv);
  });

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

