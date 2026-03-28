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
  getTheme, setTheme, getAutoSync, getChatModel, getChatMaxChunks,
  getSyncOnStartup, getDiscoverySources, setDiscoverySources,
  getHealthPageSize, getDiscoveryLimit, getDiscoveryPageSize,
  getDiscoveryHistoryTTL, getDiscoveryHistoryMax, setPref, DiscoverySource,
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
  const [sources, setSourcesState] = useState<DiscoverySource[]>(getDiscoverySources());
  const [newSourceId, setNewSourceId] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [healthPageSize, setHealthPageSizeState] = useState(getHealthPageSize());
  const [discoveryLimit, setDiscoveryLimitState] = useState(getDiscoveryLimit());
  const [discoveryPageSize, setDiscoveryPageSizeState] = useState(getDiscoveryPageSize());
  const [discoveryHistoryTTL, setDiscoveryHistoryTTLState] = useState(getDiscoveryHistoryTTL());
  const [discoveryHistoryMax, setDiscoveryHistoryMaxState] = useState(getDiscoveryHistoryMax());
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
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY</SectionHeader>
        {row('Results per source', segmented(['5', '10', '20', '50'], String(discoveryLimit), v => {
          const n = parseInt(v); setDiscoveryLimitState(n); setPref('discoveryLimit', n as any);
        }))}
        {row('Results per page', segmented(['5', '10', '20'], String(discoveryPageSize), v => {
          const n = parseInt(v); setDiscoveryPageSizeState(n); setPref('discoveryPageSize', n as any);
        }))}
        {row('History TTL', segmented(['6h', '12h', '24h', '48h'], `${discoveryHistoryTTL}h`, v => {
          const n = parseInt(v); setDiscoveryHistoryTTLState(n); setPref('discoveryHistoryTTL', n as any);
        }))}
        {row('History entries', segmented(['5', '10', '20'], String(discoveryHistoryMax), v => {
          const n = parseInt(v); setDiscoveryHistoryMaxState(n); setPref('discoveryHistoryMax', n as any);
        }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY SOURCES</SectionHeader>
        {sources.map((src, idx) => (
          <div key={src.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text, #cdd6f4)', fontSize: '0.8rem' }}>{src.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Toggle checked={src.enabled} onChange={v => {
                const next = sources.map((s, i) => i === idx ? { ...s, enabled: v } : s);
                setSourcesState(next);
                setDiscoverySources(next);
              }} />
              <button
                onClick={() => {
                  const next = sources.filter((_, i) => i !== idx);
                  setSourcesState(next);
                  setDiscoverySources(next);
                }}
                style={{ background: 'transparent', border: 'none', color: '#f38ba8', fontSize: '0.7rem', cursor: 'pointer', padding: '0 2px' }}
                title="Remove source"
              >✕</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem' }}>
          <input
            value={newSourceId}
            onChange={e => setNewSourceId(e.target.value)}
            placeholder="source_id"
            style={{ width: 90, fontSize: '0.7rem', padding: '3px 6px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
          />
          <input
            value={newSourceLabel}
            onChange={e => setNewSourceLabel(e.target.value)}
            placeholder="Label"
            style={{ flex: 1, fontSize: '0.7rem', padding: '3px 6px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
          />
          <button
            onClick={() => {
              const id = newSourceId.trim().toLowerCase().replace(/\s+/g, '_');
              const label = newSourceLabel.trim();
              if (!id || !label || sources.some(s => s.id === id)) return;
              const next = [...sources, { id, label, enabled: true }];
              setSourcesState(next);
              setDiscoverySources(next);
              setNewSourceId('');
              setNewSourceLabel('');
            }}
            style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}
          >Add</button>
        </div>
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>LIBRARY HEALTH</SectionHeader>
        {row('Issues per page', segmented(['5', '10', '20', '50'], String(healthPageSize), v => {
          const n = parseInt(v); setHealthPageSizeState(n); setPref('healthPageSize', n as any);
        }))}
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
