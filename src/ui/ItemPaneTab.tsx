// src/ui/ItemPaneTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, MagnifyingGlass, User, Chat } from '@phosphor-icons/react';
import { streamChat } from '../api/chat';
import { similarItems, SearchResult } from '../api/search';
import { fetchAuthorProfile, AuthorProfile } from '../api/author';
import { ScoreChip } from './components/ScoreChip';

type SubTab = 'chat' | 'similar' | 'author';
interface Message { role: 'user' | 'assistant'; text: string; sources?: Array<{ page: number }> }

interface Props {
  zoteroKey: string;
  title: string;
  authors: Array<{ firstName: string; lastName: string }>;
}

export function ItemPaneTab({ zoteroKey, title, authors }: Props) {
  const [tab, setTab] = useState<SubTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (tab === 'similar') loadSimilar();
  }, [tab, zoteroKey]);

  async function loadSimilar() {
    const results = await similarItems(zoteroKey);
    setSimilar(results);
  }

  async function loadAuthor(name: string) {
    setSelectedAuthor(name);
    const profile = await fetchAuthorProfile(name);
    setAuthorProfile(profile);
  }

  function sendMessage() {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setStreaming(true);
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
      },
      (err) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: `Error: ${err}` }]);
        setStreaming(false);
      },
      undefined
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
                {m.text}
                {m.sources && m.sources.length > 0 && (
                  <div style={{ color: '#6c7086', fontSize: '0.65rem', marginTop: 4 }}>
                    p.{m.sources.map(s => s.page).join(', ')} · {m.sources.length} chunk{m.sources.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
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
                <span style={{ marginLeft: 'auto', color: 'var(--accent, #89b4fa)', fontSize: '0.65rem', cursor: 'pointer' }}>
                  open
                </span>
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
          ) : authorProfile ? (
            <div>
              <button onClick={() => { setSelectedAuthor(null); setAuthorProfile(null); }} style={{
                background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)',
                fontSize: '0.7rem', cursor: 'pointer', marginBottom: 8, padding: 0,
              }}>Back</button>
              <div style={{ fontWeight: 600, color: '#cdd6f4', marginBottom: 4 }}>{authorProfile.author}</div>
              <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 8 }}>
                {authorProfile.items.length} papers in library
              </div>
              {authorProfile.coauthors.length > 0 && (
                <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 8 }}>
                  Co-authors: {authorProfile.coauthors.slice(0, 5).join(', ')}
                </div>
              )}
              {authorProfile.items.map(item => (
                <div key={item.key} style={{ background: '#313244', borderRadius: 4, padding: '4px 8px', marginBottom: 4 }}>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{item.title}</div>
                  <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>{item.date}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
