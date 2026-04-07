# Changelog

All notable changes to Zotero AI Companion are documented here.
Format: Keep a Changelog · Versioning: Semantic Versioning

## [0.6.0] - 2026-04-07

### Added

- **Copy button on assistant bubbles**: Hover bottom-right to copy plain text; CopySimple icon switches to Check for 1.5s confirmation
- **Export session**: Toolbar dropdown with Markdown (client-side), DOCX, and PDF options; Markdown always available, DOCX/PDF require backend support
- **Summarize session**: Toolbar button streams an LLM-generated summary in a modal overlay; copy-to-clipboard and download-as-Markdown from modal
- **Backend export endpoint**: `POST /api/plugin/chat/export` returns session as MD/DOCX binary
- **Backend summarize endpoint**: `POST /api/plugin/chat/summarize` SSE stream without modifying session history

### Changed

- **Shared ChatBubble component**: Extracted identical bubble rendering from ItemPaneTab, LibraryChat, and MultiDocChat into `ChatBubble.tsx`; eliminates ~120 lines of duplicated code
- **ReadingToolbar extended**: Now accepts `sessionId`, `messages`, `onSummarize`, `streaming` props; shows export/summarize buttons when messages exist

## [0.5.0] - 2026-03-29

### Added
- **Tavily web search source**: External web discovery via Tavily API; detects item type (PDF direct link → `report`, YouTube/Vimeo → `videoRecording`, otherwise `webpage`); domain used as publisher fallback; title stripped of `[PDF]`/`(PDF)` prefixes; year extracted from URL path; tags generated from domain + capitalised title words
- **Item type icons in Discovery panel**: Phosphor icons before each result title — `Article` for journal articles, `FilePdf` for PDFs, `Video` for video, `Globe` for webpages, `FileDashed` for unknown types; icon and title share the same colour
- **Tag pills in Discovery panel**: Up to 5 keyword tags displayed as pill badges below each result abstract; MeSH terms / author keywords for PubMed, OpenAlex topics/keywords, Europe PMC mesh+keywords; word-frequency fallback for tagless items; all lowercase, split on spaces (no multi-word tags)
- **Search history tab in Discovery panel**: Tab bar with Search / History views; lists recent searches with query, sources, result count, timestamp; clicking a history entry restores filters and re-runs; "Clear all" button

### Changed
- **Discovery import — collection assignment**: Items with DOI or PMID now import via `Zotero.Translate.Search` (`collections: false` when no collection selected, matching Zotero's own `lookup.js`); items without identifiers fall back to `saveManual()`
- **Discovery import — web item author**: When `r.authors` is empty and a URL is present, domain is used as corporate author (e.g. `who.int`) so Zotero doesn't show a blank creator
- **Discovery import — PDF rename**: Attachment returned by `importFromURL` is renamed to `PDF.pdf` via `renameAttachmentFile()` for `report`-type items
- **Discovery import — web item type**: Tavily results set `item_type` correctly; `saveManual()` maps `report`→Zotero report, `videoRecording`→videoRecording, `webpage`→webpage, fallback `journalArticle`
- **Tag visibility**: Tag pill colours updated to `#a6adc8` text / `#585b70` border / `#313244` background (was near-invisible `#6c7086` / `#45475a` / `#1e1e2e`)
- **Abstract line clamp**: Collapsed abstract shows 5 lines (was 3)
- `DISCOVERY_SOURCES_VERSION` bumped to 3 to re-seed Tavily as default-enabled for existing users

## [0.4.0] - 2026-03-29
### Added
- **Author tab**: New profile view in ItemPaneTab showing all items by an author fetched from Neo4j; each card displays title (yyyy), collapsible abstract, and item-type icon
- **Abstract context injection**: When opening chat from an author item card, the item's abstract is passed through the event pipeline and prepended to the LLM context in `_stream_multi_doc_chat`, grounding responses before full document chunks load
- **Author item sort**: Sort author items by title or year via toggle buttons
- **Auto-deploy**: `build.mjs` now copies XPI directly to the active Zotero profile path on build

### Changed
- `openSingleDocChat` and `chatWithDocuments` command handlers now pass `{ keys, abstract }` JSON object instead of plain keys array, allowing abstract to travel with the chat session
- `panel.tsx` parses the new `{ keys, abstract }` format from the `keys` URL param (backward-compatible with plain array)
- `streamMultiDocChat` signature updated: `initialAbstract` added as 4th positional parameter (before callbacks)
- `/chat/multi/stream` backend endpoint now accepts and forwards `abstract` field to the streaming generator

### Fixed
- **Similar tab**: Deduplicated results keyed by `zotero_key` (keeping highest score); was returning only the source document because 35 of 36 SemanticSearch results were chunks of the same item
- **Author tab blank after click**: Added missing error handling and loading state reset in `loadAuthor`; profile was silently failing with no UI feedback
- **Abstract enrichment**: Changed `setdefault` to direct assignment in `_enrich_items` so abstracts from synctracker overwrite the empty string set during item construction

## [0.3.0] - 2026-03-28
### Added
- **Item Chat**: LLM-powered streaming chat per Zotero item; history persisted to `.data/chats/{key}.json`
- **Library Chat**: Standalone panel for cross-library semantic search + LLM chat with session sidebar (last 10 sessions)
- **Multi-doc Chat**: Chat across multiple selected items simultaneously; session persists with scoped document keys
- **Query rewriting**: Follow-up questions (≤ 15 words) auto-expanded using conversation history before semantic search
- **APA source citations**: Inline `[N]` superscripts in assistant responses; "Sources" section per message with author, year, title
- **Related Documents panel**: Loads similar items on chat open (scope-based for multi-doc; query-based for library chat); collapses/expands
- **Session restore**: Multi-doc chat sessions store `zotero_keys`; document header and history reload on reopen
- **Markdown rendering**: `marked` + `DOMPurify` for assistant messages in all three chat surfaces
- LLM provider routing: Anthropic (claude-sonnet-4-6, with prompt caching) → OpenRouter → LM Studio → error
- `chat_llm.py`: `stream_llm_response()` with provider auto-detection
- `chat_sessions.py`: JSON session storage; `load_session`, `save_session`, `new_session`, `list_library_sessions`

### Changed
- Backend source objects now include `year` and `authors` fields (extracted from Zotero metadata) across all three chat generators
- `similar_items()` fixed: now fetches a representative chunk and uses `SemanticSearch` instead of incorrect `Search_by_zotero_key(top_k=…)` call
- Related Documents panel now loads immediately on chat open rather than waiting for first send

### Fixed
- `/similar/<key>` 500 error: `Search_by_zotero_key` does not accept `top_k`; fixed to use `limit`
- Library chat context maintenance: query rewriting prevents "what about Angola?" from losing topic across turns
- Multi-doc session reload: `zotero_keys` now stored in session JSON so scope is preserved on reopen

## [0.2.1] - 2026-03-28
### Fixed
- Restored CSS design tokens (`tokens.css`) and base styles lost during git rebase abort
- Added `src/styles/` copy step to `build.mjs` so stylesheet bundle is included in XPI

## [0.2.0] - 2026-03-28
### Fixed
- Window focus check replaced `Services.wm.getWindowByName` (not a valid XPCOM API) with `getEnumerator('')` loop

## [0.1.9] - 2026-03-28
### Fixed
- Same window-focus fix (incremental release)

## [0.1.8] - 2026-03-28
### Fixed
- Command handlers lost during git rebase abort; restored window open/close lifecycle

## [0.1.7] - 2026-03-28
### Added
- Initial Library Chat panel
- Multi-doc Chat panel
- SSE streaming backend routes for item, library, and multi-doc chat
