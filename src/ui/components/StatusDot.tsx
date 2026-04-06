import React from 'react';
import { WifiHigh, WifiMedium, WifiSlash } from '@phosphor-icons/react';

type Status = 'connected' | 'degraded' | 'offline';
interface Props { status: Status; latency?: number; }

const COLOR: Record<Status, string> = {
  connected: '#a6e3a1',
  degraded: '#f9e2af',
  offline: '#f38ba8',
};

const ICON: Record<Status, React.ReactNode> = {
  connected: <WifiHigh size={12} weight="bold" />,
  degraded: <WifiMedium size={12} weight="bold" />,
  offline: <WifiSlash size={12} weight="bold" />,
};

export function StatusDot({ status, latency }: Props) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: COLOR[status] }}>
      {ICON[status]}
      <span style={{ fontSize: '0.7rem' }}>
        {status === 'connected' ? `Connected${latency ? ` · ${latency}ms` : ''}` : status}
      </span>
    </span>
  );
}
