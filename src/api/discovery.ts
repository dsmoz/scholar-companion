// src/api/discovery.ts
import { apiFetch } from './client';
import { getDiscoverySources } from '../prefs';

export interface DiscoveryResult {
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  source: string;
  pmid?: string;
  s2_id?: string;
  url?: string;
  snippet?: string;
}

export async function discoverySearch(
  query: string,
  sources?: string[],  // explicit list; falls back to all enabled prefs
): Promise<DiscoveryResult[]> {
  const activeSources = sources ?? getDiscoverySources()
    .filter(s => s.enabled)
    .map(s => s.id);
  if (activeSources.length === 0) return [];
  const params = new URLSearchParams({
    q: query,
    sources: activeSources.join(','),
    limit: '10',
  });
  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  return data.results;
}
