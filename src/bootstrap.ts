// src/bootstrap.ts
import { registerEventHooks, unregisterEventHooks } from './events';
import { registerMenus, registerContextMenu } from './menu';
import { getSyncOnStartup, getAutoSync, getSyncInterval, getItemPaneHeight } from './prefs';
import { triggerSync } from './api/sync';
import { apiFetch } from './api/client';

let syncTimer: ReturnType<typeof setInterval> | null = null;
const windowListeners = new Map<Window, EventListener>();
let _rootURI = '';
let _sectionRegistered = false;

async function startup({ rootURI }: { id: string; version: string; rootURI: string }) {
  _rootURI = rootURI;
  registerEventHooks();

  // Wait for the UI to be ready so the item pane notifier listener is registered
  // before we call registerSection (otherwise the refresh notification is lost)
  await (Zotero as any).uiReadyPromise;

  // Register the item pane section exactly once
  if (!_sectionRegistered) {
    _sectionRegistered = true;
    try {
      (Zotero as any).ItemPaneManager.registerSection({
        paneID: 'zotero-ai-companion',
        pluginID: 'zotero-ai-companion@dsmoz',
        header: {
          l10nID: 'ai-companion-header',
          icon: `${_rootURI}content/icons/icon16.png`,
        },
        sidenav: {
          l10nID: 'ai-companion-sidenav',
          icon: `${_rootURI}content/icons/icon20.png`,
        },
        onRender: ({ body, item }: { body: HTMLElement; item: any }) => {
          const key = item.key;
          const title = encodeURIComponent(item.getField('title') ?? '');
          const src = `chrome://zotero-ai-companion/content/panel.html?panel=item-chat&key=${key}&title=${title}`;
          if ((body as any)._aiIframe?.src === src) return;
          const minH = getItemPaneHeight();
          body.style.cssText = `height:100%;min-height:${minH}px;overflow:hidden;padding:0;`;
          let iframe = (body as any)._aiIframe as HTMLIFrameElement | undefined;
          if (!iframe) {
            iframe = body.ownerDocument.createElement('iframe') as HTMLIFrameElement;
            iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
            body.replaceChildren(iframe);
            (body as any)._aiIframe = iframe;
          }
          iframe.src = src;
        },
        onDestroy: ({ body }: { body: HTMLElement }) => {
          delete (body as any)._aiIframe;
        },
      });
    } catch(e) { (Zotero as any).logError(e); }
  }

  // Initialize any already-open windows (plugin loaded after Zotero started)
  for (const win of (Zotero as any).getMainWindows()) {
    initWindow(win);
  }

  if (getSyncOnStartup()) {
    try { await triggerSync(); } catch (e) { /* server may not be running */ }
  }
  scheduleSync();
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
  win.document.getElementById('zotero-ai-chat-docs')?.remove();
}

function initWindow(win: Window) {
  registerMenus(win);
  registerContextMenu(win);
  const handler: EventListener = (e: Event) =>
    handleCommand((e as CustomEvent).detail.command, win, e as CustomEvent).catch((err: unknown) =>
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

async function handleCommand(command: string, win: Window, event?: CustomEvent) {
  switch (command) {
    case 'openGraph':
    case 'openDiscovery':
    case 'openHealth':
    case 'openQueue':
    case 'openSettings':
    case 'openLibraryChat': {
      const panelDefs: Record<string, { title: string; panel: string; width: number; height: number }> = {
        openGraph:       { title: 'Similarity Graph', panel: 'graph',         width: 900, height: 650 },
        openDiscovery:   { title: 'Discovery',         panel: 'discovery',     width: 780, height: 620 },
        openHealth:      { title: 'Library Health',    panel: 'health',        width: 680, height: 520 },
        openQueue:       { title: 'Index Queue',       panel: 'queue',         width: 680, height: 500 },
        openSettings:    { title: 'AI Settings',       panel: 'settings',      width: 560, height: 580 },
        openLibraryChat: { title: 'Library Chat',      panel: 'library-chat',  width: 800, height: 600 },
      };
      const def = panelDefs[command];
      const winId = `zotero-ai-${command}`;

      // If window already open, focus it
      const enumerator = (Services as any).wm.getEnumerator('');
      let existing: any = null;
      while (enumerator.hasMoreElements()) {
        const w = enumerator.getNext();
        if (w.name === winId) { existing = w; break; }
      }
      if (existing) { existing.focus(); break; }

      win.openDialog(
        `chrome://zotero-ai-companion/content/panel.xhtml`,
        winId,
        `chrome,dialog=no,resizable,centerscreen,width=${def.width},height=${def.height}`,
        def.panel,
      );
      break;
    }
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

    case 'openSingleDocChat': {
      // Fired from panel windows (RelatedDocsPanel) with keys in event detail
      const rawKeys = event?.detail?.keys;
      const keys: string[] = Array.isArray(rawKeys) ? rawKeys : [];
      if (keys.length === 0) break;
      const abstract: string = (event?.detail?.abstract as string) || '';
      try {
        win.openDialog(
          `chrome://zotero-ai-companion/content/panel.xhtml`,
          `zotero-ai-chat-docs-${Date.now()}`,
          `chrome,dialog=no,resizable,centerscreen,width=720,height=600`,
          'multi-doc-chat',
          JSON.stringify({ keys, abstract }),
        );
      } catch(e) {
        console.error('[AI Companion] openDialog failed:', e);
      }
      break;
    }

    case 'chatWithDocuments': {
      const selectedItems = (Zotero as any).getActiveZoteroPane()?.getSelectedItems() ?? [];
      const regularItems = selectedItems.filter(
        (it: any) => it.isRegularItem() && !it.parentKey
      );
      if (regularItems.length === 0) {
        win.alert('Please select one or more regular library items.');
        break;
      }
      const keys = regularItems.map((it: any) => it.key);
      try {
        win.openDialog(
          `chrome://zotero-ai-companion/content/panel.xhtml`,
          `zotero-ai-chat-docs-${Date.now()}`,
          `chrome,dialog=no,resizable,centerscreen,width=720,height=600`,
          'multi-doc-chat',
          JSON.stringify({ keys, abstract: '' }),
        );
      } catch(e) {
        console.error('[AI Companion] openDialog failed:', e);
      }
      break;
    }

    case 'importDiscoveryResults': {
      const results: any[] = event?.detail?.results ?? [];
      const listenerId: string = event?.detail?.listenerId ?? '';
      let imported = 0, failed = 0, duplicates = 0;

      const normDoi = (doi: string) =>
        doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();

      const saveManual = async (r: any, cleanDoi: string) => {
        const item = new (Zotero as any).Item('journalArticle');
        item.setField('title', r.title ?? '');
        if (r.journal) item.setField('publicationTitle', r.journal);
        if (r.year)    item.setField('date', String(r.year));
        if (cleanDoi)  item.setField('DOI', cleanDoi);
        if (r.url)     item.setField('url', r.url);
        item.setCreators(
          (r.authors ?? []).map((a: string) => {
            const parts = a.trim().split(/\s+/);
            const lastName = parts.pop() ?? a;
            return { firstName: parts.join(' '), lastName, creatorType: 'author' };
          })
        );
        const abstract = (r.abstract || r.snippet || '').replace(/<[^>]+>/g, ' ').trim();
        if (abstract) item.setField('abstractNote', abstract);
        await item.saveTx();
        return item;
      };

      // Detect the currently selected collection in Zotero
      const zp = (Zotero as any).getActiveZoteroPane();
      const activeCollection = zp?.getSelectedCollection() ?? null;
      const collectionID: number | null = activeCollection?.id ?? null;
      console.log('[AI Import] starting import of', results.length, 'items');
      console.log('[AI Import] ZoteroPane:', !!zp, '| collection:', collectionID, activeCollection?.name ?? 'none');

      for (const r of results) {
        try {
          const cleanDoi = r.doi ? normDoi(r.doi) : '';
          console.log('[AI Import] processing:', r.title?.slice(0, 50), '| DOI:', cleanDoi, '| PMID:', r.pmid);
          const item = await saveManual(r, cleanDoi);

          // Add to active collection if one is selected
          if (activeCollection) {
            activeCollection.addItem(item.id);
            await activeCollection.saveTx();
            console.log('[AI Import] added to collection:', activeCollection.name);
          }

          // Attach full text PDF via Zotero's OA resolver
          try {
            await (Zotero as any).Attachments.addAvailableFile(item, {});
            console.log('[AI Import] PDF fetch triggered for:', r.title?.slice(0, 50));
          } catch (pdfErr) {
            console.warn('[AI Import] PDF attach failed for', r.title?.slice(0, 50), pdfErr);
          }

          imported++;
          console.log('[AI Import] saved:', r.title?.slice(0, 50));
        } catch (e) {
          console.error('[AI Import] failed for', r.title?.slice(0, 50), e);
          failed++;
        }
      }

      console.log('[AI Import] done — imported:', imported, 'failed:', failed);
      // Broadcast to all open windows — the panel may be in a dialog whose
      // opener reference differs from `win` depending on how Zotero resolves it.
      const enumeratorImp = (Services as any).wm.getEnumerator('');
      while (enumeratorImp.hasMoreElements()) {
        const w = enumeratorImp.getNext() as any;
        try {
          const evt = new w.CustomEvent('zotero-ai-import-result', {
            detail: { listenerId, imported, failed, duplicates },
            bubbles: true,
          });
          w.dispatchEvent(evt);
        } catch { /* closed window */ }
      }
      break;
    }

    case 'applyReadingPrefs': {
      const fontSize = String(event?.detail?.fontSize ?? 13) + 'px';
      const textColor = String(event?.detail?.textColor ?? '#cdd6f4');
      const enumerator = (Services as any).wm.getEnumerator('');
      while (enumerator.hasMoreElements()) {
        const w = enumerator.getNext() as any;
        try {
          const browser = w.document?.getElementById('zotero-ai-panel-browser');
          if (browser) {
            const contentDoc = browser.contentDocument;
            if (contentDoc?.documentElement) {
              contentDoc.documentElement.style.setProperty('--reading-font-size', fontSize);
              contentDoc.documentElement.style.setProperty('--reading-text-color', textColor);
            }
          }
        } catch { /* closed or cross-origin window — skip */ }
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
