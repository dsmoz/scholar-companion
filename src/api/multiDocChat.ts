// src/api/multiDocChat.ts
import { apiFetch, getAuthHeaders } from './client';
import { getApiUrl, getChatMaxChunks, getChatModel } from '../prefs';
import type { Source, ChatToken, ScopeStatus, ItemMetadata } from './chat';
import { metadataCache } from './chat';

export interface DocMeta {
  key: string;
  title: string;
  creators: Array<{ firstName: string; lastName: string }>;
  date: string;
  item_type: string;
}

function _metaToDocMeta(m: ItemMetadata): DocMeta {
  return { key: m.key, title: m.title, creators: m.creators, date: m.date, item_type: m.item_type };
}

export async function fetchDocMetadata(keys: string[]): Promise<DocMeta[]> {
  // Check cache — only fetch keys not already cached
  const cachedMap = new Map<string, DocMeta>();
  const missing: string[] = [];
  for (const key of keys) {
    const cached = metadataCache.get(key);
    if (cached) {
      cachedMap.set(key, _metaToDocMeta(cached));
    } else {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    try {
      const fetched = await apiFetch<DocMeta[]>('/chat/multi/metadata', {
        method: 'POST',
        body: JSON.stringify({ keys: missing }),
      });
      for (const doc of fetched) {
        metadataCache.set(doc.key, { key: doc.key, title: doc.title, creators: doc.creators, date: doc.date, item_type: doc.item_type });
        cachedMap.set(doc.key, doc);
      }
    } catch {
      for (const key of missing) {
        cachedMap.set(key, { key, title: key, creators: [], date: '', item_type: '' });
      }
    }
  }

  return keys.map(k => cachedMap.get(k) ?? { key: k, title: k, creators: [], date: '', item_type: '' });
}

export function streamMultiDocChat(
  zoteroKeys: string[],
  question: string,
  sessionId: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[]) => void,
  onError: (err: string) => void,
  onScopeStatus?: (status: ScopeStatus) => void,
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/chat/multi/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Accept': 'text/event-stream' },
    body: JSON.stringify({ zotero_keys: zoteroKeys, question, session_id: sessionId, max_chunks: getChatMaxChunks(), model: getChatModel() }),
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
          if (parsed.done) onDone(parsed.sources ?? []);
        } catch { /* ignore malformed SSE */ }
      }
    }
  }).catch(err => {
    if ((err as Error).name !== 'AbortError') onError(String(err));
  });

  return () => controller.abort();
}
