// src/ui/ItemPaneTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, MagnifyingGlass, User, Chat, CaretUp, CaretDown, CircleNotch } from '@phosphor-icons/react';
import { streamChat, fetchItemMetadata, loadChatSession } from '../api/chat';
import type { Source, ScopeStatus } from '../api/chat';
import { similarItems, SearchResult } from '../api/search';
import { renderMarkdown, formatApaSourceText } from './utils/renderMarkdown';
import { getChatRelatedMax } from '../prefs';
import { fetchAuthorProfile, AuthorProfile } from '../api/author';
import { ScoreChip } from './components/ScoreChip';

type SubTab = 'chat' | 'similar' | 'author';
interface Message { role: 'user' | 'assistant'; text: string; sources?: Source[] }

interface Props {
  zoteroKey: string;
  title: string;
  authors: Array<{ firstName: string; lastName: string }>;
}

export function ItemPaneTab({ zoteroKey, title, authors: initialAuthors }: Props) {
  const [tab, setTab] = useState<SubTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [authorSort, setAuthorSort] = useState<'title' | 'year'>('year');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());
  const [authors, setAuthors] = useState<Array<{ firstName: string; lastName: string }>>(initialAuthors);
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (initialAuthors.length === 0) {
      fetchItemMetadata(zoteroKey).then(meta => {
        if (meta?.creators?.length) setAuthors(meta.creators);
      });
    }
  }, [zoteroKey]);

  // Restore previous chat session when item changes
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    loadChatSession(zoteroKey).then(session => {
      if (cancelled || !session?.messages?.length) return;
      setMessages(session.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.content,
        sources: m.sources,
      })));
    });
    return () => { cancelled = true; };
  }, [zoteroKey]);

  useEffect(() => {
    if (tab === 'similar') loadSimilar();
  }, [tab, zoteroKey]);

  async function loadSimilar() {
    const results = await similarItems(zoteroKey, getChatRelatedMax());
    setSimilar(results);
  }

  async function loadAuthor(name: string) {
    setSelectedAuthor(name);
    setAuthorProfile(null);
    try {
      const profile = await fetchAuthorProfile(name);
      setAuthorProfile(profile);
    } catch (err) {
      console.error('[AI Companion] fetchAuthorProfile failed:', err);
      setAuthorProfile({ author: name, items: [], coauthors: [] });
    }
  }

  function sendMessage() {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setStreaming(true);
    setScopeStatus(null);
    let buffer = '';
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    cancelRef.current = streamChat(
      zoteroKey, question,
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
      undefined,
      (status) => setScopeStatus(status),
    );
  }

  const tabBtn = (id: SubTab, icon: React.ReactNode, label: string) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? '#313244' : 'transparent',
      border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem',
      color: tab === id ? 'var(--accent, #89b4fa)' : '#6c7086',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid #313244' }}>
        {tabBtn('chat', <Chat size={12} />, 'Chat')}
        {tabBtn('similar', <MagnifyingGlass size={12} />, 'Similar')}
        {tabBtn('author', <User size={12} />, 'Author')}
      </div>

      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ textAlign: 'center', color: '#6c7086', fontSize: '0.7rem', padding: '4px 0' }}>
              Chatting with: {title}
            </div>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#313244' : '#1e1e2e',
                border: m.role === 'assistant' ? '1px solid #444' : 'none',
                borderRadius: 6, padding: '6px 10px', maxWidth: '90%', color: '#cdd6f4',
              }}>
                {m.role === 'assistant' ? (
                  // renderMarkdown runs DOMPurify.sanitize before setting innerHTML
                  <AssistantMessage html={renderMarkdown(m.text, m.sources)} />
                ) : (
                  <span>{m.text}</span>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="sources-section">
                    {(() => {
                      const primary = m.sources.filter(s => s.scope !== 'expanded');
                      const expanded = m.sources.filter(s => s.scope === 'expanded');
                      return (
                        <>
                          {primary.length > 0 && (
                            <>
                              <div className="sources-section-label">Sources</div>
                              {primary.map((s, si) => (
                                <div key={si} className="source-entry">
                                  <span className="source-entry__num">[{si + 1}]</span>
                                  {formatApaSourceText(s)}
                                </div>
                              ))}
                            </>
                          )}
                          {expanded.length > 0 && (
                            <>
                              <div className="sources-section-label" style={{ marginTop: primary.length > 0 ? 6 : 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MagnifyingGlass size={10} /> From your library
                              </div>
                              {expanded.map((s, si) => (
                                <div key={`exp-${si}`} className="source-entry" style={{ opacity: 0.85 }}>
                                  <span className="source-entry__num">[{primary.length + si + 1}]</span>
                                  {formatApaSourceText(s)}
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
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
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '6px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about this paper..."
              style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
            />
            <button onClick={sendMessage} disabled={streaming} aria-label="Send" style={{
              background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
              padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e',
            }}>
              <PaperPlaneTilt size={14} weight="fill" />
            </button>
          </div>
        </>
      )}

      {tab === 'similar' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {similar.length === 0 && <div style={{ color: '#6c7086', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>}
          {similar.map(item => (
            <div key={item.zotero_key} style={{ background: '#313244', borderRadius: 6, padding: '6px 8px' }}>
              <div style={{ color: '#cdd6f4', marginBottom: 2 }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#6c7086', fontSize: '0.65rem' }}>
                  {item.creators?.[0]?.lastName ?? ''}{item.date ? ` · ${item.date}` : ''}
                </span>
                <ScoreChip score={item.score} />
                <button
                  onClick={() => window.parent.dispatchEvent(new CustomEvent('zotero-ai-command', {
                    detail: { command: 'openSingleDocChat', keys: [item.zotero_key] },
                  }))}
                  style={{ marginLeft: 'auto', background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 3,
                           padding: '1px 6px', fontSize: '0.6rem', color: '#1e1e2e', cursor: 'pointer' }}
                >
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'author' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {!selectedAuthor ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#6c7086', fontSize: '0.7rem', marginBottom: 4 }}>Select an author:</div>
              {authors.map(a => {
                const name = `${a.firstName} ${a.lastName}`.trim();
                return (
                  <button key={name} onClick={() => loadAuthor(name)} style={{
                    background: '#313244', border: 'none', borderRadius: 6,
                    padding: '6px 8px', color: '#cdd6f4', cursor: 'pointer', textAlign: 'left',
                  }}>
                    {name}
                  </button>
                );
              })}
            </div>
          ) : !authorProfile ? (
            <div style={{ color: '#6c7086', textAlign: 'center', marginTop: '2rem', fontSize: '0.7rem' }}>Loading...</div>
          ) : (() => {
            const sortedItems = [...authorProfile.items].sort((a, b) => {
              if (authorSort === 'year') {
                const ya = (a.date || '').slice(0, 4);
                const yb = (b.date || '').slice(0, 4);
                return yb.localeCompare(ya); // newest first
              }
              return (a.title || '').localeCompare(b.title || '');
            });
            return (
              <div>
                <button onClick={() => { setSelectedAuthor(null); setAuthorProfile(null); setExpandedAbstracts(new Set()); }} style={{
                  background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)',
                  fontSize: '0.7rem', cursor: 'pointer', marginBottom: 8, padding: 0,
                }}>Back</button>
                <div style={{ fontWeight: 600, color: '#cdd6f4', marginBottom: 4 }}>{authorProfile.author}</div>
                <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 4 }}>
                  {authorProfile.items.length} papers in library
                </div>
                {authorProfile.coauthors.length > 0 && (
                  <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 6 }}>
                    Co-authors: {authorProfile.coauthors.slice(0, 5).join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {(['year', 'title'] as const).map(s => (
                    <button key={s} onClick={() => setAuthorSort(s)} style={{
                      background: authorSort === s ? '#313244' : 'transparent',
                      border: authorSort === s ? '1px solid var(--accent, #89b4fa)' : '1px solid #444',
                      color: authorSort === s ? 'var(--accent, #89b4fa)' : '#6c7086',
                      borderRadius: 4, padding: '1px 7px', fontSize: '0.6rem', cursor: 'pointer',
                    }}>{s === 'year' ? 'Year' : 'Title'}</button>
                  ))}
                </div>
                {sortedItems.map(item => {
                  const yearStr = (item.date || '').slice(0, 4);
                  const yearNum = parseInt(yearStr, 10);
                  const year = (yearNum >= 1900 && yearNum <= new Date().getFullYear()) ? yearStr : null;
                  const expanded = expandedAbstracts.has(item.key);
                  const hasAbstract = !!(item.abstract?.trim());
                  return (
                    <div key={item.key} style={{ background: '#313244', borderRadius: 4, padding: '6px 8px', marginBottom: 4 }}>
                      <div style={{ color: '#cdd6f4', fontSize: '0.75rem', marginBottom: 3 }}>
                        {item.title}{year ? <span style={{ color: '#6c7086', fontWeight: 400 }}> ({year})</span> : null}
                      </div>
                      {hasAbstract && (
                        <div style={{ marginBottom: 3 }}>
                          {expanded && (
                            <div style={{ color: '#a6adc8', fontSize: '0.65rem', marginBottom: 3, lineHeight: 1.4 }}>
                              {item.abstract}
                            </div>
                          )}
                          <button onClick={() => setExpandedAbstracts(prev => {
                            const next = new Set(prev);
                            expanded ? next.delete(item.key) : next.add(item.key);
                            return next;
                          })} style={{
                            background: 'transparent', border: 'none', color: '#6c7086',
                            fontSize: '0.6rem', cursor: 'pointer', padding: 0,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}>{expanded ? <><CaretUp size={10} /> hide abstract</> : <><CaretDown size={10} /> show abstract</>}</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => window.parent.dispatchEvent(new CustomEvent('zotero-ai-command', {
                            detail: { command: 'openSingleDocChat', keys: [item.key], abstract: item.abstract || '' },
                          }))}
                          style={{ background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 3,
                                   padding: '1px 6px', fontSize: '0.6rem', color: '#1e1e2e', cursor: 'pointer' }}
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Isolated component for DOMPurify-sanitized assistant markdown output
function AssistantMessage({ html }: { html: string }) {
  return <div className="chat-markdown" ref={(el) => { if (el) el.innerHTML = html; }} />;
}
