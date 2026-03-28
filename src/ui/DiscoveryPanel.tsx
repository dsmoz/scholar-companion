// src/ui/DiscoveryPanel.tsx
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Check, CaretLeft, CaretRight, ClockCounterClockwise } from '@phosphor-icons/react';
import { StripedList } from './components/StripedList';
import {
  discoverySearch, DiscoveryResult, addToHistory, getValidHistory,
  cacheKey, getCached, SortKey, HistoryEntry,
} from '../api/discovery';
import { getDiscoverySources, getDiscoveryLimit, getDiscoveryPageSize } from '../prefs';

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

function resultKey(r: DiscoveryResult): string {
  return `${r.source}:${r.doi || r.pmid || r.s2_id || r.url || r.title}`;
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function DiscoveryPanel({ seedQuery = '', seedAuthor = '' }: Props) {
  const [query, setQuery] = useState(seedQuery || seedAuthor);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [filterHasDoi, setFilterHasDoi] = useState(false);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [page, setPage] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  const enabledSources = useMemo(() => getDiscoverySources().filter(s => s.enabled), []);
  const pageSize = getDiscoveryPageSize();
  const searchBarRef = useRef<HTMLDivElement>(null);

  const history = useMemo(() => getValidHistory(), [showHistory]);

  async function search(overrideQuery?: string, overrideSources?: string[], overrideLimit?: number) {
    const q = overrideQuery ?? query;
    if (!q.trim()) return;
    setLoading(true);
    setIsStale(false);
    setPage(1);
    setShowHistory(false);
    const sources = overrideSources ?? (activeSource ? [activeSource] : enabledSources.map(s => s.id));
    const limit = overrideLimit ?? getDiscoveryLimit();
    try {
      const r = await discoverySearch(q, sources, limit);
      setResults(r);
      setSelected(new Set());
      addToHistory({ query: q, sources, limit, timestamp: Date.now(), resultCount: r.length, sortBy, filterHasDoi, yearFrom, yearTo });
    } finally {
      setLoading(false);
    }
  }

  async function loadFromHistory(entry: HistoryEntry) {
    setShowHistory(false);
    setQuery(entry.query);
    setSortBy(entry.sortBy);
    setFilterHasDoi(entry.filterHasDoi);
    setYearFrom(entry.yearFrom);
    setYearTo(entry.yearTo);
    setPage(1);
    setSelected(new Set());

    const key = cacheKey(entry.query, entry.sources, entry.limit);
    const cached = getCached(key);
    if (cached) {
      setResults(cached);
      setIsStale(false);
      // Background refresh
      setIsStale(true);
      discoverySearch(entry.query, entry.sources, entry.limit)
        .then(r => { setResults(r); setIsStale(false); })
        .catch(() => setIsStale(false));
    } else {
      // No cache — full load
      setLoading(true);
      setIsStale(false);
      try {
        const r = await discoverySearch(entry.query, entry.sources, entry.limit);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }
  }

  // Filter
  const filtered = useMemo(() => {
    let r = results;
    if (activeSource) r = r.filter(x => x.source === activeSource);
    if (filterHasDoi) r = r.filter(x => !!x.doi || !!x.pmid);
    if (yearFrom) r = r.filter(x => x.year >= yearFrom);
    if (yearTo)   r = r.filter(x => x.year && x.year <= yearTo);
    return r;
  }, [results, activeSource, filterHasDoi, yearFrom, yearTo]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'year')   arr.sort((a, b) => (b.year || '0').localeCompare(a.year || '0'));
    if (sortBy === 'title')  arr.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'source') arr.sort((a, b) => a.source.localeCompare(b.source));
    return arr;
  }, [filtered, sortBy]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSelect(r: DiscoveryResult) {
    const k = resultKey(r);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  async function handleImport() {
    const toImport = sorted.filter(r => selected.has(resultKey(r)));
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

  const pill = (label: string, active: boolean, onClick: () => void, color?: string) => (
    <button onClick={onClick} style={{
      padding: '2px 10px', fontSize: '0.65rem', borderRadius: 99,
      border: active ? `1px solid ${color ?? 'var(--accent, #89b4fa)'}` : '1px solid #444',
      background: active ? `color-mix(in srgb, ${color ?? 'var(--accent, #89b4fa)'} 15%, transparent)` : 'transparent',
      color: active ? (color ?? 'var(--accent, #89b4fa)') : '#6c7086',
      cursor: 'pointer',
    }}>{label}</button>
  );

  const seg = (options: string[], value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          background: value === opt ? '#313244' : 'transparent',
          border: value === opt ? '1px solid var(--accent, #89b4fa)' : '1px solid #444',
          color: value === opt ? '#cdd6f4' : '#6c7086',
          borderRadius: 3, padding: '1px 6px', fontSize: '0.65rem', cursor: 'pointer',
        }}>{opt}</button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>

      {/* Source pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-border, #313244)', flexWrap: 'wrap' }}>
        {pill('All', activeSource === null, () => { setActiveSource(null); setPage(1); })}
        {enabledSources.map(src =>
          pill(src.label, activeSource === src.id, () => { setActiveSource(activeSource === src.id ? null : src.id); setPage(1); }, sourceColor(src.id))
        )}
        {enabledSources.length === 0 && (
          <span style={{ fontSize: '0.65rem', color: '#f38ba8' }}>No sources enabled — configure in Settings</span>
        )}
      </div>

      {/* Search bar + history dropdown */}
      <div ref={searchBarRef} style={{ position: 'relative', padding: '6px 8px', display: 'flex', gap: 6, borderBottom: '1px solid var(--color-border, #313244)' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value) setShowHistory(false); }}
          onFocus={() => { if (!query) setShowHistory(true); }}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search papers, reports, websites..."
          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
        />
        <button
          onClick={() => search()}
          disabled={loading || enabledSources.length === 0}
          style={{ background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e', fontSize: '0.75rem', opacity: loading ? 0.6 : 1 }}
        >{loading ? '...' : 'Search'}</button>

        {/* History dropdown */}
        {showHistory && history.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 8, right: 8, zIndex: 100,
            background: '#1e1e2e', border: '1px solid #313244', borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto',
          }}>
            <div style={{ padding: '4px 8px 2px', display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #313244' }}>
              <ClockCounterClockwise size={10} style={{ color: '#6c7086' }} />
              <span style={{ fontSize: '0.6rem', color: '#6c7086' }}>Recent searches</span>
            </div>
            {history.map((h, i) => (
              <div
                key={i}
                onMouseDown={() => loadFromHistory(h)}
                style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: i < history.length - 1 ? '1px solid #181825' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#313244')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ color: '#cdd6f4', fontSize: '0.75rem', marginBottom: 2 }}>{h.query}</div>
                <div style={{ color: '#6c7086', fontSize: '0.6rem' }}>
                  {h.resultCount} result{h.resultCount !== 1 ? 's' : ''} · {h.sources.join(', ')} · {timeAgo(h.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter + sort toolbar */}
      {results.length > 0 && (
        <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border, #313244)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: '#6c7086', fontSize: '0.6rem' }}>Sort:</span>
          {seg(
            ['Relevance', 'Year ↓', 'Title', 'Source'],
            sortBy === 'relevance' ? 'Relevance' : sortBy === 'year' ? 'Year ↓' : sortBy === 'title' ? 'Title' : 'Source',
            v => { setSortBy(v === 'Year ↓' ? 'year' : v.toLowerCase() as SortKey); setPage(1); }
          )}
          <div style={{ width: 1, height: 14, background: '#313244' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', color: filterHasDoi ? '#cdd6f4' : '#6c7086', cursor: 'pointer' }}>
            <input type="checkbox" checked={filterHasDoi} onChange={e => { setFilterHasDoi(e.target.checked); setPage(1); }}
              style={{ accentColor: 'var(--accent, #89b4fa)', width: 10, height: 10 }} />
            Has DOI/ID
          </label>
          <div style={{ width: 1, height: 14, background: '#313244' }} />
          <span style={{ color: '#6c7086', fontSize: '0.6rem' }}>Year:</span>
          <input value={yearFrom} onChange={e => { setYearFrom(e.target.value); setPage(1); }} placeholder="from"
            style={{ width: 42, fontSize: '0.6rem', padding: '1px 4px', background: '#313244', border: '1px solid #444', borderRadius: 3, color: '#cdd6f4' }} />
          <span style={{ color: '#6c7086', fontSize: '0.6rem' }}>–</span>
          <input value={yearTo} onChange={e => { setYearTo(e.target.value); setPage(1); }} placeholder="to"
            style={{ width: 42, fontSize: '0.6rem', padding: '1px 4px', background: '#313244', border: '1px solid #444', borderRadius: 3, color: '#cdd6f4' }} />
          <span style={{ marginLeft: 'auto', color: '#6c7086', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isStale && <span style={{ color: '#f9e2af' }}>Refreshing...</span>}
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {loading && <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>Searching...</div>}
        {!loading && (
          <StripedList emptyMessage="No results">
            {paginated.map((r) => {
              const k = resultKey(r);
              const isSelected = selected.has(k);
              return (
                <div key={k} onClick={() => toggleSelect(r)} style={{
                  padding: '6px 8px', cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid var(--accent, #89b4fa)' : `3px solid ${sourceColor(r.source)}`,
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
                    {isSelected
                      ? <Check size={14} style={{ color: 'var(--accent, #89b4fa)', flexShrink: 0 }} weight="bold" />
                      : <Plus size={14} style={{ color: '#6c7086', flexShrink: 0 }} />
                    }
                  </div>
                </div>
              );
            })}
          </StripedList>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '4px 8px', borderTop: '1px solid var(--color-border, #313244)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: 'transparent', border: 'none', color: page === 1 ? '#444' : '#cdd6f4', cursor: page === 1 ? 'default' : 'pointer', padding: 2 }}>
            <CaretLeft size={12} />
          </button>
          <span style={{ fontSize: '0.65rem', color: '#6c7086' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ background: 'transparent', border: 'none', color: page === totalPages ? '#444' : '#cdd6f4', cursor: page === totalPages ? 'default' : 'pointer', padding: 2 }}>
            <CaretRight size={12} />
          </button>
        </div>
      )}

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
