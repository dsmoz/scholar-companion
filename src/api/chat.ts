// src/api/chat.ts
import { getApiUrl, getChatMaxChunks } from '../prefs';

export interface ChatToken {
  token?: string;
  done?: boolean;
  sources?: Array<{ page: number; text?: string }>;
  error?: string;
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
    headers: { 'Content-Type': 'application/json' },
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
