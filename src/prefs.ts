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
  discoveryPubmed: true,
  discoverySemanticScholar: true,
  discoveryOpenAlex: false,
  autoCascadeDelete: false,
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
export const getDiscoverySources = () => ({
  pubmed: get('discoveryPubmed') as boolean,
  semantic_scholar: get('discoverySemanticScholar') as boolean,
  openalex: get('discoveryOpenAlex') as boolean,
});
export { set as setPref, get as getPref };
