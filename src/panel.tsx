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

const params = new URLSearchParams(window.location.search);
const panel = params.get('panel') ?? 'graph';

if (panel === 'multi-doc-chat') {
  const keysParam = params.get('keys') ?? '[]';
  let keys: string[] = [];
  let initialAbstract = '';
  try {
    const parsed = JSON.parse(decodeURIComponent(keysParam));
    if (Array.isArray(parsed)) {
      keys = parsed;
    } else {
      keys = parsed.keys ?? [];
      initialAbstract = parsed.abstract ?? '';
    }
  } catch { keys = []; }
  const root = createRoot(document.getElementById('root')!);
  root.render(createElement(MultiDocChat, { zoteroKeys: keys, initialAbstract }));
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
