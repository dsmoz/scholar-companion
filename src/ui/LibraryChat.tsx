// src/ui/LibraryChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, Plus } from '@phosphor-icons/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { streamLibraryChat, listLibrarySessions, loadLibrarySession } from '../api/libraryChat';
import type { LibrarySessionSummary } from '../api/libraryChat';
import type { Source } from '../api/chat';
import { RelatedDocsPanel } from './components/RelatedDocsPanel';

interface Message { role: 'user' | 'assistant'; text: string; sources?: Source[] }

// All assistant text is sanitized with DOMPurify before rendering
function renderMarkdown(text: string): string {
  const html = DOMPurify.sanitize(marked.parse(text) as string);
  return html.replace(/\[(\d+)\]/g, '<sup class="citation-ref">[$1]</sup>');
}

function formatApaSource(s: Source, index: number): string {
  const parts: string[] = [];
  if (s.authors) parts.push(s.authors + '.');
  if (s.year) parts.push(`(${s.year}).`);
  if (s.title) parts.push(s.title + '.');
  return `[${index + 1}] ${parts.join(' ')}`;
}

function generateSessionId(): string {
  return 'library_' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function LibraryChat() {
  const [sessions, setSessions] = useState<LibrarySessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    listLibrarySessions().then(setSessions);
    newChat();
  }, []);

  function newChat() {
    setActiveSessionId(generateSessionId());
    setMessages([]);
    setLastQuery('');
  }

  async function selectSession(id: string) {
    setActiveSessionId(id);
    setLastQuery('');
    const session = await loadLibrarySession(id);
    if (session && session.messages.length > 0) {
      setMessages(session.messages.map(m => ({
        role: m.role,
        text: m.content,
        sources: m.sources,
      })));
    } else {
      setMessages([]);
    }
  }

  function sendMessage() {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setLastQuery(question);
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setStreaming(true);
    let buffer = '';
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    cancelRef.current = streamLibraryChat(
      question,
      activeSessionId,
      (token) => {
        buffer += token;
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer }]);
        bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      },
      (sources) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer, sources }]);
        setStreaming(false);
        // Refresh session list
        listLibrarySessions().then(setSessions);
      },
      (err) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: `Error: ${err}` }]);
        setStreaming(false);
      },
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontSize: '0.8rem', background: '#1e1e2e', color: '#cdd6f4' }}>
      {/* Sessions sidebar */}
      <div style={{ width: 180, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6c7086', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</span>
          <button onClick={newChat} title="New chat" style={{
            background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)',
            cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center',
          }}>
            <Plus size={12} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(s => (
            <button key={s.id} onClick={() => selectSession(s.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: s.id === activeSessionId ? '#313244' : 'transparent',
              border: 'none', borderBottom: '1px solid #1e1e2e',
              padding: '6px 8px', cursor: 'pointer',
              color: s.id === activeSessionId ? 'var(--accent, #89b4fa)' : '#cdd6f4',
            }}>
              <div style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title || 'Chat'}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#6c7086', marginTop: 1 }}>
                {s.updated_at ? s.updated_at.slice(0, 10) : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#6c7086', fontSize: '0.75rem', marginTop: '3rem' }}>
              Ask anything about your library
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? '#313244' : '#1e1e2e',
              border: m.role === 'assistant' ? '1px solid #444' : 'none',
              borderRadius: 6, padding: '6px 10px', maxWidth: '90%', color: '#cdd6f4',
            }}>
              {m.role === 'assistant' ? (
                <AssistantMessage html={renderMarkdown(m.text)} />
              ) : (
                <span>{m.text}</span>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="sources-section">
                  <div className="sources-section-label">Sources</div>
                  {m.sources.map((s, si) => (
                    <div key={si} className="source-entry">{formatApaSource(s, si)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {lastQuery && <RelatedDocsPanel query={lastQuery} />}
        <div style={{ padding: '6px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your library..."
            style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
          />
          <button onClick={sendMessage} disabled={streaming} aria-label="Send" style={{
            background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
            padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e',
          }}>
            <PaperPlaneTilt size={14} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Isolated component for DOMPurify-sanitized assistant markdown output
function AssistantMessage({ html }: { html: string }) {
  return <div className="chat-markdown" ref={(el) => { if (el) el.innerHTML = html; }} />;
}
