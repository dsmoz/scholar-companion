// src/bootstrap.ts
import { registerEventHooks, unregisterEventHooks } from './events';
import { registerMenus, registerContextMenu } from './menu';
import { getApiUrl, getSyncOnStartup, getAutoSync, getSyncInterval } from './prefs';
import { triggerSync } from './api/sync';

let syncTimer: ReturnType<typeof setInterval> | null = null;

export async function startup({ rootURI }: { id: string; version: string; rootURI: string }) {
  registerEventHooks();

  for (const win of (Zotero as any).getMainWindows()) {
    initWindow(win);
  }

  if (getSyncOnStartup()) {
    try { await triggerSync(); } catch (e) { console.warn('[AI Companion] Startup sync failed:', e); }
  }

  scheduleSync();

  // Register the AI tab in the Zotero item pane
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createRoot } = require('react-dom/client') as typeof import('react-dom/client');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createElement } = require('react') as typeof import('react');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ItemPaneTab } = require('./ui/ItemPaneTab') as typeof import('./ui/ItemPaneTab');

      const authors: Array<{ firstName: string; lastName: string }> = item
        .getCreators()
        .map((c: any) => ({ firstName: c.firstName || '', lastName: c.lastName || '' }));

      const root = createRoot(body);
      root.render(createElement(ItemPaneTab, {
        zoteroKey: item.key,
        title: item.getField('title'),
        authors,
      }));

      return () => root.unmount();
    },
  });
}

export function shutdown() {
  unregisterEventHooks();
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
}

function initWindow(win: Window) {
  registerMenus(win);
  registerContextMenu(win);
  win.addEventListener('zotero-ai-command', (e: Event) =>
    handleCommand((e as CustomEvent).detail.command, win)
  );
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
            await fetch(`${getApiUrl()}/api/plugin/items/${item.key}`, { method: 'DELETE' });
            await (Zotero as any).Items.trashTx([item.id]);
          } catch (e) {
            console.error('[AI Companion] Cascade delete failed:', e);
          }
        }
      }
      break;
    }
  }
}
