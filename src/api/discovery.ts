// src/api/discovery.ts
import { apiFetch } from './client';
import {
  type SourceEntry,
  type SourcePrefs,
  initSourcePrefs,
  getEnabledSources,
  migrateLegacySourcePrefs,
} from '../prefs';

export type { SourceEntry };

export interface DiscoveryResult {
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  source: string;  // "pubmed" | "semantic_scholar" | "openalex" | "europe_pmc" | ...
  pmid?: string;
  s2_id?: string;
  url?: string;
  abstract?: string;
  snippet?: string;
  is_open_access?: boolean;
  oa_status?: string;
  score?: number;  // relevance score 0–1, present when score_mode is set
  item_type?: string;  // 'webpage' | 'report' | 'videoRecording' — set by web sources
  tags?: string[];     // MeSH terms, author keywords, OpenAlex topics
}

export interface DiscoveryFilters {
  is_open_access?: boolean;
  has_fulltext?: boolean;
  publication_type?: string[];
  language?: string;
  humans_only?: boolean;
  study_design?: string[];
}

interface SourcesResponse {
  sources: SourceEntry[];
}

// Module-level cache — fetched once per Zotero session then reused.
let _cachedSources: SourceEntry[] | null = null;

export function clearSourceCache(): void {
  _cachedSources = null;
}

/**
 * Fetch available discovery sources from the server registry.
 * Cached for the lifetime of the Zotero session.
 * Runs legacy pref migration on first call.
 */
export async function fetchDiscoverySources(): Promise<SourceEntry[]> {
  if (_cachedSources !== null) return _cachedSources;
  migrateLegacySourcePrefs();
  try {
    const data = await apiFetch<SourcesResponse>('/discovery/sources');
    _cachedSources = data.sources;
    console.log(`[Scholar Companion] Loaded ${data.sources.length} discovery sources`);
    initSourcePrefs(_cachedSources);
    return _cachedSources;
  } catch (err) {
    console.error('[Scholar Companion] Failed to fetch discovery sources:', err);
    throw err;
  }
}

/**
 * Search external academic sources.
 *
 * Sources are resolved dynamically: server registry → user prefs → enabled list.
 * Pass `sourcesOverride` to force specific sources (bypasses user prefs).
 * Pass `filters` to narrow results (which filters apply depends on each source).
 * Pass `scoreMode`, `minScore`, `topK` to control relevance ranking on the server.
 */
export async function discoverySearch(
  query: string,
  sourcesOverride?: string[],
  filters?: DiscoveryFilters,
  yearFrom?: number,
  yearTo?: number,
  scoreMode?: 'keyword' | 'semantic',
  minScore?: number,
  topK?: number,
): Promise<DiscoveryResult[]> {
  const sources = await fetchDiscoverySources();

  const enabledKeys = sourcesOverride ?? getEnabledSources(sources);
  if (enabledKeys.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    sources: enabledKeys.join(','),
    limit: '20',
  });

  if (yearFrom != null)  params.set('year_from', String(yearFrom));
  if (yearTo != null)    params.set('year_to', String(yearTo));
  if (scoreMode)         params.set('score_mode', scoreMode);
  if (minScore != null)  params.set('min_score', String(minScore));
  if (topK != null)      params.set('top_k', String(topK));

  if (filters) {
    if (filters.is_open_access != null)    params.set('is_open_access', String(filters.is_open_access));
    if (filters.has_fulltext != null)      params.set('has_fulltext', String(filters.has_fulltext));
    if (filters.publication_type?.length)  params.set('publication_type', filters.publication_type.join(','));
    if (filters.language)                  params.set('language', filters.language);
    if (filters.humans_only != null)       params.set('humans_only', String(filters.humans_only));
    if (filters.study_design?.length)      params.set('study_design', filters.study_design.join(','));
  }

  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  return data.results;
}

export interface SearchHistoryEntry {
  id: number;
  query: string;
  sources: string[];
  filters: DiscoveryFilters | null;
  score_mode: string | null;
  min_score: number | null;
  top_k: number | null;
  result_count: number;
  searched_at: string;
}

export async function fetchSearchHistory(limit = 20): Promise<SearchHistoryEntry[]> {
  const data = await apiFetch<{ history: SearchHistoryEntry[] }>(`/discovery/history?limit=${limit}`);
  return data.history;
}

export async function clearSearchHistory(): Promise<{ deleted: number; success: boolean }> {
  return apiFetch<{ deleted: number; success: boolean }>('/discovery/history', { method: 'DELETE' });
}
