# Score Chip Labels & Similarity Filter — Design Spec

**Date:** 2026-03-28

## Context

The Related Documents panel displays similarity scores as raw integers (e.g. 108, 88, 85) derived from multiplying the backend's 0–1 DBSF-normalized score by 100. These numbers are opaque to users. The goal is to replace them with meaningful word labels (Best / Good / Fair) and let users control the minimum similarity threshold that determines which documents appear in the panel.

---

## 1. ScoreChip — Word Labels

**Current:** `ScoreChip` renders a filled chip with the integer percentage (e.g. `88`).

**New:** Replace the number with a word label. Color coding (green / yellow / red) stays unchanged.

| Score range | Label | Color |
|-------------|-------|-------|
| ≥ 0.75      | Best  | `#a6e3a1` (green) |
| 0.60 – 0.74 | Good  | `#f9e2af` (yellow) |
| 0.45 – 0.59 | Fair  | `#f38ba8` (red) |

**Implementation:** Edit `src/ui/components/ScoreChip.tsx`. Replace `Math.round(score * 100)` display with a label derived from the thresholds. Thresholds are read from prefs at render time so they stay in sync if the user changes them.

A helper `scoreLabel(score, thresholds)` pure function maps a score to `'Best' | 'Good' | 'Fair'` using the three threshold values. This function is co-located in `ScoreChip.tsx`.

---

## 2. Similarity Threshold — Preferences

**New pref:** `chatRelatedMinLabel` — stores the minimum label the user wants to see. Stored as a string: `'Fair'` | `'Good'` | `'Best'`. Default: `'Good'`.

**Three boundary values (fixed, not user-configurable):**

| Label | Min score |
|-------|-----------|
| Best  | 0.75      |
| Good  | 0.60      |
| Fair  | 0.45      |

These thresholds are defined as a constant in `src/prefs.ts` and exported for use by both `ScoreChip` and `RelatedDocsPanel`.

**Filtering:** After the API returns results, `RelatedDocsPanel` filters out items whose score is below the threshold corresponding to `chatRelatedMinLabel`. This is client-side filtering — no API change needed.

**Settings UI:** Add a new row to the CHAT section in `src/ui/Settings.tsx`, below "Related docs":

```
Minimum match    [Fair]  [Good ✓]  [Best]
```

Uses the existing `segmented()` helper. Saves to `chatRelatedMinLabel` pref on click.

---

## 3. Data Flow

```
User sets chatRelatedMinLabel = 'Good' in Settings
      ↓
prefs.ts exports getRelatedMinScore() → 0.60
      ↓
RelatedDocsPanel fetches results from /similar or /search
      ↓
Filters: items.filter(r => r.score >= getRelatedMinScore())
      ↓
Filtered list rendered; each ScoreChip shows word label
```

No backend changes required. The `score_threshold` parameter in the backend `SemanticSearch()` already exists but is not needed here — client-side filtering is sufficient and simpler.

---

## 4. Files to Modify

| File | Change |
|------|--------|
| `src/ui/components/ScoreChip.tsx` | Replace integer display with word label; add `scoreLabel()` helper; read thresholds from prefs |
| `src/prefs.ts` | Add `chatRelatedMinLabel` default (`'Good'`); export `SCORE_THRESHOLDS` constant and `getRelatedMinScore()` |
| `src/ui/Settings.tsx` | Add "Minimum match" segmented row in CHAT section |
| `src/ui/components/RelatedDocsPanel.tsx` | Filter `items` by `getRelatedMinScore()` before rendering |

---

## 5. Verification

1. Build the plugin and reload in Zotero.
2. Open a document with indexed content → Related Documents panel appears.
3. Chips show "Best", "Good", or "Fair" (not numbers).
4. Open Settings → CHAT section → "Minimum match" row is present with three segments.
5. Set to "Best" → only high-similarity docs appear.
6. Set to "Fair" → more docs appear including lower-scoring ones.
7. Reload Zotero → preference persists.
