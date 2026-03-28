// src/api/discovery.ts
import { apiFetch } from './client';
import {
  getDiscoverySources, getDiscoveryHistoryTTL, getDiscoveryHistoryMax,
  getDiscoveryHistory, setDiscoveryHistory,
  HistoryEntry, SortKey,
} from '../prefs';

export type { SortKey };
export type { HistoryEntry };

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

// Client-side TTL cache: key → {results, at}
const _cache = new Map<string, { results: DiscoveryResult[]; at: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function cacheKey(query: string, sources: string[], limit: number): string {
  return `${query.trim().toLowerCase()}|${[...sources].sort().join(',')}|${limit}`;
}

export function getCached(key: string): DiscoveryResult[] | null {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.at < CACHE_TTL) return entry.results;
  return null;
}

export function invalidateDiscoveryCache(): void {
  _cache.clear();
}

export async function discoverySearch(
  query: string,
  sources?: string[],
  limit?: number,
): Promise<DiscoveryResult[]> {
  const activeSources = sources ?? getDiscoverySources()
    .filter(s => s.enabled)
    .map(s => s.id);
  if (activeSources.length === 0) return [];

  const effectiveLimit = limit ?? 10;
  const key = cacheKey(query, activeSources, effectiveLimit);
  const cached = getCached(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query,
    sources: activeSources.join(','),
    limit: String(effectiveLimit),
  });
  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  _cache.set(key, { results: data.results, at: Date.now() });
  return data.results;
}

// --- History ---

export function getValidHistory(): HistoryEntry[] {
  const ttlMs = getDiscoveryHistoryTTL() * 3600 * 1000;
  const now = Date.now();
  return getDiscoveryHistory().filter(h => now - h.timestamp < ttlMs);
}

export function addToHistory(entry: HistoryEntry): void {
  const ttlMs = getDiscoveryHistoryTTL() * 3600 * 1000;
  const max = getDiscoveryHistoryMax();
  const now = Date.now();
  let history = getDiscoveryHistory()
    .filter(h => now - h.timestamp < ttlMs)        // drop expired
    .filter(h => h.query !== entry.query);          // dedup by query
  history.unshift(entry);                           // newest first
  if (history.length > max) history = history.slice(0, max);
  setDiscoveryHistory(history);
}
