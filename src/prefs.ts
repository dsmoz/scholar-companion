// src/prefs.ts
const PREFIX = 'extensions.zotero-ai';

const DEFAULTS = {
  apiUrl: 'http://localhost:6500',
  syncInterval: 12,
  syncOnStartup: true,
  autoSync: true,
  theme: 'auto',
  accentColor: 'blue',
  graphNodeSize: 'M',
  chatModel: 'google/gemma-2-9b-it',
  chatMaxChunks: 8,
  chatRelatedMax: 5,
  chatRelatedMinLabel: 'Good',
  chatStream: true,
  // Discovery source preferences are stored as a single JSON string pref
  // (see getSourcePrefs / setSourcePref below) — NOT as individual booleans.
  // Legacy: discoveryPubmed, discoverySemanticScholar, discoveryOpenAlex
  // are migrated on first run by migrateLegacySourcePrefs().
  autoCascadeDelete: false,
  itemPaneHeight: 450,
  discoveryScoreMode: 'keyword' as 'keyword' | 'semantic',
  discoveryMinScore: 0.25,
  discoveryTopK: 25,
  listPageSize: 10,
  cacheTtlMinutes: 30,
  discoveryFontSize: 13,
  discoveryTextColor: '#cdd6f4',
} as const;

type PrefKey = keyof typeof DEFAULTS;

function get<K extends PrefKey>(key: K): typeof DEFAULTS[K] {
  const val = (globalThis as any).Zotero?.Prefs?.get(`${PREFIX}.${key}`);
  return val !== undefined ? (val as typeof DEFAULTS[K]) : DEFAULTS[key];
}

function set<K extends PrefKey>(key: K, value: typeof DEFAULTS[K]): void {
  (globalThis as any).Zotero?.Prefs?.set(`${PREFIX}.${key}`, value);
}

export const SCORE_THRESHOLDS: Record<string, number> = {
  Best: 0.75,
  Good: 0.60,
  Fair: 0.45,
};

export const getApiUrl = () => get('apiUrl') as string;
export const setApiUrl = (v: string) => set('apiUrl', v as typeof DEFAULTS['apiUrl']);
export const getSyncInterval = () => get('syncInterval') as number;
export const setSyncInterval = (v: number) => set('syncInterval', v as typeof DEFAULTS['syncInterval']);
export const getTheme = () => get('theme') as string;
export const setTheme = (v: string) => set('theme', v as typeof DEFAULTS['theme']);
export const getAccentColor = () => get('accentColor') as string;
export const setAccentColor = (v: string) => set('accentColor', v as typeof DEFAULTS['accentColor']);
export const getGraphNodeSize = () => get('graphNodeSize') as string;
export const getChatModel = () => get('chatModel') as string;
export const getChatMaxChunks = () => get('chatMaxChunks') as number;
export const getChatRelatedMax = () => get('chatRelatedMax') as number;
export const getChatRelatedMinLabel = () => get('chatRelatedMinLabel') as string;
export const setChatRelatedMinLabel = (v: string) => set('chatRelatedMinLabel', v as typeof DEFAULTS['chatRelatedMinLabel']);
export const getRelatedMinScore = () => SCORE_THRESHOLDS[getChatRelatedMinLabel()] ?? 0.60;
export const getChatStream = () => get('chatStream') as boolean;
export const getSyncOnStartup = () => get('syncOnStartup') as boolean;
export const getAutoSync = () => get('autoSync') as boolean;
export const getAutoCascadeDelete = () => get('autoCascadeDelete') as boolean;
export const getItemPaneHeight = () => get('itemPaneHeight') as number;
export const setItemPaneHeight = (v: number) => set('itemPaneHeight', v as typeof DEFAULTS['itemPaneHeight']);
export const getDiscoveryScoreMode = () => get('discoveryScoreMode') as 'keyword' | 'semantic';
export const setDiscoveryScoreMode = (v: 'keyword' | 'semantic') => set('discoveryScoreMode', v as typeof DEFAULTS['discoveryScoreMode']);
export const getDiscoveryMinScore = () => get('discoveryMinScore') as number;
export const setDiscoveryMinScore = (v: number) => set('discoveryMinScore', v as typeof DEFAULTS['discoveryMinScore']);
export const getDiscoveryTopK = () => get('discoveryTopK') as number;
export const setDiscoveryTopK = (v: number) => set('discoveryTopK', v as typeof DEFAULTS['discoveryTopK']);
export const getListPageSize = () => get('listPageSize') as number;
export const setListPageSize = (v: number) => set('listPageSize', v as typeof DEFAULTS['listPageSize']);
export const getCacheTtlMinutes = () => get('cacheTtlMinutes') as number;
export const setCacheTtlMinutes = (v: number) => set('cacheTtlMinutes', v as typeof DEFAULTS['cacheTtlMinutes']);
export const getTtlMs = () => getCacheTtlMinutes() * 60 * 1000;
export const getDiscoveryFontSize = () => get('discoveryFontSize') as number;
export const setDiscoveryFontSize = (v: number) => set('discoveryFontSize', v as typeof DEFAULTS['discoveryFontSize']);
export const getDiscoveryTextColor = () => get('discoveryTextColor') as string;
export const setDiscoveryTextColor = (v: string) => set('discoveryTextColor', v as typeof DEFAULTS['discoveryTextColor']);
// ── Dynamic discovery source preferences ─────────────────────────────────────
// Source names are NOT hardcoded here. The available sources are fetched from
// the server (GET /api/plugin/discovery/sources) and stored as a single JSON
// string pref so adding a new server-side source requires no plugin changes.

const DISCOVERY_SOURCES_PREF = `${PREFIX}.discovery.sourcesEnabled`;
const DISCOVERY_MIGRATED_PREF = `${PREFIX}.discovery.migrated`;

/** Shape stored in the JSON string pref. */
export type SourcePrefs = Record<string, boolean>;

export interface SourceEntry {
  key: string;
  label: string;
  enabled: boolean;
  default_enabled_in_plugin: boolean;
  description: string;
  requires_api_key: boolean;
  supported_filters: string[];
}

/** Read the current per-source toggle map from prefs. */
export function getSourcePrefs(): SourcePrefs {
  const raw = (globalThis as any).Zotero?.Prefs?.get(DISCOVERY_SOURCES_PREF, true) as string | undefined;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/** Toggle one source on or off, persisting to prefs. */
export function setSourcePref(key: string, enabled: boolean): void {
  const prefs = getSourcePrefs();
  prefs[key] = enabled;
  (globalThis as any).Zotero?.Prefs?.set(DISCOVERY_SOURCES_PREF, JSON.stringify(prefs), true);
}

/**
 * Seed defaults for any source not yet in prefs (preserves existing user choices).
 * Call after fetching the server's /sources response.
 */
export function initSourcePrefs(sources: SourceEntry[]): void {
  const current = getSourcePrefs();
  let changed = false;
  for (const source of sources) {
    if (!(source.key in current)) {
      current[source.key] = source.default_enabled_in_plugin;
      changed = true;
    }
  }
  if (changed) {
    (globalThis as any).Zotero?.Prefs?.set(DISCOVERY_SOURCES_PREF, JSON.stringify(current), true);
  }
}

/**
 * Return source keys that are both server-enabled and user-enabled.
 * Falls back to default_enabled_in_plugin if a source has no user pref yet.
 */
export function getEnabledSources(sources: SourceEntry[]): string[] {
  const prefs = getSourcePrefs();
  return sources
    .filter(s => s.enabled && (s.key in prefs ? prefs[s.key] : s.default_enabled_in_plugin))
    .map(s => s.key);
}

/**
 * One-time migration from the old three hardcoded boolean prefs to the new
 * single JSON string pref. Safe to call on every startup — runs only once
 * (guarded by a migration flag pref).
 */
export function migrateLegacySourcePrefs(): void {
  const migrated = (globalThis as any).Zotero?.Prefs?.get(DISCOVERY_MIGRATED_PREF, true);
  if (migrated) return;

  const legacy: Record<string, string> = {
    pubmed:           `${PREFIX}.discoveryPubmed`,
    semantic_scholar: `${PREFIX}.discoverySemanticScholar`,
    openalex:         `${PREFIX}.discoveryOpenAlex`,
  };

  const current = getSourcePrefs();
  for (const [sourceKey, prefKey] of Object.entries(legacy)) {
    const legacyVal = (globalThis as any).Zotero?.Prefs?.get(prefKey, true);
    if (legacyVal !== undefined && !(sourceKey in current)) {
      current[sourceKey] = Boolean(legacyVal);
    }
    try { (globalThis as any).Zotero?.Prefs?.clear(prefKey, true); } catch {}
  }

  (globalThis as any).Zotero?.Prefs?.set(DISCOVERY_SOURCES_PREF, JSON.stringify(current), true);
  (globalThis as any).Zotero?.Prefs?.set(DISCOVERY_MIGRATED_PREF, true, true);
}

export { set as setPref, get as getPref };
