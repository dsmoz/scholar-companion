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

function renderSingleCitation(num: number, primaryCount: number, primary: Source[], expanded: Source[]): string {
  const isExpanded = num > primaryCount && num <= primaryCount + expanded.length;
  const source = isExpanded
    ? expanded[num - primaryCount - 1]
    : primary[num - 1];

  const cssClass = isExpanded ? 'citation-ref citation-ref--expanded' : 'citation-ref';
  const tooltip = source ? buildCitationTooltip(source) : '';
  const titleAttr = tooltip ? ` title="${tooltip.replace(/"/g, '&quot;')}"` : '';

  return `<sup class="${cssClass}"${titleAttr}>[${num}]</sup>`;
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
