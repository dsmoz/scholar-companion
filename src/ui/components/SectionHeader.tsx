import React from 'react';

interface Props { children: React.ReactNode; }

export function SectionHeader({ children }: Props) {
  return (
    <div style={{
      color: 'var(--accent, #89b4fa)',
      fontWeight: 700, fontSize: '0.7rem',
      letterSpacing: '0.08em', marginBottom: '0.5rem',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}
