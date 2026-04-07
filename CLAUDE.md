# Zotero Plugin — Project Rules

## Icons

Always use `@phosphor-icons/react` for all icons. Never use emojis as icons or visual indicators in UI code.

## Module Reference

| Module | Key exports | Description |
| -------- | ------------- | ------------- |
| `ui/components/ChatBubble` | `ChatBubble`, `Message` | Shared message bubble with copy button, sources section |
| `ui/components/SummaryModal` | `SummaryModal` | Modal overlay for streamed session summary |
| `ui/components/ReadingToolbar` | `ReadingToolbar` | Font/color controls + export dropdown + summarize button |
| `api/export` | `exportSession`, `exportAsMarkdown`, `streamSummarize` | Chat export and summary streaming API |

## Pattern 1 — Shared Chat Bubble

All three chat panels (ItemPaneTab, LibraryChat, MultiDocChat) use the shared `ChatBubble` component. Do not duplicate bubble rendering logic — add new per-message features to `ChatBubble.tsx`.
