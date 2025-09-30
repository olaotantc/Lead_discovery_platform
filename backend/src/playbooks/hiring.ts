import { Playbook, PlaybookInput, PlaybookResult, Signal, Source, extractDomain, nowIso } from './types';

// Simple heuristic-based "hiring signals" playbook (offline-friendly)
// Notes:
// - No network calls; we infer likely career endpoints and signals deterministically
// - In future, replace heuristics with crawler (Playwright) + robots.txt respect

function buildCareerUrls(domain: string): string[] {
  const base = `https://${domain}`;
  return [
    `${base}/careers`,
    `${base}/jobs`,
    `${base}/join-us`,
    `${base}/about#careers`,
  ];
}

export const HiringSignalsPlaybook: Playbook = {
  id: 'playbook.hiring.v1',
  name: 'Hiring Signals',
  async run(input: PlaybookInput): Promise<PlaybookResult> {
    const startedAt = nowIso();
    const domain = extractDomain(input.url);

    // Generate plausible sources without fetching
    const sources: Source[] = buildCareerUrls(domain).map((u) => ({ type: 'CareerPage', url: u }));

    const briefLower = (input.brief || '').toLowerCase();
    const briefHints = ['hiring', 'growth', 'expanding', 'recruit', 'role', 'positions'];
    const briefSuggestsHiring = briefHints.some((h) => briefLower.includes(h));

    // Basic deterministic signals
    const signals: Signal[] = [
      {
        category: 'hiring',
        name: 'CareerPageLikely',
        value: `Detected common career endpoints for ${domain}`,
        confidence: 60,
        source: { type: 'Website', url: `https://${domain}` },
        evidence: sources.slice(0, 2).map((s) => `Possible: ${s.url}`),
      },
      {
        category: 'hiring',
        name: 'JobBoardsLikely',
        value: 'Company may list roles on job boards (e.g., Lever, Greenhouse, Workable)',
        confidence: 45,
        source: { type: 'Unknown', notes: 'Heuristic inference only' },
        evidence: ['Patterns: /careers, /jobs, /join-us'],
      },
    ];

    if (briefSuggestsHiring) {
      signals.push({
        category: 'hiring',
        name: 'BriefIndicatesHiring',
        value: 'Brief suggests active hiring or growth phase',
        confidence: 70,
        source: { type: 'Website', url: `https://${domain}` },
        evidence: ['Brief contains hiring-related keywords'],
      });
    }

    const finishedAt = nowIso();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    return {
      playbookId: this.id,
      name: this.name,
      signals,
      sources,
      startedAt,
      finishedAt,
      durationMs,
    };
  },
};

