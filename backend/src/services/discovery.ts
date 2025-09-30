import { HiringSignalsPlaybook } from '../playbooks/hiring';
import { BusinessProfilePlaybook } from '../playbooks/businessProfile';
import { PlaybookInput, Signal, Source } from '../playbooks/types';

export interface DiscoveryRunInput extends PlaybookInput {}

export interface DiscoveryRunResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  playbooks: Array<{
    id: string;
    name: string;
    signals: Signal[];
    sources: Source[];
    durationMs: number;
  }>;
  summary: {
    totalSignals: number;
    byCategory: Record<string, number>;
    sourcesCount: number;
  };
}

export async function runDiscovery(input: DiscoveryRunInput): Promise<DiscoveryRunResult> {
  const startedAt = new Date();

  // In future, we can select playbooks dynamically; for now, run both
  const playbooks = [HiringSignalsPlaybook, BusinessProfilePlaybook];

  const results = [] as DiscoveryRunResult['playbooks'];

  for (const pb of playbooks) {
    const res = await pb.run(input);
    results.push({
      id: res.playbookId,
      name: res.name,
      signals: res.signals,
      sources: res.sources,
      durationMs: res.durationMs,
    });
  }

  const finishedAt = new Date();

  const allSignals = results.flatMap((r) => r.signals);
  const byCategory = allSignals.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sourcesCount = results.reduce((acc, r) => acc + r.sources.length, 0);

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    playbooks: results,
    summary: {
      totalSignals: allSignals.length,
      byCategory,
      sourcesCount,
    },
  };
}

