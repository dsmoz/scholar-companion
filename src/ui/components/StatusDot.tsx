import React from 'react';

type Status = 'connected' | 'degraded' | 'offline';
interface Props { status: Status; latency?: number; }

const COLOR: Record<Status, string> = {
  connected: '#a6e3a1',
  degraded: '#f9e2af',
  offline: '#f38ba8',
};

export function StatusDot({ status, latency }: Props) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: COLOR[status], display: 'inline-block',
      }} />
      <span style={{ fontSize: '0.7rem', color: COLOR[status] }}>
        {status === 'connected' ? `Connected${latency ? ` · ${latency}ms` : ''}` : status}
      </span>
    </span>
  );
}
