// src/api/search.ts
import { apiFetch } from './client';

export interface SearchResult {
  zotero_key: string;
  title: string;
  score: number;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  itemType?: string;
}

export async function semanticSearch(query: string, limit = 6): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.results;
}

export async function similarItems(zoteroKey: string, limit = 6): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/similar/${zoteroKey}?limit=${limit}`
  );
  return data.results;
}

export async function similarToMany(keys: string[], limit = 5): Promise<SearchResult[]> {
  if (keys.length === 1) {
    return similarItems(keys[0], limit);
  }
  const data = await apiFetch<{ results: SearchResult[] }>('/similar/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys, limit }),
  });
  return data.results;
}
