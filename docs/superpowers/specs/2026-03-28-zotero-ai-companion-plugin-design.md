# Zotero AI Companion Plugin — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Context

We have a production-quality MCP server (`mcp-zotero-qdrant`) that exposes 128 functions across Zotero, Qdrant, Neo4j, Supabase, and a job queue. Currently, interaction with this backend happens through Claude Code and the MCP protocol — powerful but requiring a separate tool. We also have AppleScript glue code that communicates with the Zotero local API in an ad-hoc way.

The goal is to replace that fragile scripting approach and surface the MCP backend's full capability inside a native **Zotero 7 plugin** — a proper `.xpi` that users install once, giving them an AI research companion that lives alongside their library with no context switching.

The design draws inspiration from ResearchRabbit (graph-first, discovery-driven) but is fundamentally different: everything is grounded in the user's local library, uses their own backend, and no data leaves the machine unless they initiate external discovery.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Plugin framework | Zotero Plugin Scaffold (Zotero 7) | Official template, TypeScript + esbuild + React |
| UI components | React 18 + `@phosphor-icons/react` | Component model fits panel UI; Phosphor for icons throughout |
| Graph visualization | D3.js (`d3-force`, `d3-zoom`, `d3-drag`, `d3-scale`) | Full physics simulation, organic layout, animated transitions |
| Styling | CSS variables + Zotero theme tokens | Inherits Zotero's light/dark theme; plugin adds accent colour layer |
| Backend comms | Fetch (REST) + `EventSource` (SSE) | REST for all queries/mutations; SSE for streaming chat tokens |
| Build | esbuild (bundled by scaffold) | Fast, produces single `.xpi` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ZOTERO PROCESS                         │
│                                                          │
│  bootstrap.ts ── plugin lifecycle (startup/shutdown)     │
│  events.ts    ── Zotero.Notifier hooks                   │
│  menu.ts      ── toolbar button + context menus          │
│  prefs.ts     ── persistent settings                     │
│                                                          │
│  ┌──────────────────┐   ┌──────────────────────────────┐ │
│  │  Item Pane Tab   │   │  Full Zotero Tabs (windows)  │ │
│  │  (React)         │   │                              │ │
│  │  · Chat          │   │  · Graph (D3 in <browser>)   │ │
│  │  · Similar       │   │  · Health Dashboard          │ │
│  │  · Author        │   │  · Discovery                 │ │
│  │                  │   │  · Index Queue               │ │
│  │                  │   │  · Settings                  │ │
│  └──────────────────┘   └──────────────────────────────┘ │
│                                                          │
│  src/api/client.ts  ── REST + SSE wrapper                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP REST + SSE
                            ▼
┌─────────────────────────────────────────────────────────┐
│         Flask API — localhost:6500 (existing)            │
│                                                          │
│  NEW endpoints added to existing server:                 │
│  POST /api/plugin/chat/stream     (SSE)                  │
│  GET  /api/plugin/search                                 │
│  GET  /api/plugin/similar/:key                           │
│  GET  /api/plugin/graph/nodes                            │
│  GET  /api/plugin/author/:name                           │
│  GET  /api/plugin/discovery/search                       │
│  GET  /api/plugin/health                                 │
│  GET  /api/plugin/jobs                                   │
│  POST /api/plugin/jobs/:id/retry                         │
│  DELETE /api/plugin/items/:key    (cascade delete)       │
└───────────────────────────┬─────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Qdrant      PostgreSQL       Neo4j
        (vectors)    (synctracker)   (graph)
              │
          Zotero API + Better BibTeX RPC
```

---

## Plugin Structure

```
zotero_plugin/
├── src/
│   ├── bootstrap.ts          # Zotero 7 plugin entry point
│   ├── events.ts             # Zotero.Notifier hooks (add/delete/modify)
│   ├── menu.ts               # Toolbar button, Tools menu, context menu
│   ├── prefs.ts              # Settings read/write (Zotero pref system)
│   ├── api/
│   │   ├── client.ts         # Base fetch wrapper, error handling
│   │   ├── chat.ts           # SSE streaming chat
│   │   ├── search.ts         # Semantic search
│   │   ├── graph.ts          # Graph data fetching
│   │   ├── discovery.ts      # PubMed / Semantic Scholar / OpenAlex
│   │   ├── health.ts         # Library health
│   │   └── jobs.ts           # Indexing queue
│   ├── ui/
│   │   ├── ItemPaneTab.tsx    # AI tab in item pane (Chat/Similar/Author)
│   │   ├── GraphTab.tsx       # Full-window D3 graph tab
│   │   ├── HealthPanel.tsx    # Library health dashboard
│   │   ├── DiscoveryPanel.tsx # External discovery + import
│   │   ├── IndexQueue.tsx     # Job monitor
│   │   ├── Settings.tsx       # Settings panel
│   │   └── components/        # Shared: StatusBadge, ScoreChip, Toggle, etc.
│   └── graph/
│       └── network.html       # Self-contained D3 page loaded in <browser>
├── addon/
│   ├── manifest.json
│   ├── bootstrap.js           # Zotero bootstrap shim
│   └── prefs.js
├── package.json
└── build/                     # esbuild output → .xpi
```

---

## Feature Specifications

### 1. Item Pane Tab — "AI"

**Trigger:** Appears as a tab alongside Info / Notes / Tags whenever an item is selected.

**Sub-tabs:**

- **Chat** — streams answers from the MCP `/api/plugin/chat/stream` (SSE). Each response shows source page numbers and chunk count. Context = selected item's Qdrant vectors. If item is not indexed, shows "Not indexed yet — index this item?" with one-click trigger.
- **Similar** — calls `/api/plugin/similar/:key`, shows top 6 results with hybrid similarity score (colour-coded green/yellow by threshold). Items not in library show a dashed border + "Search externally →" link that opens Discovery pre-seeded with that title.
- **Author** — lists all authors of the selected item. Click an author → shows their other works in the library + co-author names. "Find more by this author" button opens Discovery panel pre-seeded with the author name.

### 2. Graph Tab — Similarity Network

**Trigger:** Toolbar button (PhosphorIcon: `Graph`) opens a full Zotero tab.

**Implementation:** `GraphTab.tsx` renders a `<browser src="graph/network.html">` element. `network.html` is a bundled local file (chrome URL, no external requests). Data is passed via `window.postMessage` from the plugin to the `<browser>` frame; node click events post back via the same channel. The plugin listener calls `ZoteroPane.selectItem()` on receipt. No CSP issues — both sides are same-origin chrome.

**D3 layout:**
- `d3-force`: charge repulsion + link distance + collision detection
- Nodes sized by citation count, coloured by collection (each collection = distinct hue via `d3-scale`)
- Edge types: semantic similarity (blue), citation links (yellow), co-author (grey)
- Nodes not in library: dashed stroke ring (discovery candidates)

**Filter sidebar:**
- View mode: Papers / Authors / Mixed
- Edge type toggles
- Collection filter (multi-select)
- Similarity threshold slider (0.7–1.0)

**Node hover tooltip:** Open in Zotero / Chat / Delete (cascade)

**Controls:** Fit to screen, Zoom +/−, Export PNG (`d3` → canvas → `toDataURL`)

### 3. Health Dashboard

**Trigger:** Tools menu → "AI Companion → Library Health" (PhosphorIcon: `HeartPulse`)

**Summary cards:** Indexed count, Unindexed, Failed sync, Missing PDF — each card is a button that filters the issue list below.

**Issue list:** Per-item rows with issue type badge and inline action:
- Failed sync → Retry
- Missing PDF → Find PDF (opens Zotero attachment dialog)
- Not indexed → Index now

**Bulk actions:** Retry all failed · Index all pending · Fix orphans (removes Qdrant/synctracker records for items deleted from Zotero)

### 4. Discovery Panel

**Trigger:** Tools menu → "AI Companion → Discovery", or "Search externally →" link from Similar sub-tab or Author panel.

**Sources:** PubMed/NCBI · Semantic Scholar · OpenAlex (toggleable per-source in Settings)

**Search:** Pre-seeded from currently selected Zotero item or author; user can edit freely.

**Results:** Title, authors, journal, year · similarity score (when seeded from an item) · "In library" badge for duplicates.

**Import:** Select one or multiple → "Import selected to Zotero" → uses Zotero's `Zotero.HTTP.processDocuments` or Zotero Translate to add items → newly added items are automatically queued for indexing via `events.ts` hook.

### 5. Index Queue

**Trigger:** Toolbar status indicator (shows pending count badge) or Tools menu.

**Sections:** Processing now (with progress bar + time estimate) · Pending · Failed

**Job types shown:** `add_to_qdrant` · `update_metadata` · `sync_payload` · `neo4j_ingest`

**Actions:** Pause/Resume processor · Retry failed · Clear completed

**Live updates:** Polls `/api/plugin/jobs` every 5 seconds while panel is open (lightweight — no WebSocket needed for this).

### 6. Settings Panel

**Appearance:**
- Theme: Auto / Light / Dark (writes to Zotero pref `extensions.zotero-ai.theme`)
- Accent colour: 5 presets (blue / green / red / yellow / purple)
- Graph node size: S / M / L

**Backend:**
- Flask API URL (default `http://localhost:6500`)
- Live connection status + latency (pings `/api/plugin/health` on load)
- "Test connection" button

**Sync scheduling:**
- Auto-sync toggle
- Interval: 6h / 12h / 24h / 48h
- Sync on startup toggle
- Last synced timestamp + item count
- "Sync now" manual trigger

**Chat:**
- LLM model selector (free text, default `google/gemma-2-9b-it`)
- Max chunks per query (1–20, default 8)
- Stream responses toggle

**Discovery sources:** Per-source toggles for PubMed, Semantic Scholar, OpenAlex

**Danger zone:**
- Re-index entire library (confirms before executing)
- Clear Qdrant collection (confirms before executing)

### 7. Cascade Delete

**Trigger:** Right-click item in Zotero → "Delete with AI cleanup" context menu item, OR Delete button in graph node tooltip.

**Flow:**
1. Confirm dialog: "This will delete from Zotero, Qdrant, synctracker, and Neo4j. Continue?"
2. `DELETE /api/plugin/items/:key` → backend orchestrates: Zotero delete → Qdrant chunk delete → synctracker record delete → Neo4j node delete
3. Graph updates (node removed with D3 exit animation)
4. Health dashboard count refreshes

### 8. Zotero Event Hooks (`events.ts`)

Registers with `Zotero.Notifier`:

| Event | Action |
|---|---|
| `item.add` | Queue item for indexing (add_to_qdrant job) |
| `item.delete` | If "Auto-cleanup on delete" pref is on: cascade delete |
| `item.modify` | Queue metadata sync job |
| `collection.delete` | Warn if collection has indexed items |

---

## Backend Changes Required

The existing Flask server (`/Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant`) needs a new blueprint: `src/api/plugin_routes.py`. This wraps existing MCP module functions and adds:

1. `POST /api/plugin/chat/stream` — SSE endpoint wrapping `documents.chat()`
2. `GET /api/plugin/similar/:key` — wraps `qdrant.search.SemanticSearch()`
3. `GET /api/plugin/graph/nodes` — queries Neo4j + Qdrant similarity matrix for D3 node/edge format
4. `GET /api/plugin/author/:name` — queries Zotero items by author + Neo4j co-author edges
5. `GET /api/plugin/discovery/search` — wraps PubMed/Semantic Scholar/OpenAlex APIs
6. `GET /api/plugin/health` — wraps `synctracker.health.Get_health_status()`
7. `GET /api/plugin/jobs` — wraps `jobs_api.queue.Get_queue_status()`
8. `POST /api/plugin/jobs/:id/retry` — wraps `jobs_api.queue.Process_next_job()`
9. `DELETE /api/plugin/items/:key` — orchestrates cascade delete across all data stores

All endpoints return JSON. The chat endpoint returns `text/event-stream`.

---

## Quality of Life Features Summary

| Feature | Implementation |
|---|---|
| Theme (Auto/Light/Dark) | CSS variables, reads Zotero's `ui.style` pref |
| Accent colour | CSS `--accent` variable, 5 presets |
| Sync scheduling | `setTimeout`/`setInterval` in `bootstrap.ts`, persisted in prefs |
| Backend status indicator | Toolbar icon colour: green=connected, yellow=degraded, red=offline |
| Index queue badge | Toolbar button shows pending job count |
| Keyboard shortcuts | `Ctrl+Shift+F` semantic search, `Ctrl+Shift+G` graph |
| Export graph | D3 canvas → PNG download |
| Connection auto-retry | Exponential backoff on API failure, max 3 retries |

---

## Verification

1. **Build:** `npm run build` → produces `build/zotero-ai-companion.xpi`
2. **Install:** Zotero → Tools → Add-ons → Install from file → select `.xpi`
3. **Connect:** Settings → enter Flask URL → "Test connection" shows green + latency
4. **Chat:** Select any indexed item → AI tab → Chat sub-tab → ask a question → tokens stream in
5. **Similar:** AI tab → Similar sub-tab → 6 results appear with scores
6. **Graph:** Toolbar → Graph icon → D3 network loads, nodes draggable, zoom works
7. **Discovery:** Tools menu → Discovery → search "PrEP MSM" → results from PubMed → select 2 → Import → items appear in Zotero + indexing job queued
8. **Cascade delete:** Right-click item → "Delete with AI cleanup" → confirm → item gone from Zotero, Qdrant, synctracker, Neo4j
9. **Health:** Tools menu → Library Health → unindexed/failed counts match synctracker state
10. **Sync schedule:** Set 12h interval → restart Zotero → auto-sync fires on startup and every 12h
