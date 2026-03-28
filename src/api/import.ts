// src/api/import.ts
import { DiscoveryResult } from './discovery';

export interface ImportResult {
  title: string;
  success: boolean;
  error?: string;
}

export async function importToZotero(results: DiscoveryResult[]): Promise<ImportResult[]> {
  const Z = (globalThis as any).Zotero;
  const out: ImportResult[] = [];

  for (const r of results) {
    try {
      const identifier = r.doi ? `DOI:${r.doi}` : r.pmid ? `PMID:${r.pmid}` : null;

      if (identifier) {
        // Lookup via CrossRef/PubMed — fetches full metadata automatically (same as Zotero Connector)
        await Z.Utilities.lookupIdentifier(identifier);
      } else {
        // Manual fallback when no identifier available
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
