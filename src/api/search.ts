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
  signals?: Record<string, number>;
}

const similarCache = new TTLCache<string, SearchResult[]>(() => getTtlMs());
const searchCache = new TTLCache<string, SearchResult[]>(() => getTtlMs());

export async function semanticSearch(query: string, limit = 6): Promise<SearchResult[]> {
  const key = `${query}:${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  searchCache.set(key, data.results);
  return data.results;
}

export async function similarItems(zoteroKey: string, limit = 6, context?: string): Promise<SearchResult[]> {
  const key = `${zoteroKey}:${limit}:${context ?? ''}`;
  const cached = similarCache.get(key);
  if (cached) return cached;
  let url = `/similar/${zoteroKey}?limit=${limit}`;
  if (context) url += `&context=${encodeURIComponent(context)}`;
  const data = await apiFetch<{ results: SearchResult[] }>(url);
  similarCache.set(key, data.results);
  return data.results;
}

export async function similarToMany(keys: string[], limit = 5, context?: string): Promise<SearchResult[]> {
  const cacheKey = [...keys].sort().join('|') + `:${limit}:${context ?? ''}`;
  const cached = similarCache.get(cacheKey);
  if (cached) return cached;
  if (keys.length === 1) {
    return similarItems(keys[0], limit, context);
  }
  const data = await apiFetch<{ results: SearchResult[] }>('/similar/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys, limit, context }),
  });
  similarCache.set(cacheKey, data.results);
  return data.results;
}
