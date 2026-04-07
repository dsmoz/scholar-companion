// src/panel.tsx — entry point for tab panels, rendered in XUL browser element
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { GraphTab } from './ui/GraphTab';
import { DiscoveryPanel } from './ui/DiscoveryPanel';
import { HealthPanel } from './ui/HealthPanel';
import { IndexQueue } from './ui/IndexQueue';
import { Settings } from './ui/Settings';
import { LibraryChat } from './ui/LibraryChat';
import { MultiDocChat } from './ui/MultiDocChat';
import { ItemPaneTab } from './ui/ItemPaneTab';
import { getDiscoveryFontSize, getDiscoveryTextColor } from './prefs';

// Apply reading preferences as CSS variables so all panels inherit them
(function applyReadingPrefs() {
  const root = document.documentElement;
  root.style.setProperty('--reading-font-size', `${getDiscoveryFontSize()}px`);
  root.style.setProperty('--reading-text-color', getDiscoveryTextColor());
})();

const params = new URLSearchParams(window.location.search);
const panel = params.get('panel') ?? 'graph';

if (panel === 'multi-doc-chat') {
  const keysParam = params.get('keys') ?? '[]';
  let keys: string[] = [];
  let initialAbstract = '';
  let initialDocs: Array<{ key: string; title: string; creators: Array<{ firstName: string; lastName: string }>; date: string; item_type: string }> = [];
  try {
    const parsed = JSON.parse(decodeURIComponent(keysParam));
    if (Array.isArray(parsed)) {
      keys = parsed;
    } else {
      keys = parsed.keys ?? [];
      initialAbstract = parsed.abstract ?? '';
      initialDocs = parsed.docs ?? [];
    }
  } catch { keys = []; }
  const root = createRoot(document.getElementById('root')!);
  root.render(createElement(MultiDocChat, { zoteroKeys: keys, initialAbstract, initialDocs }));
} else if (panel === 'item-chat') {
  const key = params.get('key') ?? '';
  const title = decodeURIComponent(params.get('title') ?? '');
  const root = createRoot(document.getElementById('root')!);
  root.render(createElement(ItemPaneTab, { zoteroKey: key, title, authors: [] }));
} else {
  const PANELS: Record<string, React.ComponentType<any>> = {
    graph:          GraphTab,
    discovery:      DiscoveryPanel,
    health:         HealthPanel,
    queue:          IndexQueue,
    settings:       Settings,
    'library-chat': LibraryChat,
  };
  const Component = PANELS[panel] ?? GraphTab;
  const root = createRoot(document.getElementById('root')!);
  root.render(createElement(Component, {}));
}
