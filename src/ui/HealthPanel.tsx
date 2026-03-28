// src/ui/HealthPanel.tsx
import React, { useState, useEffect } from 'react';
import { FileText } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { StripedList } from './components/StripedList';
import { fetchLibraryHealth, indexAllPending, fixOrphans, invalidateHealthCache, LibraryHealth } from '../api/health';
import { getHealthPageSize } from '../prefs';

const ISSUE_COLORS: Record<string, string> = {
  failed_sync: '#f38ba8',
  missing_pdf: '#f9e2af',
  not_indexed: '#89b4fa',
};

const ISSUE_LABELS: Record<string, string> = {
  failed_sync: 'Sync failed',
  missing_pdf: 'No PDF',
  not_indexed: 'Not indexed',
};

const ISSUE_ACTIONS: Record<string, string> = {
  failed_sync: 'Retry',
  missing_pdf: 'Find PDF',
  not_indexed: 'Index',
};

export function HealthPanel() {
  const [health, setHealth] = useState<LibraryHealth | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => { load(); }, []);

  async function load(force = false) {
    const h = await fetchLibraryHealth(force);
    setHealth(h);
  }

  async function handleIndexPending() {
    setBusy('index');
    try {
      const r = await indexAllPending();
      invalidateHealthCache();
      await load(true);
      window.alert(`Queued ${r.queued} item(s) for indexing.`);
    } catch (e: any) {
      window.alert(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleFixOrphans() {
    if (!window.confirm('Remove orphaned synctracker records? This cannot be undone.')) return;
    setBusy('orphans');
    try {
      const r = await fixOrphans();
      invalidateHealthCache();
      await load(true);
      window.alert(`Removed ${r.removed} orphan(s).`);
    } catch (e: any) {
      window.alert(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  const filtered = health?.issues.filter(i => !filter || i.issue_type === filter) ?? [];
  const pageSize = getHealthPageSize();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const card = (label: string, value: number, type: string | null, color: string) => (
    <button onClick={() => { setFilter(filter === type ? null : type); setPage(0); }} style={{
      background: '#313244',
      border: filter === type ? `2px solid ${color}` : '1px solid transparent',
      borderRadius: 6, padding: '0.5rem', textAlign: 'center', cursor: 'pointer', flex: 1,
    }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: '#6c7086' }}>{label}</div>
    </button>
  );

  return (
    <div style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
      <SectionHeader>Library Health</SectionHeader>
      {health && (
        <>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6c7086', marginBottom: 4 }}>
              <span>{health.indexed} / {health.total} indexed</span>
              <span style={{ color: health.status === 'healthy' ? '#a6e3a1' : '#f9e2af' }}>{health.sync_percentage}%</span>
            </div>
            <div style={{ background: '#313244', borderRadius: 4, height: 6 }}>
              <div style={{ background: '#a6e3a1', height: 6, borderRadius: 4, width: `${health.sync_percentage}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
            {card('Indexed', health.indexed, null, '#a6e3a1')}
            {card('Unindexed', health.unindexed, 'not_indexed', '#89b4fa')}
            {card('Failed', health.failed, 'failed_sync', '#f38ba8')}
            {card('No PDF', health.missing_pdf, 'missing_pdf', '#f9e2af')}
          </div>
          <SectionHeader>Issues</SectionHeader>
          <div style={{ marginBottom: '0.5rem' }}>
            <StripedList emptyMessage="No issues">
              {paginated.map(issue => (
                <div key={issue.zotero_key} style={{
                  borderLeft: `3px solid ${ISSUE_COLORS[issue.issue_type]}`,
                  padding: '6px 8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <FileText size={14} color="#6c7086" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#cdd6f4' }}>{issue.title}</div>
                      <div style={{ color: ISSUE_COLORS[issue.issue_type], fontSize: '0.65rem' }}>
                        {ISSUE_LABELS[issue.issue_type]}
                        {issue.error_message ? ` · ${issue.error_message}` : ''}
                      </div>
                      {issue.updated_at && (
                        <div style={{ color: '#6c7086', fontSize: '0.6rem', marginTop: 1 }}>
                          {new Date(issue.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ color: 'var(--accent, #89b4fa)', fontSize: '0.7rem', cursor: 'pointer' }}>
                    {ISSUE_ACTIONS[issue.issue_type]}
                  </span>
                </div>
              ))}
            </StripedList>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#6c7086' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{ background: 'none', border: '1px solid #444', borderRadius: 4, color: page === 0 ? '#444' : '#cdd6f4', padding: '2px 8px', cursor: page === 0 ? 'default' : 'pointer' }}
              >← Prev</button>
              <span>{page + 1} / {totalPages} ({filtered.length} items)</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{ background: 'none', border: '1px solid #444', borderRadius: 4, color: page >= totalPages - 1 ? '#444' : '#cdd6f4', padding: '2px 8px', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
              >Next →</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              disabled={busy !== null}
              onClick={handleIndexPending}
              style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
            >
              {busy === 'index' ? '...' : 'Retry all failed'}
            </button>
            <button
              disabled={busy !== null}
              onClick={handleIndexPending}
              style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
            >
              {busy === 'index' ? '...' : 'Index all pending'}
            </button>
            <button
              disabled={busy !== null}
              onClick={handleFixOrphans}
              style={{ fontSize: '0.7rem', padding: '3px 8px', border: '1px solid #f38ba8', color: '#f38ba8', background: 'transparent', borderRadius: 4, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
            >
              {busy === 'orphans' ? '...' : 'Fix orphans'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
