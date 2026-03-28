// src/ui/components/StripedList.tsx
import React from 'react';

interface Props {
  children: React.ReactNode[];
  emptyMessage?: string;
}

const ROW_EVEN = '#1e1e2e';
const ROW_ODD = '#181825';

export function StripedList({ children, emptyMessage = 'No items' }: Props) {
  const rows = React.Children.toArray(children);
  if (rows.length === 0) {
    return (
      <div style={{ color: '#6c7086', textAlign: 'center', padding: '1rem' }}>{emptyMessage}</div>
    );
  }
  return (
    <div style={{ borderRadius: 4, overflow: 'hidden' }}>
      {rows.map((child, idx) => (
        <div key={idx} style={{ background: idx % 2 === 0 ? ROW_EVEN : ROW_ODD }}>
          {child}
        </div>
      ))}
    </div>
  );
}
