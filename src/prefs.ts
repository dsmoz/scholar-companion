// src/prefs.ts
const PREFIX = 'extensions.scholar-companion';

const DEFAULTS = {
  apiUrl: 'https://mcp.dsmozconsultancy.com',
  apiToken: '',
  clientId: '',
  userId: '',
  displayName: '',
  syncInterval: 12,
  syncOnStartup: true,
  autoSync: true,
  theme: 'auto',
  accentColor: 'blue',
  graphNodeSize: 'M',
  chatModel: 'google/gemini-2.5-flash',
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

function _prefBranch(): any {
  // Use Mozilla's native pref service — persists across sessions and works in all contexts.
  // Try multiple paths: globalThis.Services (bootstrap sandbox), window-level Services
  // (chrome panels), and Components.classes fallback (XUL dialogs).
  try {
    const svc = (globalThis as any).Services
      ?? (typeof window !== 'undefined' && (window as any).Services)
      ?? (typeof Components !== 'undefined' && (Components as any).classes?.['@mozilla.org/preferences-service;1']
          ?.getService((Components as any).interfaces.nsIPrefService));
    if (svc?.prefs) return svc.prefs.getBranch('');
    if (svc?.getBranch) return svc.getBranch('');
  } catch { /* not available */ }
  return null;
}

function get<K extends PrefKey>(key: K): typeof DEFAULTS[K] {
  const branch = _prefBranch();
  if (!branch) return DEFAULTS[key];
  const fullKey = `${PREFIX}.${key}`;
  try {
    const type = branch.getPrefType(fullKey);
    if (type === branch.PREF_STRING) return branch.getStringPref(fullKey) as typeof DEFAULTS[K];
    if (type === branch.PREF_INT) return branch.getIntPref(fullKey) as typeof DEFAULTS[K];
    if (type === branch.PREF_BOOL) return branch.getBoolPref(fullKey) as typeof DEFAULTS[K];
  } catch { /* pref doesn't exist */ }
  return DEFAULTS[key];
}

function set<K extends PrefKey>(key: K, value: typeof DEFAULTS[K]): void {
  const branch = _prefBranch();
  if (!branch) return;
  const fullKey = `${PREFIX}.${key}`;
  if (typeof value === 'string') branch.setStringPref(fullKey, value);
  else if (typeof value === 'number') branch.setIntPref(fullKey, value);
  else if (typeof value === 'boolean') branch.setBoolPref(fullKey, value);
}

export const SCORE_THRESHOLDS: Record<string, number> = {
  Best: 0.40,
  Good: 0.25,
  Fair: 0.15,
};

export const getApiUrl = () => get('apiUrl') as string;
export const setApiUrl = (v: string) => set('apiUrl', v as typeof DEFAULTS['apiUrl']);
export const getApiToken = () => get('apiToken') as string;
export const setApiToken = (v: string) => set('apiToken', v as typeof DEFAULTS['apiToken']);
export const getClientId = () => get('clientId') as string;
export const setClientId = (v: string) => set('clientId', v as typeof DEFAULTS['clientId']);
// userId is persisted from /portal/api/login for future multi-tenant routing
// (e.g. X-User-Id header) and debugging. The server currently resolves the
// tenant from the bearer token, so read-sites may not exist yet.
export const getUserId = () => get('userId') as string;
export const setUserId = (v: string) => set('userId', v as typeof DEFAULTS['userId']);
export const getDisplayName = () => get('displayName') as string;
export const setDisplayName = (v: string) => set('displayName', v as typeof DEFAULTS['displayName']);
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
// Bump this when default_enabled_in_plugin changes for any source so that
// existing users get the new defaults applied on next Zotero start.
const DISCOVERY_SOURCES_VERSION = 3;
const DISCOVERY_SOURCES_VERSION_PREF = `${PREFIX}.discovery.sourcesVersion`;

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
  const Z = (globalThis as any).Zotero;
  const current = getSourcePrefs();
  let changed = false;

  // Version bump: re-apply defaults for any source where default changed to true
  const storedVersion = (Z?.Prefs?.get(DISCOVERY_SOURCES_VERSION_PREF, true) as number | undefined) ?? 0;
  if (storedVersion < DISCOVERY_SOURCES_VERSION) {
    for (const source of sources) {
      if (source.default_enabled_in_plugin && !current[source.key]) {
        current[source.key] = true;
        changed = true;
      }
    }
    Z?.Prefs?.set(DISCOVERY_SOURCES_VERSION_PREF, DISCOVERY_SOURCES_VERSION, true);
  }

  // Seed defaults for any brand-new source not yet in prefs
  for (const source of sources) {
    if (!(source.key in current)) {
      current[source.key] = source.default_enabled_in_plugin;
      changed = true;
    }
  }

  if (changed) {
    Z?.Prefs?.set(DISCOVERY_SOURCES_PREF, JSON.stringify(current), true);
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
