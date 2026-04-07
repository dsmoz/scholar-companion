// src/events.ts
import { apiFetch } from './api/client';
import { syncMetadata } from './api/sync';

let notifierID: string | null = null;

export function registerEventHooks() {
  notifierID = Zotero.Notifier.registerObserver(
    {
      notify: async (event: string, type: string, ids: number[]) => {
        if (type !== 'item') return;
        if (event === 'add') {
          const hasRegular = ids.some((id) => {
            const item = Zotero.Items.get(id);
            return item && item.isRegularItem();
          });
          if (hasRegular) await queueSync();
        }
        if (event === 'modify') {
          // Sync relatedness metadata for modified items (tags, collections, etc.)
          const keys: string[] = [];
          for (const id of ids) {
            const item = Zotero.Items.get(id);
            if (item && item.isRegularItem()) keys.push(item.key);
          }
          if (keys.length > 0) {
            syncMetadata(keys).catch(() => {});
          }
          await queueSync();
        }
      },
    },
    ['item']
  );
}

export function unregisterEventHooks() {
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    notifierID = null;
  }
}

async function queueSync() {
  try {
    await apiFetch('/sync', { method: 'POST' });
  } catch (e) {
    console.warn('[Scholar Companion] Failed to queue sync:', e);
  }
}
