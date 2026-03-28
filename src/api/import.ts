// src/api/import.ts
import { DiscoveryResult } from './discovery';

export interface ImportResult {
  title: string;
  success: boolean;
  error?: string;
}

function normalizeDoi(doi: string): string {
  // Strip OpenAlex-style "https://doi.org/" prefix and PubMed "doi: " prefix
  return doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
}

export async function importToZotero(results: DiscoveryResult[]): Promise<ImportResult[]> {
  const Z = (globalThis as any).Zotero;
  const out: ImportResult[] = [];

  for (const r of results) {
    try {
      const cleanDoi = r.doi ? normalizeDoi(r.doi) : '';
      const identifier = cleanDoi ? `DOI:${cleanDoi}` : r.pmid ? `PMID:${r.pmid}` : null;

      if (identifier) {
        // Lookup via CrossRef/PubMed — fetches full metadata automatically (same as Zotero Connector)
        await Z.Utilities.lookupIdentifier(identifier);
      } else if (r.url) {
        // Web result (Tavily) — save as webpage item
        const item = new Z.Item('webpage');
        item.setField('title', r.title);
        item.setField('url', r.url);
        if (r.snippet) item.setField('abstractNote', r.snippet);
        await item.saveTx();
      } else {
        // Manual fallback for academic results with no identifier
        const item = new Z.Item('journalArticle');
        item.setField('title', r.title);
        if (r.journal) item.setField('publicationTitle', r.journal);
        if (r.year)    item.setField('date', r.year);
        item.setCreators(
          r.authors.map((a: string) => ({ firstName: '', lastName: a, creatorType: 'author' }))
        );
        await item.saveTx();
      }
      out.push({ title: r.title, success: true });
    } catch (e: any) {
      out.push({ title: r.title, success: false, error: e.message });
    }
  }

  return out;
}
