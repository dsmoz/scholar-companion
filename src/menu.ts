// src/menu.ts

export function registerMenus(win: Window) {
  const doc = win.document;
  const toolsMenu = doc.getElementById('menu_ToolsPopup');
  if (!toolsMenu) return;

  const menu = (doc as any).createXULElement('menu');
  menu.setAttribute('label', 'AI Companion');
  menu.setAttribute('id', 'zotero-ai-menu');

  const popup = (doc as any).createXULElement('menupopup');

  const items: Array<{ id: string; label: string; command: string }> = [
    { id: 'zotero-ai-graph', label: 'Similarity Graph', command: 'openGraph' },
    { id: 'zotero-ai-discovery', label: 'Discovery', command: 'openDiscovery' },
    { id: 'zotero-ai-health', label: 'Library Health', command: 'openHealth' },
    { id: 'zotero-ai-queue', label: 'Index Queue', command: 'openQueue' },
    { id: 'zotero-ai-settings', label: 'Settings', command: 'openSettings' },
  ];

  for (const item of items) {
    const menuitem = (doc as any).createXULElement('menuitem');
    menuitem.setAttribute('id', item.id);
    menuitem.setAttribute('label', item.label);
    menuitem.addEventListener('command', () =>
      win.dispatchEvent(new CustomEvent('zotero-ai-command', { detail: { command: item.command } }))
    );
    popup.appendChild(menuitem);
  }

  menu.appendChild(popup);
  toolsMenu.appendChild(menu);
}

export function registerContextMenu(win: Window) {
  const doc = win.document;
  const itemContextMenu = doc.getElementById('zotero-itemmenu');
  if (!itemContextMenu) return;

  const deleteItem = (doc as any).createXULElement('menuitem');
  deleteItem.setAttribute('id', 'zotero-ai-cascade-delete');
  deleteItem.setAttribute('label', 'Delete with AI cleanup');
  deleteItem.addEventListener('command', () =>
    win.dispatchEvent(new CustomEvent('zotero-ai-command', { detail: { command: 'cascadeDelete' } }))
  );
  itemContextMenu.appendChild(deleteItem);

  // Separator
  const sep = (doc as any).createXULElement('menuseparator');
  sep.setAttribute('id', 'zotero-ai-context-sep');
  itemContextMenu.appendChild(sep);

  const contextItems: Array<{ id: string; label: string; command: string }> = [
    { id: 'zotero-ai-color-sync', label: 'Color by sync status', command: 'colorSyncStatus' },
    { id: 'zotero-ai-update-metadata', label: 'Update metadata (AI)', command: 'updateMetadata' },
    { id: 'zotero-ai-index-selected', label: 'Index to Qdrant', command: 'indexSelected' },
  ];

  for (const ci of contextItems) {
    const menuitem = (doc as any).createXULElement('menuitem');
    menuitem.setAttribute('id', ci.id);
    menuitem.setAttribute('label', ci.label);
    menuitem.addEventListener('command', () =>
      win.dispatchEvent(new CustomEvent('zotero-ai-command', { detail: { command: ci.command } }))
    );
    itemContextMenu.appendChild(menuitem);
  }
}
