// src/bootstrap.ts
import { registerEventHooks, unregisterEventHooks } from './events';
import { registerMenus, registerContextMenu, registerCollectionMenu, unregisterCollectionMenu, setMenusConnected } from './menu';
import { getSyncOnStartup, getAutoSync, getSyncInterval, getItemPaneHeight, getApiUrl, getApiToken } from './prefs';
import { triggerSync } from './api/sync';
import { fetchSyncStatus, updateItemMetadata } from './api/sync-status';
import { apiFetch, checkConnection } from './api/client';

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
        paneID: 'scholar-companion',
        pluginID: 'scholar-companion@dsmoz',
        header: {
          l10nID: 'scholar-companion-header',
          icon: `${_rootURI}content/icons/icon16.png`,
        },
        sidenav: {
          l10nID: 'scholar-companion-sidenav',
          icon: `${_rootURI}content/icons/icon20.png`,
        },
        onInit: ({ body }: { body: HTMLElement }) => {
          const minH = getItemPaneHeight();
          body.style.cssText = `height:100%;min-height:${minH}px;overflow:hidden;padding:0;`;
          const doc = body.ownerDocument;
          const iframe = doc.createElementNS('http://www.w3.org/1999/xhtml', 'iframe') as HTMLIFrameElement;
          iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
          body.replaceChildren(iframe);
          (body as any)._aiIframe = iframe;
        },
        onItemChange: ({ body, item, setEnabled }: { body: HTMLElement; item: any; setEnabled: (enabled: boolean) => void }) => {
          if (!item) { setEnabled(false); return false; }
          setEnabled(true);
          const key = item.key;
          const title = encodeURIComponent(item.getField('title') ?? '');
          const authors = encodeURIComponent(JSON.stringify(
            (item.getCreators?.() ?? []).map((c: any) => ({
              firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '',
            }))
          ));
          const src = `chrome://scholar-companion/content/panel.html?panel=item-chat&key=${key}&title=${title}&authors=${authors}`;
          const iframe = (body as any)._aiIframe as HTMLIFrameElement | undefined;
          if (iframe && iframe.src !== src) {
            iframe.src = src;
          }
          return true;
        },
        onRender: ({ body, item }: { body: HTMLElement; item: any }) => {
          if (!item) return;
          const key = item.key;
          const title = encodeURIComponent(item.getField('title') ?? '');
          const authors = encodeURIComponent(JSON.stringify(
            (item.getCreators?.() ?? []).map((c: any) => ({
              firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '',
            }))
          ));
          const src = `chrome://scholar-companion/content/panel.html?panel=item-chat&key=${key}&title=${title}&authors=${authors}`;
          const iframe = (body as any)._aiIframe as HTMLIFrameElement | undefined;
          if (iframe && iframe.src !== src) {
            iframe.src = src;
          }
        },
        onDestroy: ({ body }: { body: HTMLElement }) => {
          delete (body as any)._aiIframe;
        },
      });
    } catch(e) { (Zotero as any).logError(e); }
  }

  // Register collection context menu via MenuManager (global, not per-window)
  console.log('[Scholar Companion] MenuManager available:', typeof (Zotero as any).MenuManager, Object.keys((Zotero as any).MenuManager || {}));
  try {
    registerCollectionMenu();
    console.log('[Scholar Companion] Collection menu registered successfully');
  } catch(e) {
    console.error('[Scholar Companion] MenuManager registration failed:', e);
  }

  // Initialize any already-open windows (plugin loaded after Zotero started)
  for (const win of (Zotero as any).getMainWindows()) {
    initWindow(win);
  }

  if (getSyncOnStartup()) {
    triggerSync().catch(() => { /* server may not be running */ });
  }
  scheduleSync();
}

function shutdown() {
  unregisterEventHooks();
  unregisterCollectionMenu();
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

  // Start with menus disabled until connection is verified
  setMenusConnected(win, false);
  if (getApiToken()) {
    // Use XMLHttpRequest for startup — fetch() may not be available in the bootstrap sandbox
    const url = `${getApiUrl()}/health`;
    try {
      const xhr = new (win as any).XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 8000;
      const token = getApiToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('[Scholar Companion] Startup connection OK');
          setMenusConnected(win, true);
        }
      };
      xhr.onerror = () => console.warn('[Scholar Companion] Startup connection failed');
      xhr.ontimeout = () => console.warn('[Scholar Companion] Startup connection timed out');
      xhr.send();
    } catch (e) {
      console.warn('[Scholar Companion] Startup connection check error:', e);
    }
  }

  const handler: EventListener = (e: Event) =>
    handleCommand((e as CustomEvent).detail.command, win, e as CustomEvent).catch((err: unknown) =>
      console.error('[Scholar Companion] Command error:', err)
    );
  win.addEventListener('zotero-ai-command', handler);
  windowListeners.set(win, handler);

  // Listen for connection state changes from Settings panel
  win.addEventListener('zotero-ai-connection', ((e: CustomEvent) => {
    setMenusConnected(win, e.detail?.connected === true);
  }) as EventListener);
}

function scheduleSync() {
  if (syncTimer) clearInterval(syncTimer);
  if (!getAutoSync()) return;
  const intervalMs = getSyncInterval() * 60 * 60 * 1000;
  syncTimer = setInterval(async () => {
    try { await triggerSync(); } catch (e) { console.warn('[Scholar Companion] Scheduled sync failed:', e); }
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
        `chrome://scholar-companion/content/panel.xhtml`,
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
            console.error('[Scholar Companion] Cascade delete failed:', e);
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
        const selectedKeys = regularItems.map((it: any) => it.key as string);
        const resp = await fetchSyncStatus(selectedKeys);
        const statusItems = resp?.items ?? [];
        const statusMap = new Map(statusItems.map((s) => [s.zotero_key, s.sync_status]));

        const TAG_MAP: Record<string, { tag: string; color: string }> = {
          synced:           { tag: 'SC: Synced',  color: '#a6e3a1' },
          pending:          { tag: 'SC: Pending', color: '#f9e2af' },
          error:            { tag: 'SC: Error',   color: '#f38ba8' },
          failed_permanent: { tag: 'SC: Error',   color: '#f38ba8' },
          deleted:          { tag: 'SC: Error',   color: '#f38ba8' },
        };
        const ALL_TAGS = [...new Set(Object.values(TAG_MAP).map((t) => t.tag))];
        const LEGACY_TAGS = ['🟢 Synced', '🟡 Pending', '🔴 Error'];

        // Set tag colours once (not per item)
        const libID = regularItems[0].libraryID;
        const uniqueEntries = new Map(Object.values(TAG_MAP).map(e => [e.tag, e]));
        for (const entry of uniqueEntries.values()) {
          try { await (Zotero as any).Tags.setColor(libID, entry.tag, entry.color); } catch { /* ignore */ }
        }

        let colored = 0;
        for (const it of regularItems) {
          try {
            for (const t of [...ALL_TAGS, ...LEGACY_TAGS]) it.removeTag(t);
            const rawStatus = statusMap.get(it.key) ?? 'pending';
            const info = TAG_MAP[rawStatus] ?? TAG_MAP.pending;
            it.addTag(info.tag);
            await it.saveTx();
            colored++;
          } catch (err) {
            console.warn('[Scholar Companion] colorSyncStatus: failed for', it.key, err);
          }
        }
        win.alert(`Colored ${colored} of ${regularItems.length} item(s) by sync status.`);
      } catch (e) {
        console.error('[Scholar Companion] colorSyncStatus failed:', e);
        const msg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null ? JSON.stringify(e) : String(e));
        win.alert(`Color sync failed: ${msg}`);
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
        let queued = 0;
        for (const it of regularItems) {
          try {
            await updateItemMetadata(it.key);
            queued++;
          } catch (e) {
            console.warn('[Scholar Companion] metadata update failed for', it.key, e);
          }
        }
        win.alert(`Queued ${queued} of ${regularItems.length} item(s) for metadata update.`);
      } catch (e) {
        console.error('[Scholar Companion] updateMetadata failed:', e);
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
        console.error('[Scholar Companion] indexSelected failed:', e);
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
          `chrome://scholar-companion/content/panel.xhtml`,
          `zotero-ai-chat-docs-${Date.now()}`,
          `chrome,dialog=no,resizable,centerscreen,width=720,height=600`,
          'multi-doc-chat',
          JSON.stringify({ keys, abstract }),
        );
      } catch(e) {
        console.error('[Scholar Companion] openDialog failed:', e);
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
      const docs = regularItems.map((it: any) => ({
        key: it.key,
        title: it.getField('title') || it.key,
        creators: (it.getCreators?.() ?? []).map((c: any) => ({
          firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '',
        })),
        date: it.getField?.('date') || '',
        item_type: it.itemType || '',
      }));
      try {
        win.openDialog(
          `chrome://scholar-companion/content/panel.xhtml`,
          `zotero-ai-chat-docs-${Date.now()}`,
          `chrome,dialog=no,resizable,centerscreen,width=720,height=600`,
          'multi-doc-chat',
          JSON.stringify({ keys, docs, abstract: '' }),
        );
      } catch(e) {
        console.error('[Scholar Companion] openDialog failed:', e);
      }
      break;
    }

    case 'chatWithCollection': {
      const zp = (Zotero as any).getActiveZoteroPane();
      const collection = zp?.getSelectedCollection();
      if (!collection) {
        win.alert('Please right-click a collection to use this feature.');
        break;
      }
      const allItems = collection.getChildItems();
      const regularItems = allItems.filter(
        (it: any) => it.isRegularItem() && !it.parentKey
      );
      if (regularItems.length === 0) {
        win.alert(`The collection "${collection.name}" has no regular items to chat with.`);
        break;
      }
      const MAX_COLLECTION_ITEMS = 50;
      let itemsToChat = regularItems;
      if (regularItems.length > MAX_COLLECTION_ITEMS) {
        const proceed = win.confirm(
          `This collection has ${regularItems.length} items. ` +
          `Only the first ${MAX_COLLECTION_ITEMS} will be included in the chat.\n\nContinue?`
        );
        if (!proceed) break;
        itemsToChat = regularItems.slice(0, MAX_COLLECTION_ITEMS);
      }
      const collKeys = itemsToChat.map((it: any) => it.key);
      const collDocs = itemsToChat.map((it: any) => ({
        key: it.key,
        title: it.getField('title') || it.key,
        creators: (it.getCreators?.() ?? []).map((c: any) => ({
          firstName: c.firstName ?? '', lastName: c.lastName ?? c.name ?? '',
        })),
        date: it.getField?.('date') || '',
        item_type: it.itemType || '',
      }));
      try {
        win.openDialog(
          `chrome://scholar-companion/content/panel.xhtml`,
          `zotero-ai-chat-docs-${Date.now()}`,
          `chrome,dialog=no,resizable,centerscreen,width=720,height=600`,
          'multi-doc-chat',
          JSON.stringify({
            keys: collKeys,
            docs: collDocs,
            abstract: '',
            scope: { type: 'collection', name: collection.name, count: regularItems.length },
          }),
        );
      } catch (e) {
        console.error('[Scholar Companion] openDialog failed:', e);
      }
      break;
    }

    case 'importDiscoveryResults': {
      const results: any[] = event?.detail?.results ?? [];
      const listenerId: string = event?.detail?.listenerId ?? '';
      let imported = 0, failed = 0, duplicates = 0;

      const normDoi = (doi: string) =>
        doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();

      const saveManual = async (r: any, cleanDoi: string, colID: number | null) => {
        const zoteroType = r.item_type === 'videoRecording' ? 'videoRecording'
          : r.item_type === 'report' ? 'report'
          : r.item_type === 'webpage' ? 'webpage'
          : 'journalArticle';
        const item = new (Zotero as any).Item(zoteroType);
        item.setField('title', r.title ?? '');
        if (r.journal) {
          const journalField = zoteroType === 'webpage' ? 'websiteTitle'
            : zoteroType === 'videoRecording' ? 'studio'
            : 'publicationTitle';
          try { item.setField(journalField, r.journal); } catch { /* field not supported */ }
        }
        if (r.year)    item.setField('date', String(r.year));
        if (cleanDoi)  item.setField('DOI', cleanDoi);
        if (r.url)     item.setField('url', r.url);
        const creators = (r.authors ?? [])
          .map((a: string) => {
            const parts = a.trim().split(/\s+/);
            const lastName = parts.pop() ?? '';
            return { firstName: parts.join(' '), lastName, creatorType: 'author' };
          })
          .filter((c: any) => c.lastName.trim() !== '');
        // Fallback: use domain as corporate author for web items with no authors
        if (creators.length === 0 && r.url) {
          try {
            const host = new URL(r.url).hostname.replace(/^www\./, '');
            if (host) creators.push({ firstName: '', lastName: host, creatorType: 'author' });
          } catch { /* invalid URL, skip */ }
        }
        if (creators.length) item.setCreators(creators);
        const abstract = (r.abstract || r.snippet || '').replace(/<[^>]+>/g, ' ').trim();
        if (abstract) item.setField('abstractNote', abstract);
        // Set collection before saving — this is the correct way in Zotero 7
        if (colID) item.setCollections([colID]);
        if (r.tags?.length) {
          r.tags.forEach((tag: string) => item.addTag(tag));
        }
        await item.saveTx();

        // For web items, attach snapshot (webpage) or download PDF (report)
        if ((zoteroType === 'webpage' || zoteroType === 'report') && r.url) {
          try {
            const attachment = await (Zotero as any).Attachments.importFromURL({
              url: r.url,
              parentItemID: item.id,
              title: r.title ?? 'Attachment',
            });
            if (attachment && zoteroType === 'report') {
              try {
                await attachment.renameAttachmentFile('PDF.pdf');
              } catch (renameErr) {
                console.warn('[AI Import] PDF rename failed:', renameErr);
              }
            }
            console.log('[AI Import] snapshot/PDF attached for', r.url?.slice(0, 60));
          } catch (snapErr) {
            console.warn('[AI Import] snapshot failed for', r.url?.slice(0, 60), snapErr);
          }
        }

        return item;
      };

      // Detect the currently selected collection in Zotero
      // Try getActiveZoteroPane first, fall back to iterating main windows
      let zp = (Zotero as any).getActiveZoteroPane();
      if (!zp) {
        for (const mw of (Zotero as any).getMainWindows?.() ?? []) {
          const candidate = mw.ZoteroPane ?? mw.Zotero?.getActiveZoteroPane?.();
          if (candidate) { zp = candidate; break; }
        }
      }
      const activeCollection = zp?.getSelectedCollection() ?? null;
      const collectionID: number | null = activeCollection?.id ?? null;
      const libraryID: number = activeCollection?.libraryID
        ?? zp?.getSelectedLibraryID?.()
        ?? (Zotero as any).Libraries.userLibraryID;
      console.log('[AI Import] starting import of', results.length, 'items');
      console.log('[AI Import] ZoteroPane:', !!zp, '| libraryID:', libraryID, '| collection:', collectionID, activeCollection?.name ?? 'none');

      for (const r of results) {
        try {
          const cleanDoi = r.doi ? normDoi(r.doi) : '';
          const pmid = r.pmid ? String(r.pmid).trim() : '';
          console.log('[AI Import] processing:', r.title?.slice(0, 50), '| DOI:', cleanDoi, '| PMID:', pmid);

          if (cleanDoi || pmid) {
            // Use Translate.Search for items with identifiers — handles collection + PDFs automatically
            try {
              const translate = new (Zotero as any).Translate.Search();
              const identifier = cleanDoi ? { DOI: cleanDoi } : { PMID: pmid };
              translate.setIdentifier(identifier);
              const translators = await translate.getTranslators();
              if (translators && translators.length > 0) {
                translate.setTranslator(translators);
                const savedItems = await translate.translate({
                  libraryID,
                  collections: collectionID ? [collectionID] : false,
                  saveAttachments: true,
                });
                console.log('[AI Import] Translate.Search saved', savedItems?.length ?? 0, 'item(s) for', r.title?.slice(0, 50));
                if (r.tags?.length && savedItems?.length) {
                  for (const saved of savedItems) {
                    r.tags.forEach((tag: string) => saved.addTag(tag));
                    await saved.saveTx();
                  }
                }
              } else {
                console.warn('[AI Import] No translators for identifier, falling back to manual');
                await saveManual(r, cleanDoi, collectionID);
              }
            } catch (translateErr) {
              console.warn('[AI Import] Translate.Search failed, falling back to manual:', translateErr);
              await saveManual(r, cleanDoi, collectionID);
            }
          } else {
            // No identifier — manual save only
            await saveManual(r, cleanDoi, collectionID);
          }

          imported++;
          if (collectionID) console.log('[AI Import] added to collection:', activeCollection?.name);
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
