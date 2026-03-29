// src/ui/Settings.tsx
import React, { useState, useEffect } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { StatusDot } from './components/StatusDot';
import { Toggle } from './components/Toggle';
import { ConfirmDialog } from './components/ConfirmDialog';
import { checkConnection } from '../api/client';
import { triggerSync } from '../api/sync';
import {
  getApiUrl, setApiUrl, getSyncInterval, setSyncInterval,
  getTheme, setTheme, getAutoSync, getChatModel, getChatMaxChunks, getChatRelatedMax,
  getSyncOnStartup, setPref,
  getChatRelatedMinLabel, setChatRelatedMinLabel,
  getItemPaneHeight, setItemPaneHeight,
  getSourcePrefs, setSourcePref,
  getDiscoveryScoreMode, setDiscoveryScoreMode,
  getDiscoveryMinScore, setDiscoveryMinScore,
  getDiscoveryTopK, setDiscoveryTopK,
  getListPageSize, setListPageSize,
  getCacheTtlMinutes, setCacheTtlMinutes,
} from '../prefs';
import { fetchDiscoverySources, type SourceEntry } from '../api/discovery';

type ConnectionStatus = 'connected' | 'degraded' | 'offline';

export function Settings() {
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('offline');
  const [latency, setLatency] = useState<number | undefined>();
  const [syncInterval, setSyncIntervalState] = useState(getSyncInterval());
  const [autoSync, setAutoSyncState] = useState(getAutoSync());
  const [syncOnStartup, setSyncOnStartupState] = useState(getSyncOnStartup());
  const [theme, setThemeState] = useState(getTheme());
  const [chatModel, setChatModelState] = useState(getChatModel());
  const [chatMaxChunks, setChatMaxChunksState] = useState(getChatMaxChunks());
  const [chatRelatedMax, setChatRelatedMaxState] = useState(getChatRelatedMax());
  const [chatRelatedMinLabel, setChatRelatedMinLabelState] = useState(getChatRelatedMinLabel());
  const [itemPaneHeight, setItemPaneHeightState] = useState(getItemPaneHeight());
  const [discoverySources, setDiscoverySources] = useState<SourceEntry[]>([]);
  const [sourcePrefs, setSourcePrefs] = useState(getSourcePrefs());
  const [scoreMode, setScoreModeState] = useState<'keyword' | 'semantic'>(getDiscoveryScoreMode());
  const [minScore, setMinScoreState] = useState(getDiscoveryMinScore());
  const [topK, setTopKState] = useState(getDiscoveryTopK());
  const [listPageSize, setListPageSizeState] = useState(getListPageSize());
  const [cacheTtlMinutes, setCacheTtlMinutesState] = useState(getCacheTtlMinutes());
  const [confirmAction, setConfirmAction] = useState<null | 'reindex' | 'clear'>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    testConnection();
    fetchDiscoverySources().then(setDiscoverySources).catch(() => {});
  }, []);

  async function testConnection() {
    try {
      const result = await checkConnection();
      setConnStatus('connected');
      setLatency(result.latency);
    } catch {
      setConnStatus('offline');
      setLatency(undefined);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try { await triggerSync(); } finally { setSyncing(false); }
  }

  const row = (label: React.ReactNode, control: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text, #cdd6f4)', fontSize: '0.8rem', flex: 1, marginRight: 8 }}>{label}</span>
      <span style={{ flexShrink: 0 }}>{control}</span>
    </div>
  );

  const segmented = (options: string[], value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          background: value === opt ? '#313244' : 'transparent',
          border: value === opt ? '2px solid var(--accent, #89b4fa)' : '1px solid #444',
          color: value === opt ? 'var(--text, #cdd6f4)' : '#6c7086',
          borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer',
        }}>{opt}</button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '0.75rem', maxHeight: '100%', overflowY: 'auto', fontSize: '0.8rem' }}>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>APPEARANCE</SectionHeader>
        {row('Theme', segmented(['Auto', 'Light', 'Dark'], theme, v => { setThemeState(v); setTheme(v.toLowerCase()); }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>BACKEND CONNECTION</SectionHeader>
        {row('Flask API URL',
          <input value={apiUrl} onChange={e => setApiUrlState(e.target.value)}
            onBlur={() => setApiUrl(apiUrl)}
            style={{ width: 180, fontSize: '0.75rem', padding: '3px 6px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
        )}
        {row('Status', <StatusDot status={connStatus} latency={latency} />)}
        <button onClick={testConnection} style={{ fontSize: '0.7rem', padding: '3px 10px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
          Test connection
        </button>
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>SYNC SCHEDULING</SectionHeader>
        {row('Auto-sync', <Toggle checked={autoSync} onChange={v => { setAutoSyncState(v); setPref('autoSync', v as any); }} />)}
        {row('Interval', segmented(['6h', '12h', '24h', '48h'], `${syncInterval}h`, v => {
          const n = parseInt(v); setSyncIntervalState(n); setSyncInterval(n);
        }))}
        {row('Sync on startup', <Toggle checked={syncOnStartup} onChange={v => { setSyncOnStartupState(v); setPref('syncOnStartup', v as any); }} />)}
        <button onClick={handleSyncNow} disabled={syncing} style={{ fontSize: '0.7rem', padding: '3px 10px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowsClockwise size={12} /> {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>CHAT</SectionHeader>
        {row('LLM model',
          <input value={chatModel} onChange={e => setChatModelState(e.target.value)}
            onBlur={() => setPref('chatModel', chatModel as any)}
            style={{ width: 180, fontSize: '0.75rem', padding: '3px 6px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
        )}
        {row('Max chunks', segmented(['4', '8', '12', '20'], String(chatMaxChunks), v => {
          const n = parseInt(v); setChatMaxChunksState(n); setPref('chatMaxChunks', n as any);
        }))}
        {row('Related docs', segmented(['3', '5', '8', '10'], String(chatRelatedMax), v => {
          const n = parseInt(v); setChatRelatedMaxState(n); setPref('chatRelatedMax', n as any);
        }))}
        {row('Minimum match', segmented(['Fair', 'Good', 'Best'], chatRelatedMinLabel, v => {
          setChatRelatedMinLabelState(v); setChatRelatedMinLabel(v);
        }))}
        {row('Item pane height', segmented(['300', '450', '600', '800'], String(itemPaneHeight), v => {
          const n = parseInt(v); setItemPaneHeightState(n); setItemPaneHeight(n);
        }))}
        {row('Cache duration', segmented(['10', '30', '60'], String(cacheTtlMinutes), v => {
          const n = parseInt(v);
          setCacheTtlMinutesState(n);
          setCacheTtlMinutes(n);
        }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY SOURCES</SectionHeader>
        {discoverySources.length === 0
          ? <div style={{ color: '#6c7086', fontSize: '0.75rem' }}>Loading sources from server…</div>
          : discoverySources.map(src => (
              <div key={src.key} style={{ marginBottom: '0.5rem' }}>
                {row(
                  <span>
                    <span style={{ color: 'var(--text, #cdd6f4)' }}>{src.label}</span>
                    {!src.enabled && (
                      <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#f38ba8' }}>disabled on server</span>
                    )}
                    <div style={{ fontSize: '0.65rem', color: '#585b70', marginTop: 1 }}>{src.description}</div>
                  </span>,
                  <Toggle
                    checked={src.key in sourcePrefs ? sourcePrefs[src.key] : src.default_enabled_in_plugin}
                    disabled={!src.enabled}
                    onChange={v => {
                      setSourcePref(src.key, v);
                      setSourcePrefs(prev => ({ ...prev, [src.key]: v }));
                    }}
                  />
                )}
              </div>
            ))
        }
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY SCORING</SectionHeader>
        {row('Score mode', segmented(['keyword', 'semantic'], scoreMode, v => {
          const val = v as 'keyword' | 'semantic';
          setScoreModeState(val);
          setDiscoveryScoreMode(val);
        }))}
        {row('Min score', segmented(['0.0', '0.2', '0.3', '0.4', '0.5'], String(minScore), v => {
          const n = parseFloat(v);
          setMinScoreState(n);
          setDiscoveryMinScore(n);
        }))}
        {row('Top results', segmented(['10', '15', '25', '50'], String(topK), v => {
          const n = parseInt(v);
          setTopKState(n);
          setDiscoveryTopK(n);
        }))}
        {row('Page size', segmented(['5', '10', '20', '50'], String(listPageSize), v => {
          const n = parseInt(v);
          setListPageSizeState(n);
          setListPageSize(n);
        }))}
        <div style={{ fontSize: '0.65rem', color: '#585b70', marginTop: '0.25rem' }}>
          keyword: fast, no API cost · semantic: accurate, uses embedding model
        </div>
      </section>

      <section>
        <SectionHeader>DANGER ZONE</SectionHeader>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setConfirmAction('reindex')} style={{ border: '1px solid #f38ba8', color: '#f38ba8', background: 'transparent', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>
            Re-index entire library
          </button>
          <button onClick={() => setConfirmAction('clear')} style={{ border: '1px solid #f38ba8', color: '#f38ba8', background: 'transparent', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>
            Clear Qdrant collection
          </button>
        </div>
      </section>

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction === 'reindex'
            ? 'This will re-index all items in the library. This may take a long time. Continue?'
            : 'This will delete all vectors from Qdrant. Items will need to be re-indexed. Continue?'}
          onConfirm={() => { setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
