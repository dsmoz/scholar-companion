// src/api/multiDocChat.ts
import { apiFetch } from './client';
import { getApiUrl } from '../prefs';
import type { Source, ChatToken } from './chat';

export interface DocMeta {
  key: string;
  title: string;
  creators: Array<{ firstName: string; lastName: string }>;
  date: string;
  item_type: string;
}

export async function fetchDocMetadata(keys: string[]): Promise<DocMeta[]> {
  try {
    return await apiFetch<DocMeta[]>('/chat/multi/metadata', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });
  } catch {
    return keys.map(key => ({ key, title: key, creators: [], date: '', item_type: '' }));
  }
}

export function streamMultiDocChat(
  zoteroKeys: string[],
  question: string,
  sessionId: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[]) => void,
  onError: (err: string) => void,
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/chat/multi/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zotero_keys: zoteroKeys, question, session_id: sessionId }),
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
