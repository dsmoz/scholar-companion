import React from 'react';

interface Props { checked: boolean; onChange: (v: boolean) => void; }

export function Toggle({ checked, onChange }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        background: checked ? '#a6e3a1' : '#45475a',
        border: 'none', borderRadius: 10, width: 34, height: 18,
        position: 'relative', cursor: 'pointer', padding: 0,
      }}
    >
      <span style={{
        width: 14, height: 14, background: 'white', borderRadius: '50%',
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        transition: 'left 0.15s',
      }} />
    </button>
  );
}
