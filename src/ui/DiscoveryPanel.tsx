// src/ui/DiscoveryPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Funnel, X, CaretLeft, CaretRight, Clock, Trash, Article, FilePdf, Video, Globe } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import {
  discoverySearch,
  fetchDiscoverySources,
  fetchSearchHistory,
  clearSearchHistory,
  type DiscoveryResult,
  type DiscoveryFilters,
  type SourceEntry,
  type SearchHistoryEntry,
} from '../api/discovery';
import {
  getEnabledSources,
  getDiscoveryScoreMode,
  getDiscoveryMinScore,
  getDiscoveryTopK,
  getListPageSize,
  getDiscoveryFontSize,
  setDiscoveryFontSize,
  getDiscoveryTextColor,
  setDiscoveryTextColor,
} from '../prefs';
import { importToZotero } from '../api/import';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

interface Props { seedQuery?: string; seedAuthor?: string; }

const PUBLICATION_TYPES = [
  { value: 'article',          label: 'Article' },
  { value: 'review',           label: 'Review' },
  { value: 'meta_analysis',    label: 'Meta-analysis' },
  { value: 'clinical_trial',   label: 'Clinical trial' },
  { value: 'preprint',         label: 'Preprint' },
  { value: 'report',           label: 'Report' },
  { value: 'guideline',        label: 'Guideline' },
  { value: 'policy_brief',     label: 'Policy brief' },
  { value: 'working_paper',    label: 'Working paper' },
  { value: 'assessment',       label: 'Assessment' },
  { value: 'situation_report', label: 'Sitrep' },
  { value: 'impact_evaluation',label: 'Impact evaluation' },
  { value: 'evidence_gap_map', label: 'Evidence gap map' },
];

/** Derive a display type from the result for icon + tooltip purposes. */
function getItemDisplayType(r: DiscoveryResult): 'article' | 'pdf' | 'video' | 'webpage' {
  if (r.item_type === 'videoRecording') return 'video';
  if (r.item_type === 'report') return 'pdf';
  if (r.item_type === 'webpage') return 'webpage';
  return 'article';
}

function ItemTypeIcon({ type }: { type: 'article' | 'pdf' | 'video' | 'webpage' }) {
  if (type === 'pdf')     return <FilePdf size={14} color="#f38ba8" style={{ flexShrink: 0, marginTop: 1 }} />;
  if (type === 'video')   return <Video    size={14} color="#cba6f7" style={{ flexShrink: 0, marginTop: 1 }} />;
  if (type === 'webpage') return <Globe    size={14} color="#89dceb" style={{ flexShrink: 0, marginTop: 1 }} />;
  return                         <Article  size={14} color="#6c7086" style={{ flexShrink: 0, marginTop: 1 }} />;
}

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 60 ? '#a6e3a1' : pct >= 35 ? '#f9e2af' : '#f38ba8';
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 600, color: '#1e1e2e',
      background: color, borderRadius: 4, padding: '1px 5px', flexShrink: 0,
    }}>
      {pct}%
    </span>
  );
}

export function DiscoveryPanel({ seedQuery = '', seedAuthor = '' }: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [query, setQuery] = useState(seedQuery || seedAuthor);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = getListPageSize();
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<number>>(new Set());
  const [fontSize, setFontSizeState] = useState(() => getDiscoveryFontSize());
  const [textColor, setTextColorState] = useState(() => getDiscoveryTextColor());
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function broadcast(fs: number, tc: string) {
    const xulWin = window.top ?? window;
    const target = ((xulWin as any).opener ?? xulWin) as Window;
    target.dispatchEvent(new CustomEvent('zotero-ai-command', {
      detail: { command: 'applyReadingPrefs', fontSize: fs, textColor: tc },
      bubbles: true,
    }));
  }

  function changeFontSize(v: number) {
    setFontSizeState(v);
    setDiscoveryFontSize(v);
    document.documentElement.style.setProperty('--reading-font-size', `${v}px`);
    broadcast(v, textColor);
  }

  function changeTextColor(v: string) {
    setTextColorState(v);
    setDiscoveryTextColor(v);
    document.documentElement.style.setProperty('--reading-text-color', v);
    broadcast(fontSize, v);
  }

  async function handleImport() {
    const toImport = results.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const { imported, duplicates, failed } = await importToZotero(toImport);
      let msg = `${imported} imported`;
      if (duplicates) msg += ` (${duplicates} already in library)`;
      if (failed) msg += `, ${failed} failed`;
      setImportMsg(msg);
      setSelected(new Set());
    } catch (e: any) {
      setImportMsg(`Import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  function toggleAbstract(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    setExpandedAbstracts(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  // History tab state
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Sources — loaded dynamically from server
  const [allSources, setAllSources] = useState<SourceEntry[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);

  // Filters panel
  const [showFilters, setShowFilters] = useState(false);
  const [openAccess, setOpenAccess] = useState(false);
  const [hasFulltext, setHasFulltext] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  // Load sources on mount
  useEffect(() => {
    fetchDiscoverySources().then(sources => {
      setAllSources(sources);
      // Default active = user-enabled sources
      setActiveSources(getEnabledSources(sources));
    }).catch(() => {});
  }, []);

  function toggleSource(key: string) {
    setActiveSources(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function toggleType(value: string) {
    setSelectedTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function clearFilters() {
    setOpenAccess(false);
    setHasFulltext(false);
    setSelectedTypes([]);
    setLanguage('');
    setYearFrom('');
    setYearTo('');
  }

  const activeFilterCount = [
    openAccess, hasFulltext,
    selectedTypes.length > 0,
    !!language, !!yearFrom, !!yearTo,
  ].filter(Boolean).length;

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await fetchSearchHistory(50));
    } catch (e: any) {
      setHistoryError(e?.message ?? 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleClearHistory() {
    await clearSearchHistory();
    setHistory([]);
  }

  function rerunHistoryItem(entry: SearchHistoryEntry) {
    setQuery(entry.query);
    if (entry.sources.length > 0) setActiveSources(entry.sources);
    if (entry.filters) {
      setOpenAccess(entry.filters.is_open_access ?? false);
      setHasFulltext(entry.filters.has_fulltext ?? false);
      setSelectedTypes(entry.filters.publication_type ?? []);
      setLanguage(entry.filters.language ?? '');
    }
    setActiveTab('search');
    setTimeout(() => search(), 0);
  }

  async function search() {
    if (!query.trim() || activeSources.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const filters: DiscoveryFilters = {};
      if (openAccess)              filters.is_open_access = true;
      if (hasFulltext)             filters.has_fulltext = true;
      if (selectedTypes.length)    filters.publication_type = selectedTypes;
      if (language.trim())         filters.language = language.trim();

      const r = await discoverySearch(
        query,
        activeSources,
        Object.keys(filters).length ? filters : undefined,
        yearFrom ? parseInt(yearFrom) : undefined,
        yearTo   ? parseInt(yearTo)   : undefined,
        getDiscoveryScoreMode(),
        getDiscoveryMinScore(),
        getDiscoveryTopK(),
      );
      setResults(r);
      setSelected(new Set());
      setExpandedAbstracts(new Set());
      setPage(0);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(results.length / pageSize);
  const pageResults = results.slice(page * pageSize, (page + 1) * pageSize);
  // Map page-local indices back to global indices for the selected set
  const pageOffset = page * pageSize;

  function goToPage(p: number) {
    setPage(p);
    resultsTopRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{
      fontSize: '0.65rem', padding: '2px 7px', borderRadius: 10, cursor: 'pointer',
      background: active ? 'var(--accent, #89b4fa)' : '#313244',
      color: active ? '#1e1e2e' : '#6c7086',
      border: active ? 'none' : '1px solid #45475a',
    }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>

      {/* Top-level tab bar: Search | History */}
      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        <button onClick={() => setActiveTab('search')} style={{
          flex: 1, padding: '5px 0', fontSize: '0.7rem', background: 'transparent', border: 'none',
          borderBottom: activeTab === 'search' ? '2px solid var(--accent, #89b4fa)' : '2px solid transparent',
          color: activeTab === 'search' ? 'var(--accent, #89b4fa)' : '#6c7086',
          cursor: 'pointer',
        }}>Search</button>
        <button onClick={() => { setActiveTab('history'); loadHistory(); }} style={{
          flex: 1, padding: '5px 0', fontSize: '0.7rem', background: 'transparent', border: 'none',
          borderBottom: activeTab === 'history' ? '2px solid var(--accent, #89b4fa)' : '2px solid transparent',
          color: activeTab === 'history' ? 'var(--accent, #89b4fa)' : '#6c7086',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}><Clock size={11} /> History</button>
      </div>

      {/* ── History tab ────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #313244' }}>
            <span style={{ color: '#6c7086', fontSize: '0.65rem' }}>
              {history.length} recent search{history.length !== 1 ? 'es' : ''}
            </span>
            {history.length > 0 && (
              <button onClick={handleClearHistory} style={{
                display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem',
                color: '#f38ba8', background: 'transparent', border: 'none', cursor: 'pointer',
              }}><Trash size={11} /> Clear all</button>
            )}
          </div>
          {historyLoading && (
            <div style={{ color: '#6c7086', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>Loading…</div>
          )}
          {historyError && (
            <div style={{ color: '#f38ba8', fontSize: '0.75rem', padding: '6px 8px' }}>{historyError}</div>
          )}
          {!historyLoading && !historyError && history.length === 0 && (
            <div style={{ color: '#6c7086', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>No search history yet</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0.5rem' }}>
            {history.map(entry => (
              <div key={entry.id} onClick={() => rerunHistoryItem(entry)} style={{
                background: '#313244', borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                border: '1px solid transparent',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent, #89b4fa)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
              >
                <div style={{ color: '#cdd6f4', marginBottom: 2 }}>{entry.query}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {entry.sources.map(s => (
                    <span key={s} style={{ fontSize: '0.6rem', color: '#6c7086', background: '#1e1e2e', borderRadius: 3, padding: '1px 4px' }}>{s}</span>
                  ))}
                  <span style={{ fontSize: '0.6rem', color: '#45475a', marginLeft: 'auto' }}>
                    {entry.result_count} result{entry.result_count !== 1 ? 's' : ''} · {entry.searched_at.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search tab ─────────────────────────────────────────────────── */}
      {activeTab === 'search' && <>

      {/* Source tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #313244', padding: '4px 6px 0', gap: 2 }}>
        {allSources.length === 0
          ? <span style={{ color: '#585b70', fontSize: '0.65rem', padding: '4px' }}>Loading sources…</span>
          : allSources.map(src => (
              <button key={src.key} onClick={() => toggleSource(src.key)}
                title={src.description}
                disabled={!src.enabled}
                style={{
                  padding: '3px 8px', fontSize: '0.65rem', background: 'transparent', border: 'none',
                  borderBottom: activeSources.includes(src.key)
                    ? '2px solid var(--accent, #89b4fa)'
                    : '2px solid transparent',
                  color: !src.enabled ? '#45475a'
                    : activeSources.includes(src.key) ? 'var(--accent, #89b4fa)' : '#6c7086',
                  cursor: src.enabled ? 'pointer' : 'not-allowed',
                }}
              >{src.label}</button>
            ))
        }
      </div>

      {/* Search bar */}
      <div style={{ padding: '6px 8px', display: 'flex', gap: 6, borderBottom: '1px solid #313244', alignItems: 'center' }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search academic sources…"
          style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
        <button onClick={() => setShowFilters(v => !v)} title="Filters" style={{
          background: activeFilterCount > 0 ? 'var(--accent, #89b4fa)' : '#313244',
          border: '1px solid #444', borderRadius: 4, padding: '4px 7px',
          cursor: 'pointer', color: activeFilterCount > 0 ? '#1e1e2e' : '#cdd6f4',
          display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem',
        }}>
          <Funnel size={12} />
          {activeFilterCount > 0 && activeFilterCount}
        </button>
        <button onClick={search} disabled={loading || activeSources.length === 0} style={{
          background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
          padding: '4px 10px', cursor: 'pointer', color: '#1e1e2e', fontSize: '0.75rem',
          opacity: loading || activeSources.length === 0 ? 0.5 : 1,
        }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ padding: '8px', borderBottom: '1px solid #313244', background: '#1e1e2e', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Quick toggles */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chip('Open access', openAccess, () => setOpenAccess(v => !v))}
            {chip('Has fulltext', hasFulltext, () => setHasFulltext(v => !v))}
          </div>

          {/* Publication types */}
          <div>
            <div style={{ color: '#585b70', fontSize: '0.65rem', marginBottom: 4 }}>TYPE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {PUBLICATION_TYPES.map(t => chip(t.label, selectedTypes.includes(t.value), () => toggleType(t.value)))}
            </div>
          </div>

          {/* Year range + language */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#585b70', fontSize: '0.65rem' }}>Year</span>
              <input value={yearFrom} onChange={e => setYearFrom(e.target.value)} placeholder="from"
                style={{ width: 48, fontSize: '0.65rem', padding: '2px 4px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
              <span style={{ color: '#585b70', fontSize: '0.65rem' }}>–</span>
              <input value={yearTo} onChange={e => setYearTo(e.target.value)} placeholder="to"
                style={{ width: 48, fontSize: '0.65rem', padding: '2px 4px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#585b70', fontSize: '0.65rem' }}>Lang</span>
              <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="eng"
                style={{ width: 44, fontSize: '0.65rem', padding: '2px 4px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', color: '#f38ba8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reading toolbar */}
      <div style={{ padding: '4px 8px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: 10, background: '#181825' }}>
        <span style={{ fontSize: '0.65rem', color: '#6c7086', flexShrink: 0 }}>A</span>
        <input type="range" min={11} max={18} step={1} value={fontSize}
          onChange={e => changeFontSize(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent, #89b4fa)', cursor: 'pointer', height: 3 }}
          title={`Font size: ${fontSize}px`}
        />
        <span style={{ fontSize: '0.85rem', color: '#6c7086', flexShrink: 0 }}>A</span>
        <div style={{ width: 1, height: 14, background: '#313244', flexShrink: 0 }} />
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {(['#cdd6f4', '#ffffff', '#e0d0b0', '#b8d4b8', '#c8d8e8'] as const).map(color => (
            <button key={color} onClick={() => changeTextColor(color)} title={color} style={{
              width: 14, height: 14, borderRadius: '50%', border: textColor === color ? '2px solid var(--accent, #89b4fa)' : '2px solid #45475a',
              background: color, cursor: 'pointer', padding: 0, flexShrink: 0,
            }} />
          ))}
        </div>
      </div>

      {/* Results */}
      <div ref={resultsTopRef} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {error && (
          <div style={{ color: '#f38ba8', fontSize: '0.75rem', padding: '6px 8px', background: '#313244', borderRadius: 6 }}>
            {error}
          </div>
        )}
        {!loading && !error && results.length === 0 && query && (
          <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem', fontSize: '0.75rem' }}>No results</div>
        )}
        {pageResults.map((r, localIdx) => {
          const globalIdx = pageOffset + localIdx;
          return (
            <div key={globalIdx} onClick={() => toggleSelect(globalIdx)} style={{
              background: '#313244', borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
              border: selected.has(globalIdx) ? '1px solid var(--accent, #89b4fa)' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }}>
                    <ItemTypeIcon type={getItemDisplayType(r)} />
                    <span style={{ color: 'var(--accent, #89b4fa)', lineHeight: 1.35, fontSize: fontSize, fontWeight: 500 }}>{r.title}</span>
                  </div>
                  <div style={{ color: '#a6adc8', fontSize: fontSize * 0.84 }}>
                    {r.authors.slice(0, 3).join(', ')}{r.authors.length > 3 ? ' et al.' : ''}
                    {(r.journal || r.year) && ' · '}
                    {r.journal}{r.journal && r.year && ' · '}{r.year}
                    {r.source && <span style={{ marginLeft: 4, color: 'var(--accent, #89b4fa)', opacity: 0.8 }}>[{r.source}]</span>}
                  </div>
                  {r.doi && (
                    <div style={{ fontSize: fontSize * 0.78, color: textColor, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>
                      <span style={{ color: 'var(--accent, #89b4fa)', opacity: 1 }}>DOI: </span>{r.doi}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <ScoreBadge score={r.score} />
                  {selected.has(globalIdx)
                    ? <Check size={14} style={{ color: 'var(--accent, #89b4fa)' }} weight="bold" />
                    : <Plus size={14} style={{ color: '#6c7086' }} />
                  }
                </div>
              </div>
              {r.abstract && (() => {
                const abstract = stripHtml(r.abstract);
                const expanded = expandedAbstracts.has(globalIdx);
                const isLong = abstract.length > 200;
                return (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: fontSize * 0.84, color: textColor, opacity: 0.75, lineHeight: 1.55,
                      ...(!expanded && isLong ? {
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      } : {}),
                    }}>
                      {abstract}
                    </div>
                    {isLong && (
                      <button onClick={e => toggleAbstract(e, globalIdx)} style={{
                        marginTop: 2, fontSize: '0.6rem', color: 'var(--accent, #89b4fa)',
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                      }}>
                        {expanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Footer: pagination + import */}
      {results.length > 0 && (
        <div style={{ borderTop: '1px solid #313244' }}>
          {/* Pagination row */}
          {totalPages > 1 && (
            <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, borderBottom: '1px solid #313244' }}>
              <button onClick={() => goToPage(page - 1)} disabled={page === 0} style={{
                background: 'transparent', border: 'none', cursor: page === 0 ? 'not-allowed' : 'pointer',
                color: page === 0 ? '#45475a' : '#cdd6f4', padding: '2px 4px', display: 'flex', alignItems: 'center',
              }}>
                <CaretLeft size={12} />
              </button>

              {/* Page number buttons — show up to 5, ellipsis on overflow */}
              {Array.from({ length: totalPages }, (_, i) => i).map(i => {
                const nearCurrent = Math.abs(i - page) <= 1;
                const isEdge = i === 0 || i === totalPages - 1;
                const showEllipsisBefore = i === 1 && page > 2;
                const showEllipsisAfter  = i === totalPages - 2 && page < totalPages - 3;

                if (!nearCurrent && !isEdge) {
                  if (showEllipsisBefore || showEllipsisAfter) {
                    return <span key={i} style={{ color: '#45475a', fontSize: '0.65rem' }}>…</span>;
                  }
                  return null;
                }
                return (
                  <button key={i} onClick={() => goToPage(i)} style={{
                    minWidth: 22, height: 22, padding: '0 4px', fontSize: '0.65rem',
                    borderRadius: 4, border: 'none', cursor: 'pointer',
                    background: i === page ? 'var(--accent, #89b4fa)' : '#313244',
                    color: i === page ? '#1e1e2e' : '#6c7086',
                  }}>
                    {i + 1}
                  </button>
                );
              })}

              <button onClick={() => goToPage(page + 1)} disabled={page === totalPages - 1} style={{
                background: 'transparent', border: 'none', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                color: page === totalPages - 1 ? '#45475a' : '#cdd6f4', padding: '2px 4px', display: 'flex', alignItems: 'center',
              }}>
                <CaretRight size={12} />
              </button>
            </div>
          )}

          {/* Count + import row */}
          <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#a6adc8', fontSize: '0.65rem', flex: 1 }}>
              {importMsg
                ? <span style={{ color: '#a6e3a1' }}>{importMsg}</span>
                : <>{pageOffset + 1}–{Math.min(pageOffset + pageSize, results.length)} of {results.length}{selected.size > 0 && ` · ${selected.size} selected`}</>
              }
            </span>
            {selected.size > 0 && (
              <button onClick={handleImport} disabled={importing} style={{
                background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
                padding: '4px 10px', fontSize: '0.75rem', cursor: importing ? 'wait' : 'pointer',
                color: '#1e1e2e', opacity: importing ? 0.6 : 1, flexShrink: 0,
              }}>
                {importing ? 'Importing…' : 'Import to Zotero'}
              </button>
            )}
          </div>
        </div>
      )}

      </>}
    </div>
  );
}
