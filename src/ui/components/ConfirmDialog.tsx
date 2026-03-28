import React from 'react';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg, #1e1e2e)', border: '1px solid #444',
        borderRadius: 8, padding: '1.5rem', maxWidth: 360,
      }}>
        <p style={{ color: 'var(--text, #cdd6f4)', marginBottom: '1rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '1px solid #444',
            color: '#cdd6f4', borderRadius: 4, padding: '0.25rem 0.75rem', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: '#f38ba8', border: 'none',
            color: '#1e1e2e', borderRadius: 4, padding: '0.25rem 0.75rem', cursor: 'pointer',
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
