// src/api/import.ts
import { DiscoveryResult } from './discovery';

export interface ImportResult {
  title: string;
  success: boolean;
  duplicate?: boolean;   // item already existed in library
  error?: string;
}

function normalizeDoi(doi: string): string {
  return doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
}

async function findItemByIdentifier(Z: any, identifier: string): Promise<any | null> {
  const value = identifier.replace(/^(DOI:|PMID:)/, '');
  const items = await Z.Items.getAll(Z.Libraries.userLibraryID, true);
  return items.find((it: any) => {
    if (identifier.startsWith('DOI:')) return it.getField('DOI') === value;
    if (identifier.startsWith('PMID:')) return (it.getField('extra') || '').includes(`PMID: ${value}`);
    return false;
  }) ?? null;
}

async function findItemByUrl(Z: any, url: string): Promise<any | null> {
  const items = await Z.Items.getAll(Z.Libraries.userLibraryID, true);
  return items.find((it: any) => it.getField('url') === url) ?? null;
}

function itemInCollection(item: any, collectionID: number): boolean {
  return (item.getCollections() as number[]).includes(collectionID);
}

async function addItemToCollection(Z: any, itemID: number, collectionID: number): Promise<void> {
  const collection = Z.Collections.get(collectionID);
  if (collection) {
    collection.addItem(itemID);
    await collection.saveTx();
  }
}

export async function importToZotero(
  results: DiscoveryResult[],
  collectionID?: number,
): Promise<ImportResult[]> {
  const Z = (globalThis as any).Zotero;
  const out: ImportResult[] = [];

  for (const r of results) {
    try {
      const cleanDoi = r.doi ? normalizeDoi(r.doi) : '';
      const identifier = cleanDoi ? `DOI:${cleanDoi}` : r.pmid ? `PMID:${r.pmid}` : null;

      if (identifier) {
        // Check if already in library
        const existing = await findItemByIdentifier(Z, identifier);
        if (existing) {
          // Already in library — just add to collection if needed
          if (collectionID && !itemInCollection(existing, collectionID)) {
            await addItemToCollection(Z, existing.id, collectionID);
          }
          out.push({ title: r.title, success: true, duplicate: true });
          continue;
        }
        await Z.Utilities.lookupIdentifier(identifier);
        if (collectionID) {
          const saved = await findItemByIdentifier(Z, identifier);
          if (saved) await addItemToCollection(Z, saved.id, collectionID);
        }

      } else if (r.url) {
        const existing = await findItemByUrl(Z, r.url);
        if (existing) {
          if (collectionID && !itemInCollection(existing, collectionID)) {
            await addItemToCollection(Z, existing.id, collectionID);
          }
          out.push({ title: r.title, success: true, duplicate: true });
          continue;
        }
        const item = new Z.Item('webpage');
        item.setField('title', r.title);
        item.setField('url', r.url);
        const note = r.abstract || r.snippet;
        if (note) item.setField('abstractNote', note);
        await item.saveTx();
        if (collectionID) await addItemToCollection(Z, item.id, collectionID);

      } else {
        const item = new Z.Item('journalArticle');
        item.setField('title', r.title);
        if (r.journal) item.setField('publicationTitle', r.journal);
        if (r.year)    item.setField('date', r.year);
        item.setCreators(
          r.authors.map((a: string) => ({ firstName: '', lastName: a, creatorType: 'author' }))
        );
        const fallbackNote = r.abstract || r.snippet;
        if (fallbackNote) item.setField('abstractNote', fallbackNote);
        await item.saveTx();
        if (collectionID) await addItemToCollection(Z, item.id, collectionID);
      }

      out.push({ title: r.title, success: true });
    } catch (e: any) {
      out.push({ title: r.title, success: false, error: e.message });
    }
  }

  return out;
}
