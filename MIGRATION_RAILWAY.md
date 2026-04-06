# Migration Status: Zotero Plugin → Railway

## Server-Side (mcp-scholar) — DONE

All server changes are deployed to Railway and tested.

### What was done

1. **REST API restored** — `src/api/plugin_routes.py` (Starlette) with 31 routes mounted at `/api/plugin/*` alongside the MCP transport
2. **Per-client auth** — Two-tier token validation in `src/auth/middleware.py`:
   - Per-client tokens (stored in `clients.api_token`) — auto-resolves client, no `X-Client-ID` needed
   - Admin/gateway tokens (`API_TOKENS` env var) — backward compatible with `X-Client-ID`
3. **Provision endpoints**:
   - `POST /api/plugin/provision` — onboard new user (validates Zotero creds, provisions resources, returns API token)
   - `PUT /api/plugin/provision/{client_id}/credentials` — rotate Zotero creds + optional token rotation
4. **Migration 007** — `api_token` column added to `clients` table

### Test credentials

- **URL**: `https://mcp-scholar-production.up.railway.app`
- **Token**: `nMKaV3L9B8TALy_S1dqptHnNdPThB-mP_wSfVBP3Nms` (client: `mc_R2GfeRC_y91zie5uyskxqw`)

---

## Plugin-Side — IN PROGRESS

### Already done (uncommitted changes)

Files modified with auth support:

| File | Change |
|---|---|
| `src/prefs.ts` | Added `apiToken` preference + `getApiToken`/`setApiToken` exports |
| `src/api/client.ts` | Added `getAuthHeaders()` export; `apiFetch()` now includes `Authorization: Bearer` header |
| `src/api/chat.ts` | SSE fetch uses `getAuthHeaders()` |
| `src/api/libraryChat.ts` | SSE fetch uses `getAuthHeaders()` |
| `src/api/multiDocChat.ts` | SSE fetch uses `getAuthHeaders()` |
| `src/ui/Settings.tsx` | Added API Token password input in Backend Connection section; renamed "Flask API URL" → "Server URL" |

### Remaining work

#### 1. Settings panel improvements

- [ ] Add a "show/hide" toggle for the API Token field (eye icon)
- [ ] Add a "Copy token" button
- [ ] Change default URL from `http://localhost:6500` to a more helpful placeholder or keep as-is for local dev
- [ ] Add a "Connection mode" indicator — show whether using local (stdio) or Railway (HTTP)
- [ ] Test Connection button should show the client name on success (from `/health` response or a new `/me` endpoint)

#### 2. Events/sync module

- [ ] Review `src/events.ts` — auto-sync triggers POST `/api/plugin/sync`. Verify this works with per-client token auth
- [ ] The sync-on-item-add event may need to include the auth header if it bypasses `apiFetch()`

#### 3. Context menu commands

- [ ] "Delete with AI cleanup" calls `DELETE /items/{key}` — verify it goes through `apiFetch()` (should work already)
- [ ] "Update metadata (AI)" calls `POST /items/{key}/metadata` — same check
- [ ] "Index to Qdrant" triggers POST `/sync` — same check

#### 4. Default URL handling

- [ ] Consider: should the default URL change to Railway? Or keep localhost for local dev and require manual config for Railway?
- [ ] The Settings panel could have a dropdown: "Local" (`http://localhost:8060`) vs "Cloud" (Railway URL)

#### 5. Build and release

- [ ] Bump version to 0.6.0
- [ ] Update CHANGELOG.md with Railway migration entry
- [ ] Build XPI and test in Zotero

---

## Architecture After Migration

```
Zotero Plugin
  │
  │  Authorization: Bearer <per-client-token>
  │  (no X-Client-ID needed)
  │
  ▼
Railway (mcp-scholar)
  ├── /health              ← no auth
  ├── /api/plugin/*        ← per-client token → auto-resolve ClientInfo
  ├── /api/plugin/provision ← admin token only
  └── /mcp                 ← MCP transport (admin token + X-Client-ID)
```
