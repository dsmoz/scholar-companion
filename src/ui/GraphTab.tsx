// src/ui/GraphTab.tsx
import React, { useEffect, useRef, useState } from 'react';
import { fetchGraphData } from '../api/graph';

interface Props {
  onSelectItem?: (zoteroKey: string) => void;
  onChatItem?: (zoteroKey: string) => void;
  onDeleteItem?: (zoteroKey: string) => void;
}

export function GraphTab({ onSelectItem, onChatItem, onDeleteItem }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectItem, onChatItem, onDeleteItem]);

  function handleMessage(e: MessageEvent) {
    if (typeof e.data?.zoteroKey !== 'string') return;
    const key = e.data.zoteroKey;
    if (e.data.type === 'nodeClick' || e.data.type === 'openItem') onSelectItem?.(key);
    if (e.data.type === 'chatItem') onChatItem?.(key);
    if (e.data.type === 'deleteItem') onDeleteItem?.(key);
  }

  async function onFrameLoad() {
    const data = await fetchGraphData(undefined, 0.75);
    frameRef.current?.contentWindow?.postMessage({ type: 'graphData', payload: data }, '*');
    setLoading(false);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#11111b', color: '#6c7086', zIndex: 1 }}>
          Loading graph...
        </div>
      )}
      <iframe
        ref={frameRef}
        src="chrome://zotero-ai-companion/content/graph/network.html"
        onLoad={onFrameLoad}
        style={{ border: 'none', width: '100%', height: '100%' }}
        title="Similarity Graph"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
