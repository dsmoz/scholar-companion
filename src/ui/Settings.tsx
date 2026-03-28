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
  getSyncOnStartup, getDiscoverySources, setPref,
  getChatRelatedMinLabel, setChatRelatedMinLabel,
} from '../prefs';

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
  const [sources, setSourcesState] = useState(getDiscoverySources());
  const [confirmAction, setConfirmAction] = useState<null | 'reindex' | 'clear'>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { testConnection(); }, []);

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

  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text, #cdd6f4)', fontSize: '0.8rem' }}>{label}</span>
      {control}
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
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY SOURCES</SectionHeader>
        {(['pubmed', 'semantic_scholar', 'openalex'] as const).map(src => (
          row(
            { pubmed: 'PubMed / NCBI', semantic_scholar: 'Semantic Scholar', openalex: 'OpenAlex' }[src],
            <Toggle key={src} checked={sources[src]} onChange={v => {
              const next = { ...sources, [src]: v };
              setSourcesState(next);
              const prefKey = `discovery${src === 'pubmed' ? 'Pubmed' : src === 'semantic_scholar' ? 'SemanticScholar' : 'OpenAlex'}` as any;
              setPref(prefKey, v);
            }} />
          )
        ))}
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
