# Zotero AI Companion — CLAUDE.md

## What this is

A Zotero 7 plugin that connects to a local Flask backend (`mcp-zotero-qdrant`) and adds AI features: semantic search, similarity graph, document chat, library health monitoring, discovery, and index queue management.

## Build and release

```bash
npm run build     # builds XPI to build/zotero-ai-companion.xpi
npm run release   # bumps patch version, builds, pushes to GitHub, creates release
npm run release minor   # minor bump
npm run release 1.2.3  # explicit version
```

**Do not run `npm run release` unless the user explicitly asks.** Build only (`npm run build`) for testing changes.

The release script:
1. Bumps version in `package.json` + `addon/manifest.json`
2. Builds the XPI
3. Updates `update.json` with new version + GitHub release URL
4. Commits, tags (`vX.Y.Z`), pushes to `origin/main`
5. Creates GitHub release at `dsmoz/zotero-ai-companion` and uploads the XPI

Zotero picks up updates via **Tools → Add-ons → gear → Check for Updates**, which polls `update.json` on GitHub main.

## Project structure

```
addon/
  manifest.json           # Zotero 7 web extension manifest (strict_min_version: "6.999")
  content/
    panel.xhtml           # Chrome window wrapper for floating panels (must be .xhtml)
    icons/favicon.png     # 96x96 plugin icon

src/
  bootstrap.ts            # Plugin lifecycle: startup, shutdown, onMainWindowLoad/Unload
  menu.ts                 # Tools menu + context menu registration
  events.ts               # Zotero event hooks (item add/modify/delete)
  prefs.ts                # All preferences with defaults (prefix: extensions.zotero-ai)
  panel.tsx               # Panel entry point — reads ?panel= param, renders correct component
  panel.html              # Minimal HTML wrapper loading panel.js

  api/
    client.ts             # apiFetch() — base URL from prefs, retry on 5xx, ApiError class
    health.ts             # fetchLibraryHealth (60s cache), indexAllPending, fixOrphans
    graph.ts              # fetchGraphData (5min cache), invalidateGraphCache
    sync.ts               # triggerSync
    sync-status.ts        # fetchSyncStatus, updateItemMetadata, patchSyncStatus
    chat.ts               # streamChat (SSE)
    search.ts             # semanticSearch
    discovery.ts          # discoverySearch
    jobs.ts               # fetchJobs, retryJob
    author.ts             # fetchAuthor

  ui/
    HealthPanel.tsx        # Library health: stats, paginated issues, action buttons
    GraphTab.tsx           # D3 similarity graph via iframe + postMessage
    DiscoveryPanel.tsx     # External source discovery (PubMed, Semantic Scholar, OpenAlex)
    IndexQueue.tsx         # Job queue monitor
    ItemPaneTab.tsx        # AI tab inside Zotero item pane (chat + similar)
    Settings.tsx           # All settings UI
    components/
      SectionHeader.tsx
      StatusDot.tsx
      Toggle.tsx
      ConfirmDialog.tsx
      ScoreChip.tsx

  graph/
    network.html           # D3 force graph (loads d3.min.js locally — NO CDN)

scripts/
  build.mjs               # esbuild pipeline + XPI packaging
  release.mjs             # Full release automation

update.json               # Zotero auto-update manifest (must stay on GitHub main branch)
```

## Critical Zotero 7 constraints

- **`strict_min_version` must be `"6.999"`** — Zotero 7's internal version. `"7.0"` breaks installation.
- **`update_url` is required** in `manifest.json` — omitting it causes "Extension is invalid".
- **`icons` field is required** in `manifest.json`.
- **Panel windows must be `.xhtml`**, not `.html` — `openDialog` with `.html` fails silently.
- **No CDN resources** — Zotero's chrome sandbox blocks external network requests. Bundle everything (D3 is copied from `node_modules/d3/dist/d3.min.js` into the XPI).
- **Menu commands use `setAttribute('oncommand', ...)` with inline JS** — `addEventListener('command')` does not fire in XUL.
- **`Services.wm.getEnumerator('')`** to find open windows — `getWindowByName` does not exist.
- **Bootstrap shim**: `ctx._globalThis = ctx` makes the loaded script's `globalThis` = the sandbox object. `startup`/`shutdown` etc. are set directly on `_globalThis` (not `exports`).

## Backend

The Flask backend lives at `/Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant`.

All API calls go through `apiFetch()` in `src/api/client.ts`:
- Base URL from prefs (default `http://localhost:6500`)
- Prefix: `/api/plugin`
- Retries on 5xx (up to 3x, exponential backoff)

Key backend endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/plugin/health` | GET | Connection check |
| `/api/plugin/health/library` | GET | Library health stats + issues |
| `/api/plugin/sync` | POST | Queue all unindexed items |
| `/api/plugin/cleanup/orphans` | POST | Remove orphaned synctracker records |
| `/api/plugin/graph/nodes` | GET | D3 graph data (nodes + edges) |
| `/api/plugin/search` | GET | Semantic search |
| `/api/plugin/similar/:key` | GET | Similar items by Zotero key |
| `/api/plugin/chat/stream` | POST | SSE chat stream |
| `/api/plugin/discovery/search` | GET | External source discovery |
| `/api/plugin/jobs` | GET | Index queue status |
| `/api/plugin/jobs/:id/retry` | POST | Retry a failed job |
| `/api/plugin/items/:key` | DELETE | Cascade delete |
| `/api/plugin/sync-status` | GET | All item sync statuses |
| `/api/plugin/items/:key/sync-status` | PATCH | Update one item's status |
| `/api/plugin/items/:key/metadata` | POST | Queue AI metadata update |

## Caching

- **Health data**: 60s TTL in `src/api/health.ts`. Call `invalidateHealthCache()` after mutations.
- **Graph data**: 5min TTL in `src/api/graph.ts`. Call `invalidateGraphCache()` after mutations.
- Page navigation (health issues pagination) hits the cache — no extra API calls.

## Preferences

All stored under `extensions.zotero-ai.*` via `Zotero.Prefs`. Defaults in `src/prefs.ts`:

| Key | Default | Notes |
|---|---|---|
| `apiUrl` | `http://localhost:6500` | Flask backend URL |
| `syncInterval` | `12` | Hours between auto-syncs |
| `syncOnStartup` | `true` | Sync on Zotero launch |
| `autoSync` | `true` | Enable scheduled sync |
| `theme` | `auto` | UI theme |
| `chatModel` | `google/gemma-2-9b-it` | LLM model name |
| `chatMaxChunks` | `8` | Context chunks for chat |
| `healthPageSize` | `10` | Issues per page in Health panel |
| `discoveryPubmed` | `true` | Enable PubMed in discovery |
| `discoverySemanticScholar` | `true` | Enable Semantic Scholar |
| `discoveryOpenAlex` | `false` | Enable OpenAlex |

## GitHub

Repo: `https://github.com/dsmoz/zotero-ai-companion`
Releases: tagged `vX.Y.Z`, XPI attached as `zotero-ai-companion.xpi`
`update.json` on `main` branch — Zotero polls this for updates.
