// src/api/discovery.ts
import { apiFetch } from './client';
import { getDiscoverySources } from '../prefs';

export interface DiscoveryResult {
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  source: 'pubmed' | 'semantic_scholar' | 'openalex';
  pmid?: string;
  s2_id?: string;
}

export async function discoverySearch(
  query: string,
  sourcesOverride?: string[]
): Promise<DiscoveryResult[]> {
  const prefs = getDiscoverySources();
  const sources = sourcesOverride ?? Object.entries(prefs)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
  const params = new URLSearchParams({
    q: query,
    sources: sources.join(','),
    limit: '10',
  });
  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  return data.results;
}
