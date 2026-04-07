// src/ui/MultiDocChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, Article, FilePdf, FileText, Globe, Book, Newspaper, MagnifyingGlass, CircleNotch, Folder, ArrowsIn, ArrowsOut } from '@phosphor-icons/react';
import { streamMultiDocChat, fetchDocMetadata } from '../api/multiDocChat';
import type { DocMeta } from '../api/multiDocChat';
import { metadataCache } from '../api/chat';
import type { ScopeStatus } from '../api/chat';
import { RelatedDocsPanel } from './components/RelatedDocsPanel';
import { ReadingToolbar } from './components/ReadingToolbar';
import { ChatBubble } from './components/ChatBubble';
import type { Message } from './components/ChatBubble';
import { SummaryModal } from './components/SummaryModal';

interface Props {
  zoteroKeys: string[];
  initialAbstract?: string;
  initialDocs?: DocMeta[];
  scope?: { type: string; name: string; count: number };
}

function generateSessionId(keys: string[]): string {
  return 'multi_' + keys.join('_').slice(0, 32) + '_' + Date.now().toString(36);
}

function DocIcon({ itemType }: { itemType: string }) {
  const t = (itemType || '').toLowerCase();
  const style = { flexShrink: 0 };
  if (t === 'journalarticle' || t === 'preprint') return <Article size={14} weight="duotone" style={style} />;
  if (t === 'book' || t === 'booksection') return <Book size={14} weight="duotone" style={style} />;
  if (t === 'webpage' || t === 'blogpost') return <Globe size={14} weight="duotone" style={style} />;
  if (t === 'newspaperarticle' || t === 'magazinearticle') return <Newspaper size={14} weight="duotone" style={style} />;
  if (t === 'report' || t === 'thesis') return <FileText size={14} weight="duotone" style={style} />;
  return <FilePdf size={14} weight="duotone" style={style} />;
}

export function MultiDocChat({ zoteroKeys, initialDocs, scope }: Props) {
  const [docs, setDocs] = useState<DocMeta[]>(initialDocs ?? []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus | null>(null);
  const [strictScope, setStrictScope] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const sessionId = useRef(generateSessionId(zoteroKeys));
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // If initial docs were passed from Zotero, use them and populate the cache
    if (initialDocs && initialDocs.length > 0) {
      setDocs(initialDocs);
      for (const d of initialDocs) {
        metadataCache.set(d.key, { key: d.key, title: d.title, creators: d.creators, date: d.date, item_type: d.item_type });
      }
      return;
    }
    // Otherwise fetch from server
    fetchDocMetadata(zoteroKeys).then(setDocs);
  }, []);

  function sendMessage() {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setStreaming(true);
    setScopeStatus(null);
    let buffer = '';
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    cancelRef.current = streamMultiDocChat(
      zoteroKeys,
      question,
      sessionId.current,
      (token) => {
        buffer += token;
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer }]);
        bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      },
      (sources) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer, sources }]);
        setStreaming(false);
        setScopeStatus(null);
      },
      (err) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: `Error: ${err}` }]);
        setStreaming(false);
        setScopeStatus(null);
      },
      (status) => setScopeStatus(status),
      scope ? !strictScope : undefined,
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem', background: '#1e1e2e', color: '#cdd6f4' }}>
      {/* Document header */}
      <div style={{
        padding: '8px 10px', borderBottom: '1px solid #313244',
        background: '#181825', flexShrink: 0,
      }}>
        {scope ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cdd6f4', fontSize: '0.8rem' }}>
            <Folder size={18} weight="duotone" style={{ color: 'var(--accent, #89b4fa)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scope.name}
            </span>
            <span style={{ color: '#6c7086', fontSize: '0.65rem', flexShrink: 0 }}>
              {scope.count} item{scope.count !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setStrictScope(s => !s)}
              title={strictScope ? 'Only searching within this collection' : 'Can expand to your full library'}
              style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                background: strictScope ? '#313244' : 'var(--accent, #89b4fa)',
                color: strictScope ? '#6c7086' : '#1e1e2e',
                border: 'none', borderRadius: 10, padding: '2px 8px',
                fontSize: '0.6rem', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {strictScope
                ? <><ArrowsIn size={10} /> Collection only</>
                : <><ArrowsOut size={10} /> Library</>}
            </button>
          </div>
        ) : (
          <>
            <div style={{ color: '#6c7086', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Chatting with
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {docs.length > 0 ? docs.map(doc => (
                <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cdd6f4', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent, #89b4fa)' }}>
                    <DocIcon itemType={doc.item_type} />
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.title}
                  </span>
                  {doc.date && (
                    <span style={{ color: '#6c7086', fontSize: '0.65rem', flexShrink: 0 }}>
                      {doc.date.slice(0, 4)}
                    </span>
                  )}
                </div>
              )) : (
                <div style={{ color: '#6c7086', fontSize: '0.7rem' }}>Loading documents…</div>
              )}
            </div>
          </>
        )}
      </div>

      <ReadingToolbar
        sessionId={sessionId.current}
        messages={messages}
        onSummarize={() => setShowSummary(true)}
        streaming={streaming}
      />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (docs.length > 0 || scope) && (
          <div style={{ textAlign: 'center', color: '#6c7086', fontSize: '0.75rem', marginTop: '2rem' }}>
            {scope
              ? `Ask a question about the "${scope.name}" collection`
              : `Ask a question across ${docs.length} document${docs.length !== 1 ? 's' : ''}`}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} isLastMessage={i === messages.length - 1} streaming={streaming} />
        ))}
        {scopeStatus && scopeStatus.scope_status === 'expanding' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#89b4fa', fontSize: '0.65rem', padding: '2px 8px' }}>
            <CircleNotch size={12} className="spin" /> {scopeStatus.summary || 'Searching your library...'}
          </div>
        )}
        {scopeStatus && scopeStatus.scope_status === 'expanded' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a6e3a1', fontSize: '0.65rem', padding: '2px 8px' }}>
            <MagnifyingGlass size={12} /> {scopeStatus.summary}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <RelatedDocsPanel
          sourceKeys={zoteroKeys}
          context={[...messages].reverse().find(m => m.role === 'user')?.text}
          disabled={streaming}
        />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '6px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={scope ? `Ask about "${scope.name}"…` : `Ask across ${docs.length || zoteroKeys.length} document${(docs.length || zoteroKeys.length) !== 1 ? 's' : ''}…`}
          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
        />
        <button onClick={sendMessage} disabled={streaming} aria-label="Send" style={{
          background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
          padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e',
        }}>
          <PaperPlaneTilt size={14} weight="fill" />
        </button>
      </div>
      {showSummary && (
        <SummaryModal sessionId={sessionId.current} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}

