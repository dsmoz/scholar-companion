// src/bootstrap.ts
import { registerEventHooks, unregisterEventHooks } from './events';
import { registerMenus, registerContextMenu } from './menu';
import { getSyncOnStartup, getAutoSync, getSyncInterval } from './prefs';
import { triggerSync } from './api/sync';
import { apiFetch } from './api/client';

let syncTimer: ReturnType<typeof setInterval> | null = null;
const windowListeners = new Map<Window, EventListener>();

async function startup({ rootURI }: { id: string; version: string; rootURI: string }) {
  console.log('[AI Companion] startup called, rootURI:', rootURI);
  try {
    registerEventHooks();
  } catch(e) { console.error('[AI Companion] registerEventHooks failed:', e); }
  console.log('[AI Companion] startup complete');

  try {
    if (getSyncOnStartup()) {
      try { await triggerSync(); } catch (e) { console.warn('[AI Companion] Startup sync failed:', e); }
    }
    scheduleSync();
  } catch(e) { console.error('[AI Companion] sync setup failed:', e); }

  // Register the AI tab in the Zotero item pane
  try {
    (Zotero as any).ItemPaneManager.registerSection({
      paneID: 'zotero-ai-companion',
      pluginID: 'zotero-ai-companion@dsmoz',
      header: {
        l10nID: 'ai-companion-header',
        icon: `${rootURI}content/icons/icon16.png`,
      },
      sidenav: {
        l10nID: 'ai-companion-sidenav',
        icon: `${rootURI}content/icons/icon20.png`,
      },
      onRender: ({ body, item }: { body: HTMLElement; item: any }) => {
        const { createRoot } = require('react-dom/client') as typeof import('react-dom/client');
        const { createElement } = require('react') as typeof import('react');
        const { ItemPaneTab } = require('./ui/ItemPaneTab') as typeof import('./ui/ItemPaneTab');

        const authors: Array<{ firstName: string; lastName: string }> = item
          .getCreators()
          .map((c: any) => ({ firstName: c.firstName || '', lastName: c.lastName || '' }));

        let root = (body as any)._aiRoot;
        if (!root) {
          root = createRoot(body);
          (body as any)._aiRoot = root;
        }

        root.render(createElement(ItemPaneTab, {
          zoteroKey: item.key,
          title: item.getField('title'),
          authors,
        }));

        return () => {
          root.unmount();
          delete (body as any)._aiRoot;
        };
      },
    });
  } catch(e) { console.error('[AI Companion] ItemPaneManager.registerSection failed:', e); }
}

function shutdown() {
  unregisterEventHooks();
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  windowListeners.clear();
}

async function onMainWindowLoad({ window: win }: { window: Window }) {
  // Wait for Zotero UI to be fully ready before injecting menus
  await (Zotero as any).uiReadyPromise;
  initWindow(win);
}

function onMainWindowUnload({ window: win }: { window: Window }) {
  const handler = windowListeners.get(win);
  if (handler) {
    win.removeEventListener('zotero-ai-command', handler);
    windowListeners.delete(win);
  }
  win.document.getElementById('zotero-ai-menu')?.remove();
  win.document.getElementById('zotero-ai-cascade-delete')?.remove();
  win.document.getElementById('zotero-ai-context-sep')?.remove();
  win.document.getElementById('zotero-ai-color-sync')?.remove();
  win.document.getElementById('zotero-ai-update-metadata')?.remove();
  win.document.getElementById('zotero-ai-index-selected')?.remove();
}

function initWindow(win: Window) {
  const doc = win.document;
  console.log('[AI Companion] initWindow, toolsPopup:', !!doc.getElementById('menu_ToolsPopup'), 'itemmenu:', !!doc.getElementById('zotero-itemmenu'));
  registerMenus(win);
  registerContextMenu(win);
  const handler: EventListener = (e: Event) =>
    handleCommand((e as CustomEvent).detail.command, win).catch((err: unknown) =>
      console.error('[AI Companion] Command error:', err)
    );
  win.addEventListener('zotero-ai-command', handler);
  windowListeners.set(win, handler);
}

function scheduleSync() {
  if (syncTimer) clearInterval(syncTimer);
  if (!getAutoSync()) return;
  const intervalMs = getSyncInterval() * 60 * 60 * 1000;
  syncTimer = setInterval(async () => {
    try { await triggerSync(); } catch (e) { console.warn('[AI Companion] Scheduled sync failed:', e); }
  }, intervalMs);
}

async function handleCommand(command: string, win: Window) {
  switch (command) {
    case 'openGraph':
    case 'openDiscovery':
    case 'openHealth':
    case 'openQueue':
    case 'openSettings':
      (Zotero as any).getActiveZoteroPane()?.openTab(`zotero-ai-${command.replace('open', '').toLowerCase()}`);
      break;
    case 'cascadeDelete': {
      const selectedItems = (Zotero as any).getActiveZoteroPane()?.getSelectedItems() ?? [];
      for (const item of selectedItems) {
        const title = item.getField('title');
        const confirmed = win.confirm(
          `Delete "${title}" from Zotero, Qdrant, synctracker, and Neo4j?`
        );
        if (confirmed) {
          try {
            await apiFetch(`/items/${item.key}`, { method: 'DELETE' });
            await (Zotero as any).Items.trashTx([item.id]);
          } catch (e) {
            console.error('[AI Companion] Cascade delete failed:', e);
          }
        }
      }
      break;
    }

    case 'colorSyncStatus': {
      const selectedItems = (Zotero as any).getActiveZoteroPane()?.getSelectedItems() ?? [];
      const regularItems = selectedItems.filter(
        (it: any) => it.isRegularItem() && !it.parentKey
      );
      if (regularItems.length === 0) {
        win.alert('Please select regular library items (not attachments or notes).');
        break;
      }
      try {
        const { fetchSyncStatus } = await import('./api/sync-status');
        const { items: statusItems } = await fetchSyncStatus();
        const statusMap = new Map(statusItems.map((s) => [s.zotero_key, s.sync_status]));

        const TAG_MAP: Record<string, { tag: string; color: string }> = {
          synced:  { tag: '🟢 Synced',  color: '#a6e3a1' },
          pending: { tag: '🟡 Pending', color: '#f9e2af' },
          error:   { tag: '🔴 Error',   color: '#f38ba8' },
        };
        const ALL_TAGS = Object.values(TAG_MAP).map((t) => t.tag);

        for (const it of regularItems) {
          // Remove old sync tags
          for (const t of ALL_TAGS) it.removeTag(t);
          await it.saveTx();

          const rawStatus = statusMap.get(it.key) ?? 'pending';
          const info = TAG_MAP[rawStatus] ?? TAG_MAP.pending;
          it.addTag(info.tag);
          await it.saveTx();
          await (Zotero as any).Tags.setColor(it.libraryID, info.tag, info.color);
        }
        win.alert(`Colored ${regularItems.length} item(s) by sync status.`);
      } catch (e) {
        console.error('[AI Companion] colorSyncStatus failed:', e);
        win.alert('Failed to fetch sync status. Is the Flask server running?');
      }
      break;
    }

    case 'updateMetadata': {
      const selectedItems = (Zotero as any).getActiveZoteroPane()?.getSelectedItems() ?? [];
      const regularItems = selectedItems.filter(
        (it: any) => it.isRegularItem() && !it.parentKey
      );
      if (regularItems.length === 0) {
        win.alert('Please select regular library items (not attachments or notes).');
        break;
      }
      const confirmed = win.confirm(
        `Update metadata with AI for ${regularItems.length} item(s)?\n\n` +
        'Items must have PDF or HTML attachments. Processing happens in background.'
      );
      if (!confirmed) break;
      try {
        const { updateItemMetadata } = await import('./api/sync-status');
        let queued = 0;
        for (const it of regularItems) {
          try {
            await updateItemMetadata(it.key);
            queued++;
          } catch (e) {
            console.warn('[AI Companion] metadata update failed for', it.key, e);
          }
        }
        win.alert(`Queued ${queued} of ${regularItems.length} item(s) for metadata update.`);
      } catch (e) {
        console.error('[AI Companion] updateMetadata failed:', e);
        win.alert('Failed to queue metadata update. Is the Flask server running?');
      }
      break;
    }

    case 'indexSelected': {
      const selectedItems = (Zotero as any).getActiveZoteroPane()?.getSelectedItems() ?? [];
      const regularItems = selectedItems.filter(
        (it: any) => it.isRegularItem() && !it.parentKey
      );
      if (regularItems.length === 0) {
        win.alert('Please select regular library items (not attachments or notes).');
        break;
      }
      const confirmed = win.confirm(
        `Queue ${regularItems.length} item(s) for Qdrant indexing?\n\nProcessing happens in background.`
      );
      if (!confirmed) break;
      try {
        await triggerSync();
        win.alert('Indexing queued. Monitor progress in the Index Queue panel.');
      } catch (e) {
        console.error('[AI Companion] indexSelected failed:', e);
        win.alert('Failed to queue indexing. Is the Flask server running?');
      }
      break;
    }
  }
}

// Expose lifecycle hooks to the bootstrap shim via _globalThis (sandbox context)
declare const _globalThis: any;
_globalThis.startup = startup;
_globalThis.shutdown = shutdown;
_globalThis.onMainWindowLoad = onMainWindowLoad;
_globalThis.onMainWindowUnload = onMainWindowUnload;
