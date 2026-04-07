// src/ui/utils/renderMarkdown.ts — shared markdown + citation rendering for all chat panels
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Source } from '../../api/chat';

function buildCitationTooltip(s: Source): string {
  const parts: string[] = [];
  if (s.title) parts.push(s.title);
  if (s.authors && s.year) parts.push(`${s.authors} (${s.year})`);
  else if (s.authors) parts.push(s.authors);
  else if (s.year) parts.push(`(${s.year})`);
  return parts.join(' \u2014 ');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSingleCitation(num: number, primaryCount: number, primary: Source[], expanded: Source[]): string {
  const isExpanded = num > primaryCount && num <= primaryCount + expanded.length;
  const source = isExpanded
    ? expanded[num - primaryCount - 1]
    : primary[num - 1];

  const cssClass = isExpanded ? 'citation-ref citation-ref--expanded' : 'citation-ref';
  const tooltip = source ? buildCitationTooltip(source) : '';
  // Use data-tip for CSS tooltip (native title unreliable in XUL browser iframes)
  const tipAttr = tooltip ? ` data-tip="${escapeAttr(tooltip)}"` : '';

  return `<sup class="${cssClass}"${tipAttr}>[${num}]</sup>`;
}

// Matches both [2] and [2, 3, 4] citation formats
const CITATION_RE = /\[((\d+)(?:\s*,\s*\d+)*)\]/g;

export function renderMarkdown(text: string, sources?: Source[]): string {
  const html = DOMPurify.sanitize(marked.parse(text) as string);

  if (!sources || sources.length === 0) {
    return html.replace(CITATION_RE, (_match, inner) => {
      const nums = inner.split(/\s*,\s*/);
      return nums.map((n: string) => `<sup class="citation-ref">[${n}]</sup>`).join('');
    });
  }

  const primary = sources.filter(s => s.scope !== 'expanded');
  const expanded = sources.filter(s => s.scope === 'expanded');
  const primaryCount = primary.length;

  return html.replace(CITATION_RE, (_match, inner) => {
    const nums = inner.split(/\s*,\s*/);
    return nums.map((n: string) => renderSingleCitation(parseInt(n, 10), primaryCount, primary, expanded)).join('');
  });
}

export function formatApaSourceText(s: Source): string {
  const parts: string[] = [];
  if (s.authors) parts.push(s.authors + '.');
  if (s.year) parts.push(`(${s.year}).`);
  if (s.title) parts.push(s.title + '.');
  return parts.join(' ');
}

/** Key for deduplication: title (lowercased) + zotero_key */
function sourceKey(s: Source): string {
  if (s.zotero_key) return s.zotero_key;
  return (s.title || '').toLowerCase().trim();
}

/**
 * Deduplicate sources that reference the same document.
 * Returns collapsed entries with index ranges, e.g. "[1-5]" when 5 sources
 * all point to the same document.
 */
export interface CollapsedSource {
  source: Source;
  indices: number[];
  label: string;  // e.g. "1-5" or "3"
  scope: 'primary' | 'expanded';
}

export function collapseSources(sources: Source[]): { primary: CollapsedSource[]; expanded: CollapsedSource[] } {
  const primarySrc = sources.filter(s => s.scope !== 'expanded');
  const expandedSrc = sources.filter(s => s.scope === 'expanded');

  function collapse(arr: Source[], offset: number, scope: 'primary' | 'expanded'): CollapsedSource[] {
    const groups = new Map<string, { source: Source; indices: number[] }>();
    arr.forEach((s, i) => {
      const key = sourceKey(s);
      const existing = groups.get(key);
      if (existing) {
        existing.indices.push(offset + i + 1);
      } else {
        groups.set(key, { source: s, indices: [offset + i + 1] });
      }
    });

    const result: CollapsedSource[] = [];
    for (const { source, indices } of groups.values()) {
      const first = indices[0];
      const last = indices[indices.length - 1];
      const label = indices.length > 1 ? `${first}-${last}` : `${first}`;
      result.push({ source, indices, label, scope });
    }
    return result;
  }

  return {
    primary: collapse(primarySrc, 0, 'primary'),
    expanded: collapse(expandedSrc, primarySrc.length, 'expanded'),
  };
}
