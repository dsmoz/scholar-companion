// src/ui/components/RelatedDocsPanel.tsx
import React, { useState, useEffect } from 'react';
import { ArrowsIn, ArrowsOut, Chat } from '@phosphor-icons/react';
import { similarToMany, semanticSearch, SearchResult } from '../../api/search';
import { getChatRelatedMax, getRelatedMinScore } from '../../prefs';
import { ScoreChip } from './ScoreChip';

function openDocChat(zoteroKey: string) {
  // The React app runs inside a <browser> XUL element, so window.opener is null.
  // window.top is the XUL dialog window; its opener is the Zotero main window.
  const xulWin = window.top ?? window;
  const target: Window = (xulWin.opener as Window) ?? xulWin;
  target.dispatchEvent(new CustomEvent('zotero-ai-command', {
    detail: { command: 'openSingleDocChat', keys: [zoteroKey] },
    bubbles: true,
  }));
}

interface Props {
  /** Keys of documents in chat scope — used to find related items via similarity. */
  sourceKeys?: string[];
  /** Freetext query — used instead of keys for library chat (semantic search). */
  query?: string;
  /** Conversation context (last user message) — boosts contextually relevant results. */
  context?: string;
  /** When true, defer the API call until streaming finishes. */
  disabled?: boolean;
}

export function RelatedDocsPanel({ sourceKeys = [], query, context, disabled }: Props) {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const limit = getChatRelatedMax();
    const minScore = getRelatedMinScore();
    const filter = (results: SearchResult[]) => results.filter(r => r.score >= minScore);

    if (query) {
      setLoading(true);
      semanticSearch(query, limit)
        .then(r => setItems(filter(r)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (sourceKeys.length > 0) {
      setLoading(true);
      similarToMany(sourceKeys, limit, context)
        .then(r => setItems(filter(r)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sourceKeys.join(','), query ?? '', context ?? '', disabled]);

  if (!loading && items.length === 0 && !sourceKeys.length && !query) return null;

  return (
    <div style={{
      borderTop: '1px solid #313244',
      background: '#181825',
    }}>
      {/* Header row */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'transparent', border: 'none',
          padding: '5px 10px', cursor: 'pointer', color: '#6c7086',
        }}
      >
        <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Related documents {!loading && `(${items.length})`}
        </span>
        {collapsed
          ? <ArrowsOut size={11} />
          : <ArrowsIn size={11} />
        }
      </button>

      {!collapsed && (
        <div style={{ paddingBottom: 6 }}>
          {loading ? (
            <div style={{ padding: '4px 10px', color: '#6c7086', fontSize: '0.7rem' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '4px 10px', color: '#6c7086', fontSize: '0.7rem' }}>
              Document not yet indexed — index it to see related items.
            </div>
          ) : (
            items.map(item => (
              <div key={item.zotero_key} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 10px',
              }}>
                <ScoreChip score={item.score} signals={item.signals} />
                <span style={{
                  flex: 1, color: '#cdd6f4', fontSize: '0.72rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>
                {item.date && (
                  <span style={{ color: '#6c7086', fontSize: '0.65rem', flexShrink: 0 }}>
                    {item.date.slice(0, 4)}
                  </span>
                )}
                <button
                  onClick={() => openDocChat(item.zotero_key)}
                  title="Chat with this document"
                  style={{
                    background: 'transparent', border: 'none', flexShrink: 0,
                    color: '#6c7086', cursor: 'pointer', padding: '1px 2px',
                    display: 'flex', alignItems: 'center',
                    borderRadius: 3,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent, #89b4fa)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6c7086')}
                >
                  <Chat size={12} weight="regular" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
