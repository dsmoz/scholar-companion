# Zotero AI Companion Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Zotero 7 plugin (`.xpi`) that surfaces the MCP backend's AI capabilities natively inside Zotero — chat with documents, semantic search, similarity graph (D3), external discovery, library health dashboard, index queue, cascade delete, and settings with theme/sync scheduling.

**Architecture:** Zotero Plugin Scaffold (TypeScript + esbuild + React). Plugin core (`bootstrap.ts`, `events.ts`, `menu.ts`, `prefs.ts`) runs inside the Zotero process. React components render into XUL panels. The D3 graph runs in a sandboxed `<browser>` element communicating via `postMessage`. All backend calls go through `src/api/client.ts` to Flask `:6500`.

**Tech Stack:** TypeScript 5, React 18, `@phosphor-icons/react`, D3.js v7 (`d3-force` `d3-zoom` `d3-drag` `d3-scale`), esbuild, Zotero Plugin Scaffold, Jest + `@testing-library/react`

**Plugin root:** `/Users/danilodasilva/Documents/Programming/Apps/zotero_plugin`

**Prerequisite:** Backend plan (`2026-03-28-backend-plugin-routes.md`) must be complete and Flask server running on `:6500`.

---

## File Map

```
src/
├── bootstrap.ts              # Plugin lifecycle: startup/shutdown, registers all components
├── events.ts                 # Zotero.Notifier hooks: add/delete/modify items
├── menu.ts                   # Toolbar button, Tools menu items, right-click context menu
├── prefs.ts                  # Read/write Zotero prefs (theme, sync interval, API URL, etc.)
├── api/
│   ├── client.ts             # Base fetch wrapper: error handling, timeout, exponential backoff
│   ├── chat.ts               # SSE streaming chat: EventSource wrapper
│   ├── search.ts             # Semantic search call
│   ├── graph.ts              # Graph nodes/edges fetch
│   ├── author.ts             # Author profile fetch
│   ├── discovery.ts          # External discovery search + Zotero import
│   ├── health.ts             # Library health fetch
│   ├── jobs.ts               # Jobs list, retry, pause/resume
│   └── sync.ts               # Manual sync trigger
├── ui/
│   ├── ItemPaneTab.tsx        # AI tab: Chat / Similar / Author sub-tabs
│   ├── GraphTab.tsx           # Wrapper that loads graph/network.html in <browser>
│   ├── HealthPanel.tsx        # Library health dashboard
│   ├── DiscoveryPanel.tsx     # External discovery + import
│   ├── IndexQueue.tsx         # Job monitor
│   ├── Settings.tsx           # Settings panel (all sections)
│   └── components/
│       ├── ScoreChip.tsx      # Coloured similarity score badge
│       ├── StatusDot.tsx      # Green/yellow/red connection indicator
│       ├── Toggle.tsx         # On/off toggle switch
│       ├── SectionHeader.tsx  # Small uppercase section label
│       └── ConfirmDialog.tsx  # Reusable confirmation modal
├── graph/
│   └── network.html           # Self-contained D3 force graph page
addon/
├── manifest.json
├── bootstrap.js               # Zotero bootstrap shim (from scaffold)
└── prefs.js
tests/
├── api/
│   ├── client.test.ts
│   ├── chat.test.ts
│   └── search.test.ts
└── ui/
    ├── ItemPaneTab.test.tsx
    ├── HealthPanel.test.tsx
    ├── DiscoveryPanel.test.tsx
    ├── IndexQueue.test.tsx
    └── Settings.test.tsx
```

---

## Task 1: Scaffold the project with Zotero Plugin Scaffold

**Files:**
- All scaffold-generated files
- `package.json`

- [ ] **Step 1: Clone the Zotero Plugin Scaffold into the project directory**

```bash
cd /Users/danilodasilva/Documents/Programming/Apps
git clone https://github.com/windingwind/zotero-plugin-scaffold zp-scaffold-tmp
cp -r zp-scaffold-tmp/. zotero_plugin/
rm -rf zp-scaffold-tmp
cd zotero_plugin
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/danilodasilva/Documents/Programming/Apps/zotero_plugin
npm install
npm install --save-dev @types/react @types/react-dom jest @testing-library/react @testing-library/jest-dom ts-jest
npm install @phosphor-icons/react d3
npm install --save-dev @types/d3
```

- [ ] **Step 3: Update package.json name and description**

Edit `package.json`:
```json
{
  "name": "zotero-ai-companion",
  "version": "0.1.0",
  "description": "AI research companion for Zotero 7 — chat, semantic search, similarity graph, discovery",
  "scripts": {
    "build": "node scripts/build.mjs",
    "dev": "node scripts/build.mjs --watch",
    "test": "jest"
  }
}
```

- [ ] **Step 4: Update addon/manifest.json**

```json
{
  "manifest_version": 2,
  "name": "Zotero AI Companion",
  "version": "0.1.0",
  "description": "AI research companion — chat, semantic search, similarity graph, discovery",
  "applications": {
    "zotero": {
      "id": "zotero-ai-companion@dsmoz",
      "strict_min_version": "7.0"
    }
  },
  "chrome_url_overrides": {}
}
```

- [ ] **Step 5: Add Jest config to package.json**

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "setupFilesAfterFramework": ["@testing-library/jest-dom"],
  "moduleNameMapper": {
    "^zotero$": "<rootDir>/tests/__mocks__/zotero.ts"
  }
}
```

- [ ] **Step 6: Create the Zotero global mock**

```typescript
// tests/__mocks__/zotero.ts
const Zotero = {
  Prefs: {
    get: jest.fn(),
    set: jest.fn(),
  },
  Notifier: {
    registerObserver: jest.fn(),
    unregisterObserver: jest.fn(),
  },
  Items: {
    get: jest.fn(),
  },
  URI: {
    getItemURI: jest.fn(),
  },
};
export default Zotero;
(globalThis as any).Zotero = Zotero;
```

- [ ] **Step 7: Verify build works**

```bash
npm run build
```

Expected: `build/zotero-ai-companion.xpi` produced (or esbuild output in `build/`)

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: scaffold Zotero 7 plugin with TypeScript, React, D3, Phosphor"
```

---

## Task 2: Preferences module

**Files:**
- Create: `src/prefs.ts`
- Create: `tests/prefs.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/prefs.test.ts
import { getApiUrl, setApiUrl, getSyncInterval, getTheme } from '../src/prefs';

describe('prefs', () => {
  beforeEach(() => {
    (Zotero.Prefs.get as jest.Mock).mockImplementation((key: string) => {
      const defaults: Record<string, unknown> = {
        'extensions.zotero-ai.apiUrl': 'http://localhost:6500',
        'extensions.zotero-ai.syncInterval': 12,
        'extensions.zotero-ai.theme': 'auto',
      };
      return defaults[key];
    });
  });

  it('returns default API URL', () => {
    expect(getApiUrl()).toBe('http://localhost:6500');
  });

  it('returns default sync interval', () => {
    expect(getSyncInterval()).toBe(12);
  });

  it('returns default theme', () => {
    expect(getTheme()).toBe('auto');
  });

  it('sets API URL', () => {
    setApiUrl('http://localhost:7000');
    expect(Zotero.Prefs.set).toHaveBeenCalledWith('extensions.zotero-ai.apiUrl', 'http://localhost:7000');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/prefs.test.ts --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement prefs.ts**

```typescript
// src/prefs.ts
const PREFIX = 'extensions.zotero-ai';

const DEFAULTS = {
  apiUrl: 'http://localhost:6500',
  syncInterval: 12,
  syncOnStartup: true,
  autoSync: true,
  theme: 'auto',
  accentColor: 'blue',
  graphNodeSize: 'M',
  chatModel: 'google/gemma-2-9b-it',
  chatMaxChunks: 8,
  chatStream: true,
  discoveryPubmed: true,
  discoverySemanticScholar: true,
  discoveryOpenAlex: false,
  autoCascadeDelete: false,
};

type PrefKey = keyof typeof DEFAULTS;

function get<K extends PrefKey>(key: K): typeof DEFAULTS[K] {
  const val = Zotero.Prefs.get(`${PREFIX}.${key}`);
  return val !== undefined ? (val as typeof DEFAULTS[K]) : DEFAULTS[key];
}

function set<K extends PrefKey>(key: K, value: typeof DEFAULTS[K]): void {
  Zotero.Prefs.set(`${PREFIX}.${key}`, value);
}

export const getApiUrl = () => get('apiUrl');
export const setApiUrl = (v: string) => set('apiUrl', v);
export const getSyncInterval = () => get('syncInterval') as number;
export const setSyncInterval = (v: number) => set('syncInterval', v);
export const getTheme = () => get('theme') as string;
export const setTheme = (v: string) => set('theme', v as typeof DEFAULTS['theme']);
export const getAccentColor = () => get('accentColor') as string;
export const setAccentColor = (v: string) => set('accentColor', v as typeof DEFAULTS['accentColor']);
export const getGraphNodeSize = () => get('graphNodeSize') as string;
export const getChatModel = () => get('chatModel') as string;
export const getChatMaxChunks = () => get('chatMaxChunks') as number;
export const getChatStream = () => get('chatStream') as boolean;
export const getSyncOnStartup = () => get('syncOnStartup') as boolean;
export const getAutoSync = () => get('autoSync') as boolean;
export const getAutoCascadeDelete = () => get('autoCascadeDelete') as boolean;
export const getDiscoverySources = () => ({
  pubmed: get('discoveryPubmed') as boolean,
  semantic_scholar: get('discoverySemanticScholar') as boolean,
  openalex: get('discoveryOpenAlex') as boolean,
});
export { set as setPref, get as getPref };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/prefs.test.ts --no-coverage
```

Expected: all PASSED

- [ ] **Step 5: Commit**

```bash
git add src/prefs.ts tests/prefs.test.ts
git commit -m "feat: add prefs module with typed getters/setters"
```

---

## Task 3: API client (REST + SSE)

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/chat.ts`
- Create: `src/api/search.ts`
- Create: `tests/api/client.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/api/client.test.ts
import { apiFetch, ApiError } from '../../src/api/client';

global.fetch = jest.fn();

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
    const result = await apiFetch('/health');
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws ApiError on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not found' }),
    });
    await expect(apiFetch('/items/BADKEY')).rejects.toThrow(ApiError);
  });

  it('prepends base URL from prefs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await apiFetch('/search?q=test');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:6500/api/plugin/search?q=test'),
      expect.any(Object)
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/api/client.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement client.ts**

```typescript
// src/api/client.ts
import { getApiUrl } from '../prefs';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (err instanceof ApiError && err.status < 500) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  throw lastError;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiUrl();
  const url = `${base}/api/plugin${path}`;
  return withRetry(async () => {
    const resp = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try { const body = await resp.json(); msg = body.error || msg; } catch {}
      throw new ApiError(resp.status, msg);
    }
    return resp.json() as Promise<T>;
  });
}

export async function checkConnection(): Promise<{ latency: number }> {
  const start = Date.now();
  await apiFetch('/health');
  return { latency: Date.now() - start };
}
```

- [ ] **Step 4: Implement chat.ts**

```typescript
// src/api/chat.ts
import { getApiUrl, getChatMaxChunks } from '../prefs';

export interface ChatToken {
  token?: string;
  done?: boolean;
  sources?: Array<{ page: number; text?: string }>;
  error?: string;
}

export function streamChat(
  zoteroKey: string,
  question: string,
  onToken: (token: string) => void,
  onDone: (sources: ChatToken['sources']) => void,
  onError: (err: string) => void,
  maxChunks?: number
): () => void {
  const base = getApiUrl();
  const url = `${base}/api/plugin/chat/stream`;
  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      zotero_key: zoteroKey,
      question,
      max_chunks: maxChunks ?? getChatMaxChunks(),
    }),
    signal: controller.signal,
  }).then(async resp => {
    if (!resp.ok) { onError(`HTTP ${resp.status}`); return; }
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed: ChatToken = JSON.parse(line.slice(6));
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.token) onToken(parsed.token);
          if (parsed.done) onDone(parsed.sources ?? []);
        } catch {}
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') onError(String(err));
  });

  return () => controller.abort();
}
```

- [ ] **Step 5: Implement search.ts**

```typescript
// src/api/search.ts
import { apiFetch } from './client';

export interface SearchResult {
  zotero_key: string;
  title: string;
  score: number;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  itemType?: string;
}

export async function semanticSearch(query: string, limit = 6): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.results;
}

export async function similarItems(zoteroKey: string, limit = 6): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/similar/${zoteroKey}?limit=${limit}`
  );
  return data.results;
}
```

- [ ] **Step 6: Run all API tests**

```bash
npx jest tests/api/ --no-coverage
```

Expected: all PASSED

- [ ] **Step 7: Commit**

```bash
git add src/api/client.ts src/api/chat.ts src/api/search.ts tests/api/
git commit -m "feat: add API client with retry, SSE chat, and search wrappers"
```

---

## Task 4: Remaining API modules

**Files:**
- Create: `src/api/graph.ts`
- Create: `src/api/author.ts`
- Create: `src/api/discovery.ts`
- Create: `src/api/health.ts`
- Create: `src/api/jobs.ts`
- Create: `src/api/sync.ts`

- [ ] **Step 1: Create graph.ts**

```typescript
// src/api/graph.ts
import { apiFetch } from './client';

export interface GraphNode {
  id: string;
  title: string;
  collection: string;
  date: string;
  creators: Array<{ firstName: string; lastName: string }>;
  citation_count: number;
  in_library: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'semantic' | 'citation' | 'coauthor';
  weight: number;
  target_in_library: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchGraphData(
  collection?: string,
  threshold = 0.75
): Promise<GraphData> {
  const params = new URLSearchParams({ threshold: String(threshold) });
  if (collection) params.set('collection', collection);
  return apiFetch<GraphData>(`/graph/nodes?${params}`);
}
```

- [ ] **Step 2: Create author.ts**

```typescript
// src/api/author.ts
import { apiFetch } from './client';

export interface AuthorProfile {
  author: string;
  items: Array<{ key: string; title: string; date: string }>;
  coauthors: string[];
}

export async function fetchAuthorProfile(authorName: string): Promise<AuthorProfile> {
  return apiFetch<AuthorProfile>(`/author/${encodeURIComponent(authorName)}`);
}
```

- [ ] **Step 3: Create discovery.ts**

```typescript
// src/api/discovery.ts
import { apiFetch } from './client';
import { getDiscoverySources } from '../prefs';

export interface DiscoveryResult {
  title: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  source: 'pubmed' | 'semantic_scholar' | 'openalex';
  pmid?: string;
  s2_id?: string;
}

export async function discoverySearch(
  query: string,
  sourcesOverride?: string[]
): Promise<DiscoveryResult[]> {
  const prefs = getDiscoverySources();
  const sources = sourcesOverride ?? Object.entries(prefs)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
  const params = new URLSearchParams({
    q: query,
    sources: sources.join(','),
    limit: '10',
  });
  const data = await apiFetch<{ results: DiscoveryResult[] }>(`/discovery/search?${params}`);
  return data.results;
}
```

- [ ] **Step 4: Create health.ts**

```typescript
// src/api/health.ts
import { apiFetch } from './client';

export interface HealthIssue {
  zotero_key: string;
  title: string;
  issue_type: 'failed_sync' | 'missing_pdf' | 'not_indexed';
  error_message?: string;
}

export interface LibraryHealth {
  indexed: number;
  unindexed: number;
  failed: number;
  missing_pdf: number;
  issues: HealthIssue[];
}

export async function fetchLibraryHealth(): Promise<LibraryHealth> {
  return apiFetch<LibraryHealth>('/health/library');
}
```

- [ ] **Step 5: Create jobs.ts**

```typescript
// src/api/jobs.ts
import { apiFetch } from './client';

export interface Job {
  id: string;
  type: 'add_to_qdrant' | 'update_metadata' | 'sync_payload' | 'neo4j_ingest';
  title: string;
  progress?: number;
  time_remaining?: number;
  error?: string;
}

export interface JobsStatus {
  pending: Job[];
  processing: Job | null;
  failed: Job[];
  completed_count: number;
  processor_running: boolean;
}

export async function fetchJobs(): Promise<JobsStatus> {
  return apiFetch<JobsStatus>('/jobs');
}

export async function retryJob(jobId: string): Promise<void> {
  await apiFetch(`/jobs/${jobId}/retry`, { method: 'POST' });
}
```

- [ ] **Step 6: Create sync.ts**

```typescript
// src/api/sync.ts
import { apiFetch } from './client';

export interface SyncResult {
  queued: number;
  already_synced: number;
}

export async function triggerSync(): Promise<SyncResult> {
  return apiFetch<SyncResult>('/sync', { method: 'POST' });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/api/graph.ts src/api/author.ts src/api/discovery.ts src/api/health.ts src/api/jobs.ts src/api/sync.ts
git commit -m "feat: add remaining API modules (graph, author, discovery, health, jobs, sync)"
```

---

## Task 5: Shared UI components

**Files:**
- Create: `src/ui/components/ScoreChip.tsx`
- Create: `src/ui/components/StatusDot.tsx`
- Create: `src/ui/components/Toggle.tsx`
- Create: `src/ui/components/SectionHeader.tsx`
- Create: `src/ui/components/ConfirmDialog.tsx`

- [ ] **Step 1: Create ScoreChip.tsx**

```typescript
// src/ui/components/ScoreChip.tsx
import React from 'react';

interface Props { score: number; }

export function ScoreChip({ score }: Props) {
  const pct = Math.round(score * 100);
  const color = score >= 0.9 ? '#a6e3a1' : score >= 0.8 ? '#f9e2af' : '#f38ba8';
  return (
    <span style={{
      background: color, color: '#1e1e2e',
      borderRadius: 3, padding: '1px 5px',
      fontSize: '0.65rem', fontWeight: 600,
    }}>
      {pct}
    </span>
  );
}
```

- [ ] **Step 2: Create StatusDot.tsx**

```typescript
// src/ui/components/StatusDot.tsx
import React from 'react';

type Status = 'connected' | 'degraded' | 'offline';

interface Props { status: Status; latency?: number; }

const COLOR: Record<Status, string> = {
  connected: '#a6e3a1',
  degraded: '#f9e2af',
  offline: '#f38ba8',
};

export function StatusDot({ status, latency }: Props) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: COLOR[status], display: 'inline-block',
      }} />
      <span style={{ fontSize: '0.7rem', color: COLOR[status] }}>
        {status === 'connected' ? `Connected${latency ? ` · ${latency}ms` : ''}` : status}
      </span>
    </span>
  );
}
```

- [ ] **Step 3: Create Toggle.tsx**

```typescript
// src/ui/components/Toggle.tsx
import React from 'react';

interface Props { checked: boolean; onChange: (v: boolean) => void; }

export function Toggle({ checked, onChange }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        background: checked ? '#a6e3a1' : '#45475a',
        border: 'none', borderRadius: 10, width: 34, height: 18,
        position: 'relative', cursor: 'pointer', padding: 0,
      }}
    >
      <span style={{
        width: 14, height: 14, background: 'white', borderRadius: '50%',
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        transition: 'left 0.15s',
      }} />
    </button>
  );
}
```

- [ ] **Step 4: Create SectionHeader.tsx**

```typescript
// src/ui/components/SectionHeader.tsx
import React from 'react';

interface Props { children: React.ReactNode; }

export function SectionHeader({ children }: Props) {
  return (
    <div style={{
      color: 'var(--accent, #89b4fa)',
      fontWeight: 700, fontSize: '0.7rem',
      letterSpacing: '0.08em', marginBottom: '0.5rem',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Create ConfirmDialog.tsx**

```typescript
// src/ui/components/ConfirmDialog.tsx
import React from 'react';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg, #1e1e2e)', border: '1px solid #444',
        borderRadius: 8, padding: '1.5rem', maxWidth: 360,
      }}>
        <p style={{ color: 'var(--text, #cdd6f4)', marginBottom: '1rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '1px solid #444',
            color: '#cdd6f4', borderRadius: 4, padding: '0.25rem 0.75rem', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: '#f38ba8', border: 'none',
            color: '#1e1e2e', borderRadius: 4, padding: '0.25rem 0.75rem', cursor: 'pointer',
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/components/
git commit -m "feat: add shared UI components (ScoreChip, StatusDot, Toggle, SectionHeader, ConfirmDialog)"
```

---

## Task 6: Settings panel

**Files:**
- Create: `src/ui/Settings.tsx`
- Create: `tests/ui/Settings.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// tests/ui/Settings.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from '../../src/ui/Settings';

jest.mock('../../src/api/client', () => ({
  checkConnection: jest.fn().mockResolvedValue({ latency: 34 }),
  ApiError: class ApiError extends Error {},
}));
jest.mock('../../src/api/sync', () => ({
  triggerSync: jest.fn().mockResolvedValue({ queued: 5, already_synced: 1200 }),
}));

describe('Settings', () => {
  it('renders all sections', () => {
    render(<Settings />);
    expect(screen.getByText('APPEARANCE')).toBeInTheDocument();
    expect(screen.getByText('BACKEND CONNECTION')).toBeInTheDocument();
    expect(screen.getByText('SYNC SCHEDULING')).toBeInTheDocument();
    expect(screen.getByText('CHAT')).toBeInTheDocument();
    expect(screen.getByText('DISCOVERY SOURCES')).toBeInTheDocument();
    expect(screen.getByText('DANGER ZONE')).toBeInTheDocument();
  });

  it('Sync now button calls triggerSync', async () => {
    const { triggerSync } = require('../../src/api/sync');
    render(<Settings />);
    fireEvent.click(screen.getByText('Sync now'));
    expect(triggerSync).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/ui/Settings.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement Settings.tsx**

```typescript
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
  getSyncOnStartup, getDiscoverySources, setPref,
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
        <SectionHeader>Appearance</SectionHeader>
        {row('Theme', segmented(['Auto', 'Light', 'Dark'], theme, v => { setThemeState(v); setTheme(v.toLowerCase()); }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>Backend Connection</SectionHeader>
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
        <SectionHeader>Sync Scheduling</SectionHeader>
        {row('Auto-sync', <Toggle checked={autoSync} onChange={v => { setAutoSyncState(v); setPref('autoSync', v); }} />)}
        {row('Interval', segmented(['6h', '12h', '24h', '48h'], `${syncInterval}h`, v => {
          const n = parseInt(v); setSyncIntervalState(n); setSyncInterval(n);
        }))}
        {row('Sync on startup', <Toggle checked={syncOnStartup} onChange={v => { setSyncOnStartupState(v); setPref('syncOnStartup', v); }} />)}
        <button onClick={handleSyncNow} disabled={syncing} style={{ fontSize: '0.7rem', padding: '3px 10px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowsClockwise size={12} /> {syncing ? 'Syncing...' : 'Sync now'}
        </button>
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>Chat</SectionHeader>
        {row('LLM model',
          <input value={chatModel} onChange={e => setChatModelState(e.target.value)}
            onBlur={() => setPref('chatModel', chatModel)}
            style={{ width: 180, fontSize: '0.75rem', padding: '3px 6px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }} />
        )}
        {row('Max chunks', segmented(['4', '8', '12', '20'], String(chatMaxChunks), v => {
          const n = parseInt(v); setChatMaxChunksState(n); setPref('chatMaxChunks', n);
        }))}
      </section>

      <section style={{ borderBottom: '1px solid #313244', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
        <SectionHeader>Discovery Sources</SectionHeader>
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
        <SectionHeader>Danger Zone</SectionHeader>
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/ui/Settings.test.tsx --no-coverage
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/ui/Settings.tsx tests/ui/Settings.test.tsx
git commit -m "feat: add Settings panel with theme, backend, sync, chat, discovery sections"
```

---

## Task 7: Item Pane Tab

**Files:**
- Create: `src/ui/ItemPaneTab.tsx`
- Create: `tests/ui/ItemPaneTab.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// tests/ui/ItemPaneTab.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemPaneTab } from '../../src/ui/ItemPaneTab';

jest.mock('../../src/api/chat', () => ({
  streamChat: jest.fn((key, q, onToken, onDone) => {
    onToken('The answer is 42');
    onDone([{ page: 4 }]);
    return () => {};
  }),
}));
jest.mock('../../src/api/search', () => ({
  similarItems: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../src/api/author', () => ({
  fetchAuthorProfile: jest.fn().mockResolvedValue({ author: 'Smith J', items: [], coauthors: [] }),
}));

describe('ItemPaneTab', () => {
  it('renders Chat tab by default', () => {
    render(<ItemPaneTab zoteroKey="ABC123" title="Test Paper" authors={[]} />);
    expect(screen.getByPlaceholderText(/ask about this paper/i)).toBeInTheDocument();
  });

  it('sends question and displays streamed response', async () => {
    const { streamChat } = require('../../src/api/chat');
    render(<ItemPaneTab zoteroKey="ABC123" title="Test Paper" authors={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/ask about this paper/i), {
      target: { value: 'What are the barriers?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(streamChat).toHaveBeenCalledWith(
      'ABC123', 'What are the barriers?',
      expect.any(Function), expect.any(Function), expect.any(Function), undefined
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/ui/ItemPaneTab.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement ItemPaneTab.tsx**

```typescript
// src/ui/ItemPaneTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, MagnifyingGlass, User, Chat } from '@phosphor-icons/react';
import { streamChat } from '../api/chat';
import { similarItems, SearchResult } from '../api/search';
import { fetchAuthorProfile, AuthorProfile } from '../api/author';
import { ScoreChip } from './components/ScoreChip';

type SubTab = 'chat' | 'similar' | 'author';
interface Message { role: 'user' | 'assistant'; text: string; sources?: Array<{ page: number }> }

interface Props {
  zoteroKey: string;
  title: string;
  authors: Array<{ firstName: string; lastName: string }>;
}

export function ItemPaneTab({ zoteroKey, title, authors }: Props) {
  const [tab, setTab] = useState<SubTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [similar, setSimilar] = useState<SearchResult[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (tab === 'similar') loadSimilar();
  }, [tab, zoteroKey]);

  async function loadSimilar() {
    const results = await similarItems(zoteroKey);
    setSimilar(results);
  }

  async function loadAuthor(name: string) {
    setSelectedAuthor(name);
    const profile = await fetchAuthorProfile(name);
    setAuthorProfile(profile);
  }

  function sendMessage() {
    if (!input.trim() || streaming) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setStreaming(true);
    let buffer = '';
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    cancelRef.current = streamChat(
      zoteroKey, question,
      (token) => {
        buffer += token;
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer }]);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      (sources) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: buffer, sources }]);
        setStreaming(false);
      },
      (err) => {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: `Error: ${err}` }]);
        setStreaming(false);
      }
    );
  }

  const tabBtn = (id: SubTab, icon: React.ReactNode, label: string) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? '#313244' : 'transparent',
      border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem',
      color: tab === id ? 'var(--accent, #89b4fa)' : '#6c7086',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid #313244' }}>
        {tabBtn('chat', <Chat size={12} />, 'Chat')}
        {tabBtn('similar', <MagnifyingGlass size={12} />, 'Similar')}
        {tabBtn('author', <User size={12} />, 'Author')}
      </div>

      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ textAlign: 'center', color: '#6c7086', fontSize: '0.7rem', padding: '4px 0' }}>
              Chatting with: {title}
            </div>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#313244' : '#1e1e2e',
                border: m.role === 'assistant' ? '1px solid #444' : 'none',
                borderRadius: 6, padding: '6px 10px', maxWidth: '90%', color: '#cdd6f4',
              }}>
                {m.text}
                {m.sources && m.sources.length > 0 && (
                  <div style={{ color: '#6c7086', fontSize: '0.65rem', marginTop: 4 }}>
                    p.{m.sources.map(s => s.page).join(', ')} · {m.sources.length} chunk{m.sources.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '6px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about this paper..."
              style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4' }}
            />
            <button onClick={sendMessage} disabled={streaming} aria-label="Send" style={{
              background: 'var(--accent, #89b4fa)', border: 'none', borderRadius: 4,
              padding: '4px 8px', cursor: 'pointer', color: '#1e1e2e',
            }}>
              <PaperPlaneTilt size={14} weight="fill" />
            </button>
          </div>
        </>
      )}

      {tab === 'similar' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {similar.length === 0 && <div style={{ color: '#6c7086', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>}
          {similar.map(item => (
            <div key={item.zotero_key} style={{ background: '#313244', borderRadius: 6, padding: '6px 8px' }}>
              <div style={{ color: '#cdd6f4', marginBottom: 2 }}>{item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#6c7086', fontSize: '0.65rem' }}>
                  {item.creators?.[0]?.lastName ?? ''}{item.date ? ` · ${item.date}` : ''}
                </span>
                <ScoreChip score={item.score} />
                <span style={{ marginLeft: 'auto', color: 'var(--accent, #89b4fa)', fontSize: '0.65rem', cursor: 'pointer' }}>
                  open
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'author' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {!selectedAuthor ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#6c7086', fontSize: '0.7rem', marginBottom: 4 }}>Select an author:</div>
              {authors.map(a => {
                const name = `${a.firstName} ${a.lastName}`.trim();
                return (
                  <button key={name} onClick={() => loadAuthor(name)} style={{
                    background: '#313244', border: 'none', borderRadius: 6,
                    padding: '6px 8px', color: '#cdd6f4', cursor: 'pointer', textAlign: 'left',
                  }}>
                    {name}
                  </button>
                );
              })}
            </div>
          ) : authorProfile ? (
            <div>
              <button onClick={() => { setSelectedAuthor(null); setAuthorProfile(null); }} style={{
                background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)',
                fontSize: '0.7rem', cursor: 'pointer', marginBottom: 8, padding: 0,
              }}>Back</button>
              <div style={{ fontWeight: 600, color: '#cdd6f4', marginBottom: 4 }}>{authorProfile.author}</div>
              <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 8 }}>
                {authorProfile.items.length} papers in library
              </div>
              {authorProfile.coauthors.length > 0 && (
                <div style={{ color: '#6c7086', fontSize: '0.65rem', marginBottom: 8 }}>
                  Co-authors: {authorProfile.coauthors.slice(0, 5).join(', ')}
                </div>
              )}
              {authorProfile.items.map(item => (
                <div key={item.key} style={{ background: '#313244', borderRadius: 4, padding: '4px 8px', marginBottom: 4 }}>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{item.title}</div>
                  <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>{item.date}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/ui/ItemPaneTab.test.tsx --no-coverage
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/ui/ItemPaneTab.tsx tests/ui/ItemPaneTab.test.tsx
git commit -m "feat: add ItemPaneTab with Chat, Similar, and Author sub-tabs"
```

---

## Task 8: Health Dashboard, Discovery Panel, Index Queue

**Files:**
- Create: `src/ui/HealthPanel.tsx`
- Create: `src/ui/DiscoveryPanel.tsx`
- Create: `src/ui/IndexQueue.tsx`
- Create: `tests/ui/HealthPanel.test.tsx`
- Create: `tests/ui/DiscoveryPanel.test.tsx`
- Create: `tests/ui/IndexQueue.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/ui/HealthPanel.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HealthPanel } from '../../src/ui/HealthPanel';

jest.mock('../../src/api/health', () => ({
  fetchLibraryHealth: jest.fn().mockResolvedValue({
    indexed: 1204, unindexed: 43, failed: 12, missing_pdf: 27, issues: [
      { zotero_key: 'ABC', title: 'Test Paper', issue_type: 'failed_sync', error_message: 'embedding error' }
    ]
  }),
}));

it('renders health summary cards', async () => {
  render(<HealthPanel />);
  expect(await screen.findByText('1204')).toBeInTheDocument();
  expect(await screen.findByText('43')).toBeInTheDocument();
});
```

```typescript
// tests/ui/DiscoveryPanel.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoveryPanel } from '../../src/ui/DiscoveryPanel';

jest.mock('../../src/api/discovery', () => ({
  discoverySearch: jest.fn().mockResolvedValue([
    { title: 'PrEP in MSM', authors: ['Smith J'], journal: 'Lancet', year: '2023', doi: '', source: 'pubmed' }
  ]),
}));

it('displays discovery results after search', async () => {
  render(<DiscoveryPanel seedQuery="PrEP MSM" />);
  fireEvent.click(screen.getByText('Search'));
  expect(await screen.findByText('PrEP in MSM')).toBeInTheDocument();
});
```

```typescript
// tests/ui/IndexQueue.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndexQueue } from '../../src/ui/IndexQueue';

jest.mock('../../src/api/jobs', () => ({
  fetchJobs: jest.fn().mockResolvedValue({
    pending: [{ id: '1', type: 'add_to_qdrant', title: 'Community Health Worker Models' }],
    processing: null, failed: [], completed_count: 1204, processor_running: true
  }),
  retryJob: jest.fn(),
}));

it('renders pending jobs', async () => {
  render(<IndexQueue />);
  expect(await screen.findByText('Community Health Worker Models')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/ui/HealthPanel.test.tsx tests/ui/DiscoveryPanel.test.tsx tests/ui/IndexQueue.test.tsx --no-coverage
```

Expected: all FAIL

- [ ] **Step 3: Implement HealthPanel.tsx**

```typescript
// src/ui/HealthPanel.tsx
import React, { useState, useEffect } from 'react';
import { SectionHeader } from './components/SectionHeader';
import { fetchLibraryHealth, LibraryHealth, HealthIssue } from '../api/health';

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

  useEffect(() => { load(); }, []);

  async function load() {
    const h = await fetchLibraryHealth();
    setHealth(h);
  }

  const filtered = health?.issues.filter(i => !filter || i.issue_type === filter) ?? [];

  const card = (label: string, value: number, type: string | null, color: string) => (
    <button onClick={() => setFilter(filter === type ? null : type)} style={{
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
          <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
            {card('Indexed', health.indexed, null, '#a6e3a1')}
            {card('Unindexed', health.unindexed, 'not_indexed', '#89b4fa')}
            {card('Failed', health.failed, 'failed_sync', '#f38ba8')}
            {card('No PDF', health.missing_pdf, 'missing_pdf', '#f9e2af')}
          </div>
          <SectionHeader>Issues</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '0.75rem' }}>
            {filtered.length === 0 && (
              <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>No issues</div>
            )}
            {filtered.map(issue => (
              <div key={issue.zotero_key} style={{
                background: '#1e1e2e',
                borderLeft: `3px solid ${ISSUE_COLORS[issue.issue_type]}`,
                borderRadius: 4, padding: '6px 8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ color: '#cdd6f4' }}>{issue.title}</div>
                  <div style={{ color: ISSUE_COLORS[issue.issue_type], fontSize: '0.65rem' }}>
                    {ISSUE_LABELS[issue.issue_type]}
                    {issue.error_message ? ` · ${issue.error_message}` : ''}
                  </div>
                </div>
                <span style={{ color: 'var(--accent, #89b4fa)', fontSize: '0.7rem', cursor: 'pointer' }}>
                  {ISSUE_ACTIONS[issue.issue_type]}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
              Retry all failed
            </button>
            <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
              Index all pending
            </button>
            <button style={{ fontSize: '0.7rem', padding: '3px 8px', border: '1px solid #f38ba8', color: '#f38ba8', background: 'transparent', borderRadius: 4, cursor: 'pointer' }}>
              Fix orphans
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement DiscoveryPanel.tsx**

```typescript
// src/ui/DiscoveryPanel.tsx
import React, { useState } from 'react';
import { Plus, Check } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading && <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>Searching...</div>}
        {results.map((r, i) => (
          <div key={i} onClick={() => toggleSelect(i)} style={{
            background: '#313244', borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
            border: selected.has(i) ? '1px solid var(--accent, #89b4fa)' : '1px solid transparent',
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
```

- [ ] **Step 5: Implement IndexQueue.tsx**

```typescript
// src/ui/IndexQueue.tsx
import React, { useState, useEffect } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { StatusDot } from './components/StatusDot';
import { fetchJobs, retryJob, JobsStatus, Job } from '../api/jobs';

export function IndexQueue() {
  const [status, setStatus] = useState<JobsStatus | null>(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const s = await fetchJobs();
    setStatus(s);
  }

  async function handleRetry(jobId: string) {
    await retryJob(jobId);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: '#cdd6f4' }}>Processor</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot status={status?.processor_running ? 'connected' : 'offline'} />
            <button style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'transparent', border: '1px solid #444', borderRadius: 3, color: '#6c7086', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              {status?.processor_running ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Resume</>}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
          <span style={{ color: '#f9e2af' }}>● {status?.pending.length ?? 0} pending</span>
          <span style={{ color: '#89b4fa' }}>● {status?.processing ? 1 : 0} processing</span>
          <span style={{ color: '#a6e3a1' }}>● {status?.completed_count ?? 0} done</span>
          <span style={{ color: '#f38ba8' }}>● {status?.failed.length ?? 0} failed</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {status?.processing && (
          <>
            <SectionHeader>Processing Now</SectionHeader>
            <div style={{ background: '#1e1e2e', borderRadius: 6, padding: '6px 8px', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#cdd6f4' }}>{status.processing.title}</span>
                <span style={{ color: 'var(--accent, #89b4fa)', fontSize: '0.65rem' }}>{status.processing.type}</span>
              </div>
              {status.processing.progress !== undefined && (
                <div style={{ background: '#313244', borderRadius: 4, height: 4 }}>
                  <div style={{ background: 'var(--accent, #89b4fa)', height: 4, borderRadius: 4, width: `${status.processing.progress}%`, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
          </>
        )}

        {status?.pending && status.pending.length > 0 && (
          <>
            <SectionHeader>Pending</SectionHeader>
            {status.pending.map(job => (
              <div key={job.id} style={{ background: '#313244', borderRadius: 5, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{job.title}</div>
                  <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>{job.type}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {status?.failed && status.failed.length > 0 && (
          <>
            <SectionHeader>Failed</SectionHeader>
            {status.failed.map(job => (
              <div key={job.id} style={{ background: '#1e1e2e', borderLeft: '3px solid #f38ba8', borderRadius: 4, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{job.title}</div>
                  <div style={{ color: '#f38ba8', fontSize: '0.65rem' }}>{job.error}</div>
                </div>
                <button onClick={() => handleRetry(job.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)', fontSize: '0.7rem', cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ padding: '6px 8px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
        <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
          Retry all failed
        </button>
        <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
          Clear completed
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run all three tests**

```bash
npx jest tests/ui/HealthPanel.test.tsx tests/ui/DiscoveryPanel.test.tsx tests/ui/IndexQueue.test.tsx --no-coverage
```

Expected: all PASSED

- [ ] **Step 7: Commit**

```bash
git add src/ui/HealthPanel.tsx src/ui/DiscoveryPanel.tsx src/ui/IndexQueue.tsx tests/ui/
git commit -m "feat: add HealthPanel, DiscoveryPanel, IndexQueue components"
```

---

## Task 9: D3 Graph — network.html

**Files:**
- Create: `src/graph/network.html`
- Create: `src/ui/GraphTab.tsx`

- [ ] **Step 1: Create the self-contained D3 graph page**

Note: The tooltip uses safe DOM methods (`createElement`, `textContent`, `appendChild`) — no `innerHTML` — to avoid XSS.

```html
<!-- src/graph/network.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #11111b; overflow: hidden; font-family: system-ui, sans-serif; }
    #graph { width: 100vw; height: 100vh; }
    .node circle { cursor: pointer; stroke-width: 1.5; }
    .node text { font-size: 9px; fill: #cdd6f4; pointer-events: none; user-select: none; }
    .link { stroke-opacity: 0.5; }
    #tooltip {
      position: absolute; top: 8px; right: 8px;
      background: #1e1e2e; border: 1px solid #444; border-radius: 6px;
      padding: 8px 10px; font-size: 11px; max-width: 160px;
      display: none;
    }
    #controls {
      position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px;
    }
    .ctrl-btn {
      background: #1e1e2e; border: 1px solid #444; border-radius: 4px;
      padding: 3px 8px; color: #cdd6f4; font-size: 11px; cursor: pointer;
    }
    .ctrl-btn:hover { background: #313244; }
    .ctrl-btn.danger { color: #f38ba8; }
  </style>
</head>
<body>
  <svg id="graph"></svg>
  <div id="tooltip"></div>
  <div id="controls">
    <button class="ctrl-btn" id="btn-fit">Fit</button>
    <button class="ctrl-btn" id="btn-zoomin">+</button>
    <button class="ctrl-btn" id="btn-zoomout">−</button>
    <button class="ctrl-btn" id="btn-export">Export PNG</button>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
  <script>
    const EDGE_COLORS = { semantic: '#89b4fa', citation: '#f9e2af', coauthor: '#6c7086' };
    const ACCENT = '#89b4fa';

    const svg = d3.select('#graph');
    const g = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('collision', d3.forceCollide(20))
      .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Active node key for safe postMessage calls
    let activeNodeKey = null;

    function buildTooltip(node) {
      const tt = document.getElementById('tooltip');
      // Clear previous content safely
      while (tt.firstChild) tt.removeChild(tt.firstChild);

      const titleEl = document.createElement('div');
      titleEl.textContent = (node.title || '').slice(0, 40);
      titleEl.style.cssText = 'color:' + ACCENT + ';font-weight:600;margin-bottom:4px';
      tt.appendChild(titleEl);

      const creators = (node.creators || []).map(c => c.lastName || '').filter(Boolean);
      const metaEl = document.createElement('div');
      metaEl.textContent = creators.slice(0, 2).join(', ') + (node.date ? ' · ' + node.date : '');
      metaEl.style.cssText = 'color:#6c7086;margin-bottom:6px';
      tt.appendChild(metaEl);

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:4px';

      [
        { label: 'Open', type: 'openItem', danger: false },
        { label: 'Chat', type: 'chatItem', danger: false },
        { label: 'Delete', type: 'deleteItem', danger: true },
      ].forEach(({ label, type, danger }) => {
        const btn = document.createElement('button');
        btn.className = 'ctrl-btn' + (danger ? ' danger' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => {
          window.parent?.postMessage({ type, zoteroKey: node.id }, '*');
        });
        actions.appendChild(btn);
      });

      tt.appendChild(actions);
      activeNodeKey = node.id;
      tt.style.display = 'block';
    }

    function render(data) {
      g.selectAll('*').remove();

      const links = g.append('g').selectAll('line')
        .data(data.edges).enter().append('line')
        .attr('class', 'link')
        .attr('stroke', d => EDGE_COLORS[d.type] || '#444')
        .attr('stroke-width', d => Math.max(0.5, d.weight * 3));

      const nodes = g.append('g').selectAll('.node')
        .data(data.nodes).enter().append('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        )
        .on('click', (e, d) => {
          buildTooltip(d);
          window.parent?.postMessage({ type: 'nodeClick', zoteroKey: d.id }, '*');
        });

      const nodeSize = d => Math.max(6, Math.min(18, 6 + (d.citation_count || 0) * 0.5));

      nodes.append('circle')
        .attr('r', nodeSize)
        .attr('fill', d => colorScale(d.collection || 'default'))
        .attr('stroke', d => d.in_library ? 'transparent' : '#888')
        .attr('stroke-dasharray', d => d.in_library ? 'none' : '3,2');

      nodes.append('text')
        .attr('dy', d => nodeSize(d) + 10)
        .attr('text-anchor', 'middle')
        .text(d => (d.title || '').slice(0, 25));

      simulation.nodes(data.nodes).on('tick', () => {
        links
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodes.attr('transform', d => `translate(${d.x},${d.y})`);
      });

      simulation.force('link').links(data.edges);
      simulation.alpha(1).restart();
    }

    svg.on('click', e => {
      if (e.target.tagName === 'svg' || e.target.tagName === 'g') {
        document.getElementById('tooltip').style.display = 'none';
        activeNodeKey = null;
      }
    });

    function fitGraph() {
      const bounds = g.node().getBBox();
      const w = window.innerWidth, h = window.innerHeight;
      const scale = 0.85 / Math.max(bounds.width / w, bounds.height / h);
      const tx = w / 2 - scale * (bounds.x + bounds.width / 2);
      const ty = h / 2 - scale * (bounds.y + bounds.height / 2);
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    function exportPNG() {
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      const svgEl = document.getElementById('graph');
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = 'graph.png';
        a.href = canvas.toDataURL();
        a.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }

    document.getElementById('btn-fit').addEventListener('click', fitGraph);
    document.getElementById('btn-zoomin').addEventListener('click', () => zoom.scaleBy(svg, 1.3));
    document.getElementById('btn-zoomout').addEventListener('click', () => zoom.scaleBy(svg, 0.77));
    document.getElementById('btn-export').addEventListener('click', exportPNG);

    window.addEventListener('message', e => {
      if (e.data?.type === 'graphData') render(e.data.payload);
    });

    window.addEventListener('resize', () => {
      simulation.force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));
      simulation.alpha(0.3).restart();
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Create GraphTab.tsx**

```typescript
// src/ui/GraphTab.tsx
import React, { useEffect, useRef, useState } from 'react';
import { fetchGraphData } from '../api/graph';

interface Props {
  onSelectItem?: (zoteroKey: string) => void;
  onChatItem?: (zoteroKey: string) => void;
  onDeleteItem?: (zoteroKey: string) => void;
}

export function GraphTab({ onSelectItem, onChatItem, onDeleteItem }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectItem, onChatItem, onDeleteItem]);

  function handleMessage(e: MessageEvent) {
    if (typeof e.data?.zoteroKey !== 'string') return;
    const key = e.data.zoteroKey;
    if (e.data.type === 'nodeClick' || e.data.type === 'openItem') onSelectItem?.(key);
    if (e.data.type === 'chatItem') onChatItem?.(key);
    if (e.data.type === 'deleteItem') onDeleteItem?.(key);
  }

  async function onFrameLoad() {
    const data = await fetchGraphData(undefined, 0.75);
    frameRef.current?.contentWindow?.postMessage({ type: 'graphData', payload: data }, '*');
    setLoading(false);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#11111b', color: '#6c7086', zIndex: 1 }}>
          Loading graph...
        </div>
      )}
      <iframe
        ref={frameRef}
        src="chrome://zotero-ai-companion/content/graph/network.html"
        onLoad={onFrameLoad}
        style={{ border: 'none', width: '100%', height: '100%' }}
        title="Similarity Graph"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/graph/network.html src/ui/GraphTab.tsx
git commit -m "feat: add D3 force-directed graph (network.html) and GraphTab wrapper"
```

---

## Task 10: Plugin core (bootstrap, events, menu)

**Files:**
- Create: `src/events.ts`
- Create: `src/menu.ts`
- Create: `src/bootstrap.ts`

- [ ] **Step 1: Create events.ts**

```typescript
// src/events.ts
import { getApiUrl, getAutoCascadeDelete } from './prefs';

let notifierID: string | null = null;

export function registerEventHooks() {
  notifierID = Zotero.Notifier.registerObserver(
    {
      notify: async (event: string, type: string, ids: number[]) => {
        if (type !== 'item') return;
        if (event === 'add') {
          for (const id of ids) {
            const item = Zotero.Items.get(id);
            if (item && item.isRegularItem()) {
              await queueSync();
            }
          }
        }
        if (event === 'modify') {
          await queueSync();
        }
      },
    },
    ['item']
  );
}

export function unregisterEventHooks() {
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    notifierID = null;
  }
}

async function queueSync() {
  try {
    await fetch(`${getApiUrl()}/api/plugin/sync`, { method: 'POST' });
  } catch (e) {
    console.warn('[AI Companion] Failed to queue sync:', e);
  }
}
```

- [ ] **Step 2: Create menu.ts**

```typescript
// src/menu.ts

export function registerMenus(win: Window) {
  const doc = win.document;
  const toolsMenu = doc.getElementById('menu_ToolsPopup');
  if (!toolsMenu) return;

  const menu = doc.createXULElement('menu');
  menu.setAttribute('label', 'AI Companion');
  menu.setAttribute('id', 'zotero-ai-menu');

  const popup = doc.createXULElement('menupopup');

  const items: Array<{ id: string; label: string; command: string }> = [
    { id: 'zotero-ai-graph', label: 'Similarity Graph', command: 'openGraph' },
    { id: 'zotero-ai-discovery', label: 'Discovery', command: 'openDiscovery' },
    { id: 'zotero-ai-health', label: 'Library Health', command: 'openHealth' },
    { id: 'zotero-ai-queue', label: 'Index Queue', command: 'openQueue' },
    { id: 'zotero-ai-settings', label: 'Settings', command: 'openSettings' },
  ];

  for (const item of items) {
    const menuitem = doc.createXULElement('menuitem');
    menuitem.setAttribute('id', item.id);
    menuitem.setAttribute('label', item.label);
    menuitem.addEventListener('command', () =>
      win.dispatchEvent(new CustomEvent('zotero-ai-command', { detail: { command: item.command } }))
    );
    popup.appendChild(menuitem);
  }

  menu.appendChild(popup);
  toolsMenu.appendChild(menu);
}

export function registerContextMenu(win: Window) {
  const doc = win.document;
  const itemContextMenu = doc.getElementById('zotero-itemmenu');
  if (!itemContextMenu) return;

  const deleteItem = doc.createXULElement('menuitem');
  deleteItem.setAttribute('id', 'zotero-ai-cascade-delete');
  deleteItem.setAttribute('label', 'Delete with AI cleanup');
  deleteItem.addEventListener('command', () =>
    win.dispatchEvent(new CustomEvent('zotero-ai-command', { detail: { command: 'cascadeDelete' } }))
  );
  itemContextMenu.appendChild(deleteItem);
}
```

- [ ] **Step 3: Create bootstrap.ts**

```typescript
// src/bootstrap.ts
import { registerEventHooks, unregisterEventHooks } from './events';
import { registerMenus, registerContextMenu } from './menu';
import { getApiUrl, getSyncOnStartup, getAutoSync, getSyncInterval } from './prefs';
import { triggerSync } from './api/sync';

let syncTimer: ReturnType<typeof setInterval> | null = null;

export async function startup({ rootURI }: { id: string; version: string; rootURI: string }) {
  registerEventHooks();

  for (const win of Zotero.getMainWindows()) {
    initWindow(win);
  }

  if (getSyncOnStartup()) {
    try { await triggerSync(); } catch (e) { console.warn('[AI Companion] Startup sync failed:', e); }
  }

  scheduleSync();
}

export function shutdown() {
  unregisterEventHooks();
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
}

function initWindow(win: Window) {
  registerMenus(win);
  registerContextMenu(win);
  win.addEventListener('zotero-ai-command', (e: Event) =>
    handleCommand((e as CustomEvent).detail.command, win)
  );
}

function scheduleSync() {
  if (syncTimer) clearInterval(syncTimer);
  if (!getAutoSync()) return;
  const intervalMs = getSyncInterval() * 60 * 60 * 1000;
  syncTimer = setInterval(async () => {
    try { await triggerSync(); } catch (e) { console.warn('[AI Companion] Scheduled sync failed:', e); }
  }, intervalMs);
}

async function handleCommand(command: string, win: Window) {
  switch (command) {
    case 'openGraph':
    case 'openDiscovery':
    case 'openHealth':
    case 'openQueue':
    case 'openSettings':
      Zotero.getActiveZoteroPane()?.openTab(`zotero-ai-${command.replace('open', '').toLowerCase()}`);
      break;
    case 'cascadeDelete': {
      const selectedItems = Zotero.getActiveZoteroPane()?.getSelectedItems() ?? [];
      for (const item of selectedItems) {
        const title = item.getField('title');
        const confirmed = win.confirm(
          `Delete "${title}" from Zotero, Qdrant, synctracker, and Neo4j?`
        );
        if (confirmed) {
          try {
            await fetch(`${getApiUrl()}/api/plugin/items/${item.key}`, { method: 'DELETE' });
            await Zotero.Items.trashTx([item.id]);
          } catch (e) {
            console.error('[AI Companion] Cascade delete failed:', e);
          }
        }
      }
      break;
    }
  }
}
```

- [ ] **Step 4: Build and verify no TypeScript errors**

```bash
cd /Users/danilodasilva/Documents/Programming/Apps/zotero_plugin
npm run build 2>&1
```

Expected: build succeeds, zero TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap.ts src/events.ts src/menu.ts
git commit -m "feat: add plugin core — bootstrap, event hooks, menus, cascade delete"
```

---

## Task 11: Wire Item Pane Tab into Zotero + install

**Files:**
- Modify: `src/bootstrap.ts`

- [ ] **Step 1: Add item pane section registration in bootstrap.ts startup()**

Add inside the `startup()` function, after `scheduleSync()`:

```typescript
// Register the AI tab in the Zotero item pane
Zotero.ItemPaneManager.registerSection({
  paneID: 'zotero-ai-companion',
  pluginID: 'zotero-ai-companion@dsmoz',
  header: {
    l10nID: 'ai-companion-header',
    icon: `${rootURI}content/icons/icon16.png`,
  },
  sidenav: {
    l10nID: 'ai-companion-sidenav',
    icon: `${rootURI}content/icons/icon20.png`,
  },
  onRender: ({ body, item }: { body: HTMLElement; item: any }) => {
    const { createRoot } = require('react-dom/client');
    const { createElement } = require('react');
    const { ItemPaneTab } = require('./ui/ItemPaneTab');

    const authors = item.getCreators().map((c: any) => ({
      firstName: c.firstName || '',
      lastName: c.lastName || '',
    }));

    const root = createRoot(body);
    root.render(createElement(ItemPaneTab, {
      zoteroKey: item.key,
      title: item.getField('title'),
      authors,
    }));

    return () => root.unmount();
  },
});
```

- [ ] **Step 2: Build the XPI**

```bash
npm run build
ls -lh build/zotero-ai-companion.xpi
```

Expected: XPI file present, > 100KB

- [ ] **Step 3: Install in Zotero**

1. Open Zotero
2. Tools > Add-ons > gear icon > Install Add-on From File
3. Select `build/zotero-ai-companion.xpi`
4. Restart Zotero when prompted

- [ ] **Step 4: Smoke test**

With Flask running on `:6500`:
- Select a library item → confirm "AI" tab appears in right panel
- Click AI tab → see Chat / Similar / Author sub-tabs
- Tools > AI Companion → see Graph, Discovery, Health, Queue, Settings

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap.ts
git commit -m "feat: register ItemPaneTab in Zotero item pane and ship v0.1.0"
```

---

## Task 12: Full test suite + end-to-end verification

- [ ] **Step 1: Run all unit tests**

```bash
cd /Users/danilodasilva/Documents/Programming/Apps/zotero_plugin
npx jest --no-coverage
```

Expected: all PASSED

- [ ] **Step 2: Build final XPI**

```bash
npm run build
ls -lh build/zotero-ai-companion.xpi
```

Expected: file present

- [ ] **Step 3: End-to-end checklist**

| # | Action | Expected |
|---|---|---|
| 1 | Select indexed item → AI tab → Chat → ask question | Tokens stream in, page citations appear below answer |
| 2 | AI tab → Similar | 6 results with ScoreChip badges |
| 3 | Tools → AI Companion → Similarity Graph | D3 force network loads, nodes draggable, zoom works, Fit button works |
| 4 | Graph → click a node | Tooltip appears with Open / Chat / Delete buttons |
| 5 | Tools → AI Companion → Discovery → search "PrEP MSM" | PubMed results appear |
| 6 | Discovery → select 2 results → Import | Items appear in Zotero library |
| 7 | Tools → AI Companion → Library Health | Indexed/unindexed/failed counts shown |
| 8 | Tools → AI Companion → Index Queue | Pending jobs listed, auto-refreshes every 5s |
| 9 | Right-click item → Delete with AI cleanup → Confirm | Item removed from Zotero, Qdrant, synctracker |
| 10 | Settings → Test connection | Green dot + latency ms |
| 11 | Settings → Sync now | Sync fires, queue populates |

- [ ] **Step 4: Tag release**

```bash
git tag v0.1.0
git commit --allow-empty -m "chore: tag v0.1.0 — Zotero AI Companion initial release"
```
