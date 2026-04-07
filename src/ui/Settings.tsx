// src/ui/Settings.tsx
import React, { useState, useEffect } from 'react';
import { ArrowsClockwise, Eye, EyeSlash, CopySimple, SignIn, SignOut, WifiHigh, WifiSlash } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { Toggle } from './components/Toggle';
import { ConfirmDialog } from './components/ConfirmDialog';
import { checkConnection, login, disconnect } from '../api/client';
import { triggerSync } from '../api/sync';
import {
  getApiToken, getClientId, getDisplayName,
  getSyncInterval, setSyncInterval,
  getTheme, setTheme, getAutoSync, getChatRelatedMax,
  getSyncOnStartup, setPref,
  getChatRelatedMinLabel, setChatRelatedMinLabel,
  getItemPaneHeight, setItemPaneHeight,
  getSourcePrefs, setSourcePref,
  getDiscoveryScoreMode, setDiscoveryScoreMode,
  getDiscoveryMinScore, setDiscoveryMinScore,
  getDiscoveryTopK, setDiscoveryTopK,
  getListPageSize, setListPageSize,
  getCacheTtlMinutes, setCacheTtlMinutes,
  getChatModel, getChatMaxChunks,
  getDiscoveryFontSize, setDiscoveryFontSize,
  getDiscoveryTextColor, setDiscoveryTextColor,
} from '../prefs';
import { fetchDiscoverySources, clearSourceCache, type SourceEntry } from '../api/discovery';
import { fetchChatModels, type ChatModelEntry } from '../api/chat';

export function Settings() {
  // Connection state
  const [isLoggedIn, setIsLoggedIn] = useState(!!getApiToken());
  const [online, setOnline] = useState(false);
  const [clientId, setClientIdState] = useState(getClientId());
  const [displayName, setDisplayNameState] = useState(getDisplayName());
  const [token, setTokenState] = useState(getApiToken());

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Token display
  const [showToken, setShowToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Other settings state
  const [syncInterval, setSyncIntervalState] = useState(getSyncInterval());
  const [autoSync, setAutoSyncState] = useState(getAutoSync());
  const [syncOnStartup, setSyncOnStartupState] = useState(getSyncOnStartup());
  const [theme, setThemeState] = useState(getTheme());
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
  const [chatModel, setChatModelState] = useState(getChatModel());
  const [chatMaxChunks, setChatMaxChunksState] = useState(getChatMaxChunks());
  const [chatModels, setChatModels] = useState<ChatModelEntry[]>([]);
  const [fontSize, setFontSizeState] = useState(getDiscoveryFontSize());
  const [textColor, setTextColorState] = useState(getDiscoveryTextColor());
  const [confirmAction, setConfirmAction] = useState<null | 'reindex' | 'clear'>(null);
  const [syncing, setSyncing] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      // On mount only: validate stored token
      testConnection();
      fetchDiscoverySources()
        .then(sources => { setDiscoverySources(sources); setDiscoveryError(''); })
        .catch(err => {
          console.error('[Scholar Companion] Mount: discovery sources failed:', err);
          setDiscoveryError(err?.message || 'Failed to load sources');
        });
      fetchChatModels()
        .then(setChatModels)
        .catch(err => console.error('[Scholar Companion] Mount: chat models failed:', err));
    }
  }, []);

  async function testConnection() {
    try {
      await checkConnection();
      setOnline(true);
    } catch (err: any) {
      setOnline(false);
      // Token expired or invalid — auto-disconnect
      if (err?.status === 401) {
        disconnect();
        setIsLoggedIn(false);
        setClientIdState('');
        setDisplayNameState('');
        setTokenState('');
        setLoginError('Session expired. Please log in again.');
      }
    }
  }

  async function handleLogin() {
    setLoginError('');
    setLoginLoading(true);
    setDiscoveryError('');
    try {
      const result = await login(username, password);
      setIsLoggedIn(true);
      setClientIdState(result.client_id);
      setDisplayNameState(result.display_name);
      setTokenState(result.access_token);
      setUsername('');
      setPassword('');
      // Token is persisted — check connection
      try {
        await checkConnection();
        setOnline(true);
      } catch (err) {
        console.error('[Scholar Companion] Health check failed after login:', err);
        setOnline(false);
      }
      // Clear stale cache and fetch fresh data
      clearSourceCache();
      fetchDiscoverySources()
        .then(sources => { setDiscoverySources(sources); setDiscoveryError(''); })
        .catch(err => {
          console.error('[Scholar Companion] Post-login: discovery sources failed:', err);
          setDiscoveryError(err?.message || 'Failed to load sources');
        });
      fetchChatModels()
        .then(setChatModels)
        .catch(err => console.error('[Scholar Companion] Post-login: chat models failed:', err));
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleDisconnect() {
    disconnect();
    clearSourceCache();
    setIsLoggedIn(false);
    setOnline(false);
    setClientIdState('');
    setDisplayNameState('');
    setTokenState('');
    setDiscoverySources([]);
    setDiscoveryError('');
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

  const inputStyle: React.CSSProperties = {
    width: 180, fontSize: '0.75rem', padding: '3px 6px',
    background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4',
  };

  const lockedInputStyle: React.CSSProperties = {
    ...inputStyle, color: '#6c7086', cursor: 'default', opacity: 0.8,
  };

  const btnStyle: React.CSSProperties = {
    fontSize: '0.7rem', padding: '3px 10px', background: '#313244',
    border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer',
  };

  return (
    <div style={{ padding: '0.75rem', maxHeight: '100%', overflowY: 'auto', fontSize: '0.8rem' }}>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>APPEARANCE</SectionHeader>
        {row('Theme', segmented(['Auto', 'Light', 'Dark'], theme, v => { setThemeState(v); setTheme(v.toLowerCase()); }))}
        {row('Chat font size', segmented(['11', '13', '15', '17'], String(fontSize), v => {
          const n = parseInt(v);
          setFontSizeState(n);
          setDiscoveryFontSize(n);
          document.documentElement.style.setProperty('--reading-font-size', `${n}px`);
        }))}
        {row('Chat text color',
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="color"
              value={textColor}
              onChange={e => {
                setTextColorState(e.target.value);
                setDiscoveryTextColor(e.target.value);
                document.documentElement.style.setProperty('--reading-text-color', e.target.value);
              }}
              style={{ width: 32, height: 22, border: '1px solid #444', borderRadius: 4, background: '#313244', cursor: 'pointer', padding: 0 }}
            />
            <button onClick={() => {
              setFontSizeState(13);
              setTextColorState('#cdd6f4');
              setDiscoveryFontSize(13);
              setDiscoveryTextColor('#cdd6f4');
              document.documentElement.style.setProperty('--reading-font-size', '13px');
              document.documentElement.style.setProperty('--reading-text-color', '#cdd6f4');
            }} style={{ fontSize: '0.6rem', color: '#6c7086', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Reset
            </button>
          </div>
        )}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>ACCOUNT</SectionHeader>

        {/* Status indicator */}
        {row('Status',
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
            {isLoggedIn && online
              ? <><WifiHigh size={14} weight="bold" style={{ color: '#a6e3a1' }} /> <span style={{ color: '#a6e3a1' }}>Online</span></>
              : <><WifiSlash size={14} weight="bold" style={{ color: '#f38ba8' }} /> <span style={{ color: '#f38ba8' }}>Offline</span></>
            }
          </span>
        )}

        {!isLoggedIn ? (
          /* ── Login form ─────────────────────────────────────────── */
          <>
            {row('Username',
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Username or email"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle} />
            )}
            {row('Password',
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle} />
            )}
            {loginError && (
              <div style={{ color: '#f38ba8', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                {loginError}
              </div>
            )}
            <button onClick={handleLogin} disabled={loginLoading || !username || !password}
              style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4,
                opacity: (loginLoading || !username || !password) ? 0.5 : 1 }}>
              <SignIn size={12} /> {loginLoading ? 'Connecting...' : 'Connect'}
            </button>
            <div style={{ fontSize: '0.7rem', color: '#a6adc8', marginTop: '0.4rem' }}>
              Don't have an account? Register at mcp.dsmozconsultancy.com
            </div>
          </>
        ) : (
          /* ── Connected state — locked credentials ────────────── */
          <>
            {displayName && row('Name', <span style={{ fontSize: '0.75rem', color: '#a6adc8' }}>{displayName}</span>)}
            {row('Client ID',
              <input readOnly value={clientId} style={lockedInputStyle} />
            )}
            {row('Token',
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input readOnly type={showToken ? 'text' : 'password'} value={token}
                  style={{ ...lockedInputStyle, width: 140 }} />
                <button onClick={() => setShowToken(!showToken)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6c7086', padding: 2, display: 'flex' }}>
                  {showToken ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(token); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 1500); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: tokenCopied ? '#a6e3a1' : '#6c7086', padding: 2, display: 'flex' }}>
                  <CopySimple size={14} />
                </button>
              </div>
            )}
            <button onClick={handleDisconnect}
              style={{ ...btnStyle, borderColor: '#f38ba8', color: '#f38ba8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SignOut size={12} /> Disconnect
            </button>
          </>
        )}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>SYNC SCHEDULING</SectionHeader>
        {row('Auto-sync', <Toggle checked={autoSync} onChange={v => { setAutoSyncState(v); setPref('autoSync', v as any); }} />)}
        {row('Interval', segmented(['6h', '12h', '24h', '48h'], `${syncInterval}h`, v => {
          const n = parseInt(v); setSyncIntervalState(n); setSyncInterval(n);
        }))}
        {row('Sync on startup', <Toggle checked={syncOnStartup} onChange={v => { setSyncOnStartupState(v); setPref('syncOnStartup', v as any); }} />)}
        <button onClick={handleSyncNow} disabled={syncing} style={{ ...btnStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowsClockwise size={12} /> {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>CHAT</SectionHeader>
        {row('Model',
          chatModels.length > 0 ? (
            <select
              value={chatModel}
              onChange={e => { setChatModelState(e.target.value); setPref('chatModel', e.target.value as any); }}
              style={{ ...inputStyle, width: 200, cursor: 'pointer' }}
            >
              {chatModels.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: '0.7rem', color: '#6c7086' }}>{isLoggedIn ? 'Loading...' : 'Connect first'}</span>
          )
        )}
        {row(<span>Context depth<div style={{ fontSize: '0.6rem', color: '#585b70', marginTop: 1 }}>More = better answers, slower</div></span>,
          segmented(['4', '8', '15', '25'], String(chatMaxChunks), v => {
            const n = parseInt(v); setChatMaxChunksState(n); setPref('chatMaxChunks', n as any);
          })
        )}
        {row('Related docs', segmented(['3', '5', '8', '10'], String(chatRelatedMax), v => {
          const n = parseInt(v); setChatRelatedMaxState(n); setPref('chatRelatedMax', n as any);
        }))}
        {row('Minimum match', segmented(['Fair', 'Good', 'Best'], chatRelatedMinLabel, v => {
          setChatRelatedMinLabelState(v); setChatRelatedMinLabel(v);
        }))}
        {row('Item pane height', segmented(['300', '450', '600', '800'], String(itemPaneHeight), v => {
          const n = parseInt(v); setItemPaneHeightState(n); setItemPaneHeight(n);
        }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>DISCOVERY SOURCES</SectionHeader>
        {discoverySources.length === 0
          ? <div style={{ color: discoveryError ? '#f38ba8' : '#6c7086', fontSize: '0.75rem' }}>
              {!isLoggedIn
                ? 'Connect to load sources'
                : discoveryError
                  ? `Error: ${discoveryError}`
                  : 'Loading sources from server…'}
            </div>
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

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>PERFORMANCE</SectionHeader>
        {row('Cache duration', segmented(['10', '30', '60'], String(cacheTtlMinutes), v => {
          const n = parseInt(v);
          setCacheTtlMinutesState(n);
          setCacheTtlMinutes(n);
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
