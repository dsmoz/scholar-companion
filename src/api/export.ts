// src/api/export.ts — export + summarize API for chat sessions
import { getApiUrl } from '../prefs';
import { getAuthHeaders } from './client';
import type { Message } from '../ui/components/ChatBubble';

export type ExportFormat = 'pdf' | 'docx' | 'md';

/** Download a chat session in the given format via the backend. */
export async function exportSession(
  sessionId: string,
  format: ExportFormat,
): Promise<void> {
  console.log('[AI Companion] exportSession called:', sessionId, format);
  const base = getApiUrl();
  console.log('[AI Companion] exportSession URL:', `${base}/api/plugin/chat/export`);
  try {
    const resp = await fetch(`${base}/api/plugin/chat/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_id: sessionId, format }),
    });
    console.log('[AI Companion] exportSession response:', resp.status, resp.headers.get('content-type'));
    if (!resp.ok) throw new Error(`Export failed: HTTP ${resp.status}`);
    const blob = await resp.blob();
    console.log('[AI Companion] exportSession blob:', blob.size, blob.type);
    triggerDownload(blob, `chat-${sessionId.slice(0, 12)}.${format}`);
  } catch (err) {
    console.error('[AI Companion] exportSession error:', err);
    throw err;
  }
}

/** Client-side markdown export — no backend needed. */
export function exportAsMarkdown(messages: Message[], title?: string): void {
  const lines: string[] = [];
  if (title) lines.push(`# ${title}`, '');
  lines.push(`*Exported ${new Date().toISOString().slice(0, 10)}*`, '');

  for (const m of messages) {
    const label = m.role === 'user' ? '**You**' : '**Assistant**';
    lines.push(`### ${label}`, '', m.text, '');
    if (m.sources?.length) {
      lines.push('**Sources:**', '');
      for (const s of m.sources) {
        const parts: string[] = [];
        if (s.authors) parts.push(s.authors);
        if (s.year) parts.push(`(${s.year})`);
        if (s.title) parts.push(`*${s.title}*`);
        if (s.page) parts.push(`p. ${s.page}`);
        lines.push(`- ${parts.join('. ')}`);
      }
      lines.push('');
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `chat-export-${Date.now().toString(36)}.md`);
}

/** Stream a session summary from the backend without modifying the session. */
export function streamSummarize(
  sessionId: string,
  onToken: (token: string) => void,
  onDone: (summary: string) => void,
  onError: (err: string) => void,
): () => void {
  const base = getApiUrl();
  const controller = new AbortController();

  fetch(`${base}/api/plugin/chat/summarize`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Accept': 'text/event-stream' },
    body: JSON.stringify({ session_id: sessionId }),
    signal: controller.signal,
  }).then(async resp => {
    if (!resp.ok) { onError(`HTTP ${resp.status}`); return; }
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.token) { fullText += parsed.token; onToken(parsed.token); }
          if (parsed.done) { onDone(fullText); }
        } catch { /* ignore malformed SSE */ }
      }
    }
  }).catch(err => {
    if ((err as Error).name !== 'AbortError') onError(String(err));
  });

  return () => controller.abort();
}

function triggerDownload(blob: Blob, filename: string): void {
  console.log('[AI Companion] triggerDownload:', filename, 'type:', blob.type, 'size:', blob.size);

  // Strategy 1: anchor click with blob URL (works in standard browser contexts)
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
    console.log('[AI Companion] Download triggered via anchor click');
    return;
  } catch (e) {
    console.warn('[AI Companion] Anchor download failed, trying event dispatch:', e);
  }

  // Strategy 2: dispatch to parent window for bootstrap handler
  const target = window.parent ?? window;
  blob.arrayBuffer().then(buf => {
    const isText = blob.type.startsWith('text/');
    let content: string;
    if (isText) {
      content = new TextDecoder().decode(buf);
    } else {
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      content = btoa(binary);
    }
    target.dispatchEvent(new CustomEvent('zotero-ai-command', {
      detail: {
        command: 'saveFile',
        filename,
        content,
        mimeType: blob.type,
        encoding: isText ? 'utf8' : 'base64',
      },
      bubbles: true,
    }));
  }).catch(err => console.error('[AI Companion] triggerDownload failed:', err));
}
