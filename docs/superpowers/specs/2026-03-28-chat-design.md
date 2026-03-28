# Chat Feature Design — Zotero AI Companion

**Date:** 2026-03-28
**Status:** Approved

---

## Goal

Deliver two chat surfaces:

1. **Item Chat** — chat with a single indexed document, with history persisted and reloaded per item
2. **Library Chat** — ask questions across the full Zotero library using semantic search, with a session sidebar

---

## Current State & What's Broken

- `ItemPaneTab.tsx` has a functional streaming UI
- `src/api/chat.ts` correctly handles SSE with abort
- **The `/chat/stream` backend route is broken**: calls `chat_with_document()` (lowercase) but the function is `Chat_with_document()` (capitalised). Will `AttributeError` at runtime.
- `Chat_with_document()` exists and returns document context (full text or chunks) correctly — no LLM call is made
- `llm_provider.py` uses the OpenAI SDK against OpenRouter, which supports `stream=True`. Same infra can stream chat tokens.
- No chat history is persisted anywhere today

---

## Architecture

### Storage

Per-session JSON files at `{backend_data_dir}/chats/`:

```
.data/chats/
  {zoteroKey}.json          ← item chat session (one per item)
  library_{session_id}.json ← library chat sessions (multiple)
```

Session schema (same as Cerebellum pattern):
```json
{
  "id": "ABCD1234",
  "title": "Paper title or 'Library Chat'",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "...", "sources": [...] }
  ]
}
```

Source schema inside assistant messages:
```json
{ "page": 12, "text": "chunk text", "zotero_key": "ABCD1234", "title": "Paper title" }
```

### LLM Streaming Pipeline

Both item and library chat use the same pipeline:

```
1. Load session history
2. Assemble context (document chunks or search results)
3. Build system prompt with numbered citations [1], [2]...
4. Call OpenRouter with stream=True (→ LM Studio fallback)
5. Yield SSE tokens: data: {"token": "..."}
6. On completion: data: {"done": true, "sources": [...]}
7. Append message to session JSON, save
```

LLM call via existing `openai.OpenAI` client from `llm_provider.py`:
```python
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY)
with client.chat.completions.create(..., stream=True) as stream:
    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield f"data: {json.dumps({'token': token})}\n\n"
```

---

## Component Map

### Backend (mcp-zotero-qdrant)

| File | Change |
|------|--------|
| `src/api/plugin_routes.py` | Fix `/chat/stream`; add session GET/DELETE endpoints; add `/library/chat/stream` and session endpoints |
| `src/api/chat_sessions.py` | **New** — session load/save/list helpers |
| `src/api/chat_llm.py` | **New** — shared LLM streaming logic |
| `src/api/library_chat.py` | **New** — library-wide semantic search + LLM streaming |

### Frontend (zotero_plugin)

| File | Change |
|------|--------|
| `src/ui/ItemPaneTab.tsx` | Load session on mount, persist on send, add markdown rendering |
| `src/ui/LibraryChat.tsx` | **New** — standalone library chat panel |
| `src/api/chat.ts` | Add `loadChatSession()`, `clearChatSession()` |
| `src/api/libraryChat.ts` | **New** — `streamLibraryChat()`, `listLibrarySessions()`, `loadLibrarySession()` |
| `src/menu.ts` | Add "Library Chat" menu item → opens LibraryChat panel |
| `src/panel.tsx` | Register `?panel=library-chat` route |
| `package.json` | Add `marked` + `dompurify` + `@types/dompurify` |

---

## Detailed Design

### 1. Backend: `src/api/chat_sessions.py` (new)

Handles JSON session storage for both item and library chat.

```python
import json, os, time
from pathlib import Path

CHATS_DIR = Path(".data/chats")

def ensure_dir():
    CHATS_DIR.mkdir(parents=True, exist_ok=True)

def load_session(session_id: str) -> dict | None:
    path = CHATS_DIR / f"{session_id}.json"
    if path.exists():
        return json.loads(path.read_text())
    return None

def save_session(session: dict) -> None:
    ensure_dir()
    session["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    path = CHATS_DIR / f"{session['id']}.json"
    path.write_text(json.dumps(session, indent=2))

def new_session(session_id: str, title: str) -> dict:
    return {
        "id": session_id,
        "title": title,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "messages": [],
    }

def list_library_sessions(limit: int = 10) -> list[dict]:
    ensure_dir()
    sessions = []
    for path in CHATS_DIR.glob("library_*.json"):
        try:
            s = json.loads(path.read_text())
            sessions.append({"id": s["id"], "title": s["title"], "updated_at": s["updated_at"]})
        except Exception:
            pass
    sessions.sort(key=lambda x: x["updated_at"], reverse=True)
    return sessions[:limit]
```

### 2. Backend: `src/api/chat_llm.py` (new)

Shared LLM streaming logic for both item and library chat.

```python
import json, os
from typing import Iterator

def stream_llm_response(
    question: str,
    context: str,
    history: list[dict],
    sources: list[dict],
) -> Iterator[dict]:
    """Stream LLM response tokens. Yields {"token": ...} dicts, then {"done": True, "sources": [...]}."""
    from openai import OpenAI

    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "google/gemma-2-9b-it")
    base_url = "https://openrouter.ai/api/v1"

    if not api_key:
        # Fall back to LM Studio
        base_url = os.getenv("LLM_API_URL", "")
        model = os.getenv("LLM_MODEL", "")
        api_key = os.getenv("LLM_API_KEY", "local")
        if not base_url or not model:
            yield {"error": "No LLM configured (OPENROUTER_API_KEY or LLM_API_URL required)"}
            return

    system_prompt = (
        "You are a research assistant. Answer based only on the provided context.\n"
        "Use [1], [2] etc. to cite specific passages.\n\n"
        f"Context:\n{context}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages += history
    messages.append({"role": "user", "content": question})

    try:
        client = OpenAI(base_url=base_url, api_key=api_key, timeout=60.0)
        with client.chat.completions.create(
            model=model, messages=messages, max_tokens=2048, temperature=0.2, stream=True
        ) as stream:
            for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    yield {"token": token}
        yield {"done": True, "sources": sources}
    except Exception as e:
        yield {"error": str(e)}
```

### 3. Backend: Fixed `/chat/stream` in `plugin_routes.py`

Replace the broken `stream_chat()` + `chat_stream()` pair with:

```python
def _stream_item_chat(zotero_key, question, max_chunks):
    import json as _json
    from src.documents.chat import Chat_with_document
    from src.api.chat_sessions import load_session, save_session, new_session
    from src.api.chat_llm import stream_llm_response

    session = load_session(zotero_key) or new_session(zotero_key, "")

    try:
        ctx = Chat_with_document(zotero_key, query=question, max_chunks=max_chunks)
    except Exception as e:
        yield f"data: {_json.dumps({'error': str(e)})}\n\n"
        return

    if not session["title"]:
        session["title"] = ctx.get("metadata", {}).get("title", zotero_key)

    history = [{"role": m["role"], "content": m["content"]} for m in session["messages"]]
    session["messages"].append({"role": "user", "content": question})

    chunks = ctx.get("chunks", [])
    sources = [
        {"page": c.get("page", 0), "text": c.get("text", ""),
         "zotero_key": zotero_key, "title": session["title"]}
        for c in chunks
    ]

    full_response = ""
    for event in stream_llm_response(question, ctx["content"], history, sources):
        full_response += event.get("token", "")
        yield f"data: {_json.dumps(event)}\n\n"

    session["messages"].append({"role": "assistant", "content": full_response, "sources": sources})
    save_session(session)


@plugin_bp.route("/chat/stream", methods=["POST"])
def chat_stream():
    body = request.get_json(force=True) or {}
    zotero_key = body.get("zotero_key", "")
    question = body.get("question", "")
    max_chunks = int(body.get("max_chunks", 8))
    if not zotero_key or not question:
        return jsonify({"error": "zotero_key and question required"}), 400
    return Response(
        stream_with_context(_stream_item_chat(zotero_key, question, max_chunks)),
        content_type="text/event-stream; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )

@plugin_bp.route("/chat/sessions/<zotero_key>", methods=["GET"])
def get_chat_session(zotero_key):
    from src.api.chat_sessions import load_session
    session = load_session(zotero_key)
    return jsonify(session or {"id": zotero_key, "messages": []})

@plugin_bp.route("/chat/sessions/<zotero_key>", methods=["DELETE"])
def clear_chat_session(zotero_key):
    import os
    path = f".data/chats/{zotero_key}.json"
    if os.path.exists(path):
        os.remove(path)
    return jsonify({"cleared": True})
```

### 4. Backend: Library chat in `plugin_routes.py`

```python
def _stream_library_chat(session_id, question):
    import json as _json
    from src.qdrant.search import SemanticSearch
    from src.api.chat_sessions import load_session, save_session, new_session
    from src.api.chat_llm import stream_llm_response

    session = load_session(session_id) or new_session(session_id, question[:60])

    # Semantic search across all indexed documents
    raw = SemanticSearch(query=question, top_k=8)
    results = list(raw) if not isinstance(raw, list) else raw

    # Build numbered context
    context_parts = []
    sources = []
    for i, r in enumerate(results, 1):
        text = r.get("text", r.get("content", ""))
        title = r.get("title", r.get("zotero_key", ""))
        page = r.get("page", 0)
        zotero_key = r.get("zotero_key", "")
        context_parts.append(f"[{i}] {text}")
        sources.append({"page": page, "text": text, "zotero_key": zotero_key, "title": title})
    context = "\n\n".join(context_parts)

    history = [{"role": m["role"], "content": m["content"]} for m in session["messages"]]
    session["messages"].append({"role": "user", "content": question})

    full_response = ""
    for event in stream_llm_response(question, context, history, sources):
        full_response += event.get("token", "")
        yield f"data: {_json.dumps(event)}\n\n"

    session["messages"].append({"role": "assistant", "content": full_response, "sources": sources})
    save_session(session)


@plugin_bp.route("/library/chat/stream", methods=["POST"])
def library_chat_stream():
    import uuid
    body = request.get_json(force=True) or {}
    session_id = body.get("session_id") or f"library_{uuid.uuid4().hex[:12]}"
    question = body.get("question", "")
    if not question:
        return jsonify({"error": "question required"}), 400
    return Response(
        stream_with_context(_stream_library_chat(session_id, question)),
        content_type="text/event-stream; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )

@plugin_bp.route("/library/chat/sessions", methods=["GET"])
def library_chat_sessions():
    from src.api.chat_sessions import list_library_sessions
    return jsonify(list_library_sessions())

@plugin_bp.route("/library/chat/sessions/<session_id>", methods=["GET"])
def get_library_chat_session(session_id):
    from src.api.chat_sessions import load_session
    session = load_session(session_id)
    return jsonify(session or {"id": session_id, "messages": []})
```

### 5. Frontend: `src/api/chat.ts` additions

```ts
export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; sources?: Source[] }>;
}

export interface Source {
  page: number;
  text?: string;
  zotero_key?: string;
  title?: string;
}

export async function loadChatSession(zoteroKey: string): Promise<ChatSession> {
  return apiFetch(`/chat/sessions/${zoteroKey}`);
}

export async function clearChatSession(zoteroKey: string): Promise<void> {
  await apiFetch(`/chat/sessions/${zoteroKey}`, { method: 'DELETE' });
}
```

`streamChat()` current signature is unchanged — the backend now handles session persistence server-side.

### 6. Frontend: `src/api/libraryChat.ts` (new)

```ts
import { apiFetch } from './client';
import { Source } from './chat';

export interface LibrarySession {
  id: string;
  title: string;
  updated_at: string;
}

export function streamLibraryChat(
  question: string,
  sessionId: string,
  onToken: (token: string) => void,
  onDone: (sources: Source[]) => void,
  onError: (err: string) => void,
): () => void {
  const base = getApiUrl();
  const controller = new AbortController();
  // identical SSE parsing pattern as streamChat()
  // POSTs {question, session_id} to /library/chat/stream
  ...
  return () => controller.abort();
}

export async function listLibrarySessions(): Promise<LibrarySession[]> {
  return apiFetch('/library/chat/sessions');
}

export async function loadLibrarySession(sessionId: string): Promise<ChatSession> {
  return apiFetch(`/library/chat/sessions/${sessionId}`);
}
```

### 7. Markdown rendering — marked + DOMPurify

Both `ItemPaneTab.tsx` and `LibraryChat.tsx` use:

```ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text) as string);
}

// In JSX (assistant messages only):
<div
  style={{ ... }}
  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
/>
```

`DOMPurify.sanitize()` strips any XSS vectors before rendering. User messages are always rendered as plain text — no markdown parsing.

### 8. Frontend: `ItemPaneTab.tsx` changes

- On mount: `loadChatSession(zoteroKey)` → restore `messages` from session
- Map session messages to `Message[]` using `content` field (backend uses `content`, frontend uses `text` — align on `content` or map during load)
- Add trash icon button in tab header → `clearChatSession(zoteroKey)` → `setMessages([])`
- Assistant messages rendered via `renderMarkdown()`

### 9. Frontend: `src/ui/LibraryChat.tsx` (new)

```
┌─────────────────────────────────────────────┐
│ Library Chat                      [New Chat] │
├──────────────┬──────────────────────────────┤
│ Sessions     │  Message area                │
│ sidebar      │                              │
│ (last 10)    │  [assistant: markdown msg]   │
│              │        [user bubble]         │
│              │  [assistant: markdown msg]   │
│              │                              │
│              ├──────────────────────────────┤
│              │  [input]           [Send]    │
└──────────────┴──────────────────────────────┘
```

- Session sidebar loads from `listLibrarySessions()` on mount
- Clicking a session calls `loadLibrarySession(id)` → replaces messages state
- "New Chat" generates a new `session_id = library_{uuid}`
- Streaming identical to item chat SSE pattern
- Sources shown below each assistant message as: "Title · p.12"

### 10. Menu + panel routing

`src/menu.ts` — add menu item:
```ts
ZoteroPane.addMenuSeparator(menu);
ZoteroPane.addMenuItem(menu, {
  label: 'Library Chat',
  oncommand: () => openDialog('library-chat'),
});
```

`src/panel.tsx` — add route:
```ts
case 'library-chat': return <LibraryChat />;
```

---

## New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plugin/chat/stream` | Item chat (fixed) |
| GET | `/api/plugin/chat/sessions/:key` | Load item chat history |
| DELETE | `/api/plugin/chat/sessions/:key` | Clear item chat history |
| POST | `/api/plugin/library/chat/stream` | Library chat (new) |
| GET | `/api/plugin/library/chat/sessions` | List last 10 library sessions |
| GET | `/api/plugin/library/chat/sessions/:id` | Load library session |

---

## Dependencies

Add to `package.json`:
```json
"marked": "^12.0.0",
"dompurify": "^3.1.0",
"@types/dompurify": "^3.0.5"
```

---

## Out of Scope

- Multi-document chat from item tab
- Chat export / copy to clipboard
- Stop-generation button
- Token counting / context window warnings
- Library chat session deletion

---

## Verification

1. Open an item → AI tab → ask a question → response streams with markdown → close tab → reopen → history restored
2. Clear chat (trash icon) → messages gone, `.data/chats/{key}.json` deleted
3. Open Library Chat from Tools menu → ask cross-library question → response with [1], [2] citations from multiple documents
4. Close Library Chat → reopen → session sidebar shows previous conversation → click to reload
5. Check `.data/chats/` has JSON files after chats
6. Test no `OPENROUTER_API_KEY` → clear error message streamed back
