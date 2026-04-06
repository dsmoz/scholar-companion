// src/events.ts
import { apiFetch } from './api/client';

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
    console.warn('[AI Companion] Failed to queue sync:', e);
  }
}
