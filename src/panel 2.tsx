// src/panel.tsx — entry point for tab panels, rendered in XUL browser element
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { GraphTab } from './ui/GraphTab';
import { DiscoveryPanel } from './ui/DiscoveryPanel';
import { HealthPanel } from './ui/HealthPanel';
import { IndexQueue } from './ui/IndexQueue';
import { Settings } from './ui/Settings';

const PANELS: Record<string, React.ComponentType<any>> = {
  graph:     GraphTab,
  discovery: DiscoveryPanel,
  health:    HealthPanel,
  queue:     IndexQueue,
  settings:  Settings,
};

const panel = new URLSearchParams(window.location.search).get('panel') ?? 'graph';
const Component = PANELS[panel] ?? GraphTab;

const root = createRoot(document.getElementById('root')!);
root.render(createElement(Component, {}));
