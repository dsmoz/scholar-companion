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
  chatStream: true,
  autoCascadeDelete: false,
  healthPageSize: 10,
  discoveryLimit: 10,
  discoveryPageSize: 10,
  discoveryHistoryTTL: 24,   // hours
  discoveryHistoryMax: 10,   // max entries
  discoveryHistory: '[]',    // JSON string of HistoryEntry[]
  // Discovery sources stored as JSON string: [{id, label, enabled}]
  discoverySources: JSON.stringify([
    { id: 'pubmed',           label: 'PubMed',           enabled: true  },
    { id: 'semantic_scholar', label: 'Semantic Scholar',  enabled: true  },
    { id: 'openalex',        label: 'OpenAlex',          enabled: false },
    { id: 'tavily',          label: 'Web (Tavily)',      enabled: false },
  ]),
} as const;

type PrefKey = keyof typeof DEFAULTS;

function get<K extends PrefKey>(key: K): typeof DEFAULTS[K] {
  const val = (globalThis as any).Zotero?.Prefs?.get(`${PREFIX}.${key}`);
  return val !== undefined ? (val as typeof DEFAULTS[K]) : DEFAULTS[key];
}

function set<K extends PrefKey>(key: K, value: typeof DEFAULTS[K]): void {
  (globalThis as any).Zotero?.Prefs?.set(`${PREFIX}.${key}`, value);
}

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
export const getChatStream = () => get('chatStream') as boolean;
export const getSyncOnStartup = () => get('syncOnStartup') as boolean;
export const getAutoSync = () => get('autoSync') as boolean;
export const getAutoCascadeDelete = () => get('autoCascadeDelete') as boolean;
export const getHealthPageSize = () => get('healthPageSize') as number;
export const getDiscoveryLimit = () => get('discoveryLimit') as number;
export const getDiscoveryPageSize = () => get('discoveryPageSize') as number;
export const getDiscoveryHistoryTTL = () => get('discoveryHistoryTTL') as number;
export const getDiscoveryHistoryMax = () => get('discoveryHistoryMax') as number;

export interface DiscoverySource {
  id: string;
  label: string;
  enabled: boolean;
}

export type SortKey = 'relevance' | 'year' | 'title' | 'source';

export interface HistoryEntry {
  query: string;
  sources: string[];
  limit: number;
  timestamp: number;
  resultCount: number;
  sortBy: SortKey;
  filterHasDoi: boolean;
  yearFrom: string;
  yearTo: string;
}

export function getDiscoverySources(): DiscoverySource[] {
  try {
    const raw = get('discoverySources') as string;
    return JSON.parse(raw) as DiscoverySource[];
  } catch {
    return [
      { id: 'pubmed',           label: 'PubMed',          enabled: true  },
      { id: 'semantic_scholar', label: 'Semantic Scholar', enabled: true  },
      { id: 'openalex',        label: 'OpenAlex',         enabled: false },
    ];
  }
}

export function setDiscoverySources(sources: DiscoverySource[]): void {
  set('discoverySources', JSON.stringify(sources) as any);
}

export function getDiscoveryHistory(): HistoryEntry[] {
  try {
    return JSON.parse(get('discoveryHistory') as string) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function setDiscoveryHistory(entries: HistoryEntry[]): void {
  set('discoveryHistory', JSON.stringify(entries) as any);
}

export { set as setPref, get as getPref };
