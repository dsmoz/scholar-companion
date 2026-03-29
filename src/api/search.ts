// src/api/search.ts
import { apiFetch } from './client';
import { TTLCache } from './apiCache';
import { getTtlMs } from '../prefs';

export interface SearchResult {
  zotero_key: string;
  title: string;
  score: number;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  itemType?: string;
}

const similarCache = new TTLCache<string, SearchResult[]>(() => getTtlMs());

export async function semanticSearch(query: string, limit = 6): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.results;
}

export async function similarItems(zoteroKey: string, limit = 6): Promise<SearchResult[]> {
  const key = `${zoteroKey}:${limit}`;
  const cached = similarCache.get(key);
  if (cached) return cached;
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/similar/${zoteroKey}?limit=${limit}`
  );
  similarCache.set(key, data.results);
  return data.results;
}

export async function similarToMany(keys: string[], limit = 5): Promise<SearchResult[]> {
  const cacheKey = [...keys].sort().join('|') + `:${limit}`;
  const cached = similarCache.get(cacheKey);
  if (cached) return cached;
  if (keys.length === 1) {
    return similarItems(keys[0], limit);
  }
  const data = await apiFetch<{ results: SearchResult[] }>('/similar/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys, limit }),
  });
  similarCache.set(cacheKey, data.results);
  return data.results;
}
