// src/api/chat.ts
import { getApiUrl, getChatMaxChunks } from '../prefs';
import { getAuthHeaders } from './client';

export interface Source {
  page?: number;
  text?: string;
  zotero_key?: string;
  title?: string;
  year?: string;
  authors?: string;
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

export async function loadChatSession(zoteroKey: string): Promise<ChatSession | null> {
  try {
    return await (await import('./client')).apiFetch<ChatSession>(`/chat/sessions/${zoteroKey}`);
  } catch { return null; }
}

export async function clearChatSession(zoteroKey: string): Promise<void> {
  try {
    await (await import('./client')).apiFetch(`/chat/sessions/${zoteroKey}`, { method: 'DELETE' });
  } catch { /* ignore */ }
}

export interface ChatToken {
  token?: string;
  done?: boolean;
  sources?: Array<{ page: number; text?: string }>;
  error?: string;
}

export interface ItemMetadata {
  key: string;
  title: string;
  creators: Array<{ firstName: string; lastName: string }>;
  date: string;
  item_type: string;
}

export async function fetchItemMetadata(zoteroKey: string): Promise<ItemMetadata | null> {
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
    // creators may be strings or {firstName, lastName} dicts
    const creators = (item.creators ?? []).map((c: any) => {
      if (typeof c === 'string') {
        const parts = c.split(' ');
        return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] ?? '' };
      }
      return { firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '' };
    });
    return { key: item.key, title: item.title, creators, date: item.date, item_type: item.item_type };
  } catch { return null; }
}

export function streamChat(
  zoteroKey: string,
  question: string,
  onToken: (token: string) => void,
  onDone: (sources: ChatToken['sources']) => void,
  onError: (err: string) => void,
  maxChunks?: number
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/chat/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      zotero_key: zoteroKey,
      question,
      max_chunks: maxChunks ?? getChatMaxChunks(),
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
          if (parsed.token) onToken(parsed.token);
          if (parsed.done) onDone(parsed.sources ?? []);
        } catch { /* ignore malformed SSE */ }
      }
    }
  }).catch(err => {
    if ((err as Error).name !== 'AbortError') onError(String(err));
  });

  return () => controller.abort();
}
