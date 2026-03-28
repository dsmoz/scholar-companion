// src/ui/DiscoveryPanel.tsx
import React, { useState } from 'react';
import { Plus, Check } from '@phosphor-icons/react';
import { StripedList } from './components/StripedList';
import { discoverySearch, DiscoveryResult } from '../api/discovery';
import { getDiscoverySources } from '../prefs';

interface Props { seedQuery?: string; seedAuthor?: string; }

const SOURCE_COLORS: Record<string, string> = {
  pubmed:           '#f38ba8',
  semantic_scholar: '#89b4fa',
  openalex:         '#a6e3a1',
  tavily:           '#fab387',
};

function sourceColor(id: string) {
  return SOURCE_COLORS[id] ?? '#cba6f7';
}

export function DiscoveryPanel({ seedQuery = '', seedAuthor = '' }: Props) {
  const [query, setQuery] = useState(seedQuery || seedAuthor);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  // null = All, otherwise a single source id
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const enabledSources = getDiscoverySources().filter(s => s.enabled);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const sources = activeSource ? [activeSource] : enabledSources.map(s => s.id);
      const r = await discoverySearch(query, sources);
      setResults(r);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    const toImport = results.filter((_, i) => selected.has(i));
    setImporting(true);
    try {
      const { importToZotero } = await import('../api/import');
      const outcomes = await importToZotero(toImport);
      const failed = outcomes.filter(o => !o.success);
      if (failed.length === 0) {
        window.alert(`Imported ${outcomes.length} item(s) to Zotero.`);
      } else {
        window.alert(
          `Imported ${outcomes.length - failed.length} item(s).\n` +
          `Failed: ${failed.map(f => f.title).join(', ')}`
        );
      }
      setSelected(new Set());
    } catch (e: any) {
      window.alert(`Import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>

      {/* Source selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-border, #313244)', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSource(null)}
          style={{
            padding: '2px 10px', fontSize: '0.65rem', borderRadius: 99,
            border: activeSource === null ? '1px solid var(--accent, #89b4fa)' : '1px solid #444',
            background: activeSource === null ? 'color-mix(in srgb, var(--accent, #89b4fa) 15%, transparent)' : 'transparent',
            color: activeSource === null ? 'var(--accent, #89b4fa)' : '#6c7086',
            cursor: 'pointer',
          }}
        >All</button>
        {enabledSources.map(src => (
          <button
            key={src.id}
            onClick={() => setActiveSource(activeSource === src.id ? null : src.id)}
            style={{
              padding: '2px 10px', fontSize: '0.65rem', borderRadius: 99,
              border: activeSource === src.id ? `1px solid ${sourceColor(src.id)}` : '1px solid #444',
              background: activeSource === src.id ? `color-mix(in srgb, ${sourceColor(src.id)} 15%, transparent)` : 'transparent',
              color: activeSource === src.id ? sourceColor(src.id) : '#6c7086',
              cursor: 'pointer',
            }}
          >{src.label}</button>
        ))}
        {enabledSources.length === 0 && (
          <span style={{ fontSize: '0.65rem', color: '#f38ba8' }}>No sources enabled — configure in Settings</span>
        )}
      </div>

      {/* Search bar */}
      <div style={{ padding: '6px 8px', display: 'flex', gap: 6, borderBottom: '1px solid var(--color-border, #313244)' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search papers, reports, websites..."
          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
        />
        <button
          onClick={search}
          disabled={loading || enabledSources.length === 0}
          style={{ background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e', fontSize: '0.75rem', opacity: loading ? 0.6 : 1 }}
        >{loading ? '...' : 'Search'}</button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {loading && <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>Searching...</div>}
        {!loading && (
          <StripedList emptyMessage="No results">
            {results.map((r, i) => (
              <div key={i} onClick={() => toggleSelect(i)} style={{
                padding: '6px 8px', cursor: 'pointer',
                borderLeft: selected.has(i) ? '3px solid var(--accent, #89b4fa)' : `3px solid ${sourceColor(r.source)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ color: '#cdd6f4', marginBottom: 2 }}>{r.title}</div>
                    {r.url
                      ? <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 2 }}>{r.url}</div>
                      : <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>
                          {r.authors.slice(0, 3).join(', ')}{r.authors.length > 3 ? ' et al.' : ''}{r.journal ? ` · ${r.journal}` : ''}{r.year ? ` · ${r.year}` : ''}
                        </div>
                    }
                    {r.snippet && (
                      <div style={{ color: '#6c7086', fontSize: '0.6rem', marginBottom: 2, fontStyle: 'italic' }}>
                        {r.snippet.length > 120 ? r.snippet.slice(0, 120) + '…' : r.snippet}
                      </div>
                    )}
                    <div style={{ marginTop: 2 }}>
                      <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 99, background: `color-mix(in srgb, ${sourceColor(r.source)} 15%, transparent)`, color: sourceColor(r.source) }}>
                        {r.source.replace('_', ' ')}
                      </span>
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

      {/* Import footer */}
      {selected.size > 0 && (
        <div style={{ padding: '6px 8px', borderTop: '1px solid var(--color-border, #313244)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6c7086', fontSize: '0.7rem' }}>{selected.size} selected</span>
          <button
            onClick={handleImport}
            disabled={importing}
            style={{ background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', color: '#1e1e2e', opacity: importing ? 0.6 : 1 }}
          >
            {importing ? 'Importing...' : `Import ${selected.size} to Zotero`}
          </button>
        </div>
      )}
    </div>
  );
}
