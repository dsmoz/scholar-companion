// src/ui/components/ReadingToolbar.tsx — compact font size + color controls for chat panels
import React, { useState } from 'react';
import { TextAa, Minus, Plus, Palette } from '@phosphor-icons/react';
import {
  getDiscoveryFontSize, setDiscoveryFontSize,
  getDiscoveryTextColor, setDiscoveryTextColor,
} from '../../prefs';

const MIN_SIZE = 9;
const MAX_SIZE = 21;
const STEP = 2;

export function ReadingToolbar() {
  const [size, setSize] = useState(getDiscoveryFontSize());
  const [color, setColor] = useState(getDiscoveryTextColor());

  function applySize(n: number) {
    const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, n));
    setSize(clamped);
    setDiscoveryFontSize(clamped);
    document.documentElement.style.setProperty('--reading-font-size', `${clamped}px`);
  }

  function applyColor(c: string) {
    setColor(c);
    setDiscoveryTextColor(c);
    document.documentElement.style.setProperty('--reading-text-color', c);
  }

  const btnStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6c7086', padding: 2, display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderBottom: '1px solid #313244',
      background: '#181825', flexShrink: 0,
    }}>
      <TextAa size={12} style={{ color: '#6c7086', flexShrink: 0 }} />
      <button onClick={() => applySize(size - STEP)} disabled={size <= MIN_SIZE}
        title="Decrease font size" style={{ ...btnStyle, opacity: size <= MIN_SIZE ? 0.3 : 1 }}>
        <Minus size={10} weight="bold" />
      </button>
      <span style={{ fontSize: '0.6rem', color: '#6c7086', minWidth: 20, textAlign: 'center' }}>{size}</span>
      <button onClick={() => applySize(size + STEP)} disabled={size >= MAX_SIZE}
        title="Increase font size" style={{ ...btnStyle, opacity: size >= MAX_SIZE ? 0.3 : 1 }}>
        <Plus size={10} weight="bold" />
      </button>
      <div style={{ width: 1, height: 12, background: '#313244', margin: '0 2px' }} />
      <label title="Text color" style={{ ...btnStyle, position: 'relative' }}>
        <Palette size={12} style={{ color }} />
        <input
          type="color"
          value={color}
          onChange={e => applyColor(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 16, height: 16, cursor: 'pointer' }}
        />
      </label>
    </div>
  );
}
