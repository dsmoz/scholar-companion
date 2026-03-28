// src/events.ts
import { getApiUrl } from './prefs';

let notifierID: string | null = null;

export function registerEventHooks() {
  notifierID = Zotero.Notifier.registerObserver(
    {
      notify: async (event: string, type: string, ids: number[]) => {
        if (type !== 'item') return;
        if (event === 'add') {
          for (const id of ids) {
            const item = Zotero.Items.get(id);
            if (item && item.isRegularItem()) {
              await queueSync();
            }
          }
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
    await fetch(`${getApiUrl()}/api/plugin/sync`, { method: 'POST' });
  } catch (e) {
    console.warn('[AI Companion] Failed to queue sync:', e);
  }
}
