// src/ui/DiscoveryPanel.tsx
import React, { useState } from 'react';
import { Plus, Check } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { StripedList } from './components/StripedList';
import { discoverySearch, DiscoveryResult } from '../api/discovery';

interface Props { seedQuery?: string; seedAuthor?: string; }

export function DiscoveryPanel({ seedQuery = '', seedAuthor = '' }: Props) {
  const [query, setQuery] = useState(seedQuery || seedAuthor);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<'pubmed' | 'semantic_scholar' | 'openalex'>('pubmed');

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await discoverySearch(query, [activeSource]);
      setResults(r);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const sourceTab = (src: typeof activeSource, label: string) => (
    <button onClick={() => setActiveSource(src)} style={{
      padding: '3px 8px', fontSize: '0.7rem', background: 'transparent', border: 'none',
      borderBottom: activeSource === src ? '2px solid var(--accent, #89b4fa)' : '2px solid transparent',
      color: activeSource === src ? 'var(--accent, #89b4fa)' : '#6c7086', cursor: 'pointer',
    }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        {sourceTab('pubmed', 'PubMed')}
        {sourceTab('semantic_scholar', 'Semantic Scholar')}
        {sourceTab('openalex', 'OpenAlex')}
      </div>
      <div style={{ padding: '6px 8px', display: 'flex', gap: 6, borderBottom: '1px solid #313244' }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
        <button onClick={search} style={{
          background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
          padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e', fontSize: '0.75rem',
        }}>Search</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {loading && <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>Searching...</div>}
        {!loading && (
          <StripedList emptyMessage={results.length === 0 && !loading ? 'No results' : ''}>
            {results.map((r, i) => (
              <div key={i} onClick={() => toggleSelect(i)} style={{
                padding: '6px 8px', cursor: 'pointer',
                borderLeft: selected.has(i) ? '3px solid var(--accent, #89b4fa)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ color: '#cdd6f4', marginBottom: 2 }}>{r.title}</div>
                    <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>
                      {r.authors.slice(0, 3).join(', ')}{r.authors.length > 3 ? ' et al.' : ''} · {r.journal} · {r.year}
                    </div>
                  </div>
                  {selected.has(i)
                    ? <Check size={14} style={{ color: 'var(--accent, #89b4fa)', flexShrink: 0 }} weight="bold" />
                    : <Plus size={14} style={{ color: '#6c7086', flexShrink: 0 }} />
                  }
                </div>
              </div>
            ))}
          </StripedList>
        )}
      </div>
      {selected.size > 0 && (
        <div style={{ padding: '6px 8px', borderTop: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6c7086', fontSize: '0.7rem' }}>{selected.size} selected</span>
          <button style={{
            background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
            padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', color: '#1e1e2e',
          }}>
            Import selected to Zotero
          </button>
        </div>
      )}
    </div>
  );
}
