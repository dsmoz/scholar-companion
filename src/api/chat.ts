// src/api/chat.ts
import { getApiUrl, getChatMaxChunks, getChatModel, getTtlMs } from '../prefs';
import { getAuthHeaders } from './client';
import { TTLCache } from './apiCache';

export interface Source {
  page?: number;
  text?: string;
  zotero_key?: string;
  title?: string;
  year?: string;
  authors?: string;
  scope?: 'primary' | 'expanded';
}

export interface ScopeStatus {
  scope_status: 'expanding' | 'expanded' | 'primary_only';
  summary?: string;
  expanded_count?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatModelEntry {
  id: string;
  name: string;
  provider: string;
  tier: string;
}

const FALLBACK_MODELS: ChatModelEntry[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'OpenRouter', tier: 'fast' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'OpenRouter', tier: 'fastest' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'OpenRouter', tier: 'fast' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'OpenRouter', tier: 'balanced' },
];

// ── Caches ──────────────────────────────────────────────────────────────────
export const metadataCache = new TTLCache<string, ItemMetadata>(() => getTtlMs());
const sessionCache = new TTLCache<string, ChatSession>(() => 5 * 60 * 1000);
let _modelsCache: ChatModelEntry[] | null = null;

export function clearAllChatCaches(): void {
  metadataCache.clear();
  sessionCache.clear();
  _modelsCache = null;
}

export async function fetchChatModels(): Promise<ChatModelEntry[]> {
  if (_modelsCache) return _modelsCache;
  try {
    const models = await (await import('./client')).apiFetch<ChatModelEntry[]>('/chat/models');
    _modelsCache = models.length > 0 ? models : FALLBACK_MODELS;
    return _modelsCache;
  } catch { return FALLBACK_MODELS; }
}

export async function loadChatSession(zoteroKey: string): Promise<ChatSession | null> {
  const cached = sessionCache.get(zoteroKey);
  if (cached) return cached;
  try {
    const session = await (await import('./client')).apiFetch<ChatSession>(`/chat/sessions/${zoteroKey}`);
    if (session) sessionCache.set(zoteroKey, session);
    return session;
  } catch { return null; }
}

export function invalidateSession(zoteroKey: string): void {
  sessionCache.clear();  // clear all — session may be keyed differently
}

export async function clearChatSession(zoteroKey: string): Promise<void> {
  sessionCache.clear();
  try {
    await (await import('./client')).apiFetch(`/chat/sessions/${zoteroKey}`, { method: 'DELETE' });
  } catch { /* ignore */ }
}

export interface ChatToken {
  token?: string;
  done?: boolean;
  sources?: Array<{ page: number; text?: string }>;
  error?: string;
  scope_status?: 'expanding' | 'expanded' | 'primary_only';
  summary?: string;
  expanded_count?: number;
}

export interface ItemMetadata {
  key: string;
  title: string;
  creators: Array<{ firstName: string; lastName: string }>;
  date: string;
  item_type: string;
}

export async function fetchItemMetadata(zoteroKey: string): Promise<ItemMetadata | null> {
  const cached = metadataCache.get(zoteroKey);
  if (cached) return cached;
  const base = getApiUrl();
  try {
    const resp = await fetch(`${base}/api/plugin/chat/multi/metadata`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ keys: [zoteroKey] }),
    });
    if (!resp.ok) return null;
    const data: Array<{ key: string; title: string; creators: any[]; date: string; item_type: string }> = await resp.json();
    if (!data.length) return null;
    const item = data[0];
    const creators = (item.creators ?? []).map((c: any) => {
      if (typeof c === 'string') {
        const parts = c.split(' ');
        return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] ?? '' };
      }
      return { firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '' };
    });
    const meta = { key: item.key, title: item.title, creators, date: item.date, item_type: item.item_type };
    metadataCache.set(zoteroKey, meta);
    return meta;
  } catch { return null; }
}

export function streamChat(
  zoteroKey: string,
  question: string,
  onToken: (token: string) => void,
  onDone: (sources: ChatToken['sources']) => void,
  onError: (err: string) => void,
  maxChunks?: number,
  onScopeStatus?: (status: ScopeStatus) => void,
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/chat/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Accept': 'text/event-stream' },
    body: JSON.stringify({
      zotero_key: zoteroKey,
      question,
      max_chunks: maxChunks ?? getChatMaxChunks(),
      model: getChatModel(),
    }),
    signal: controller.signal,
  }).then(async resp => {
    if (!resp.ok) { onError(`HTTP ${resp.status}`); return; }
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed: ChatToken = JSON.parse(line.slice(6));
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.scope_status && onScopeStatus) {
            onScopeStatus({ scope_status: parsed.scope_status, summary: parsed.summary, expanded_count: parsed.expanded_count });
            continue;
          }
          if (parsed.token) onToken(parsed.token);
          if (parsed.done) {
            invalidateSession(zoteroKey);
            onDone(parsed.sources ?? []);
          }
        } catch { /* ignore malformed SSE */ }
      }
    }
  }).catch(err => {
    if ((err as Error).name !== 'AbortError') onError(String(err));
  });

  return () => controller.abort();
}
