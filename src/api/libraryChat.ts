// src/api/libraryChat.ts
import { apiFetch } from './client';
import { getApiUrl } from '../prefs';
import type { Source, ChatSession, ChatToken } from './chat';

export function streamLibraryChat(
  question: string,
  sessionId: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[]) => void,
  onError: (err: string) => void,
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/library/chat/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId }),
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

export interface LibrarySessionSummary {
  id: string;
  title: string;
  updated_at: string;
}

export async function listLibrarySessions(): Promise<LibrarySessionSummary[]> {
  try {
    return await apiFetch<LibrarySessionSummary[]>('/library/chat/sessions');
  } catch {
    return [];
  }
}

export async function loadLibrarySession(sessionId: string): Promise<ChatSession | null> {
  try {
    const data = await apiFetch<ChatSession>(`/library/chat/sessions/${sessionId}`);
    return data && data.id ? data : null;
  } catch {
    return null;
  }
}
