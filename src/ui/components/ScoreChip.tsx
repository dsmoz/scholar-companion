import React from 'react';

interface Props { score: number; }

export function ScoreChip({ score }: Props) {
  const pct = Math.round(score * 100);
  const color = score >= 0.9 ? '#a6e3a1' : score >= 0.8 ? '#f9e2af' : '#f38ba8';
  return (
    <span style={{
      background: color, color: '#1e1e2e',
      borderRadius: 3, padding: '1px 5px',
      fontSize: '0.65rem', fontWeight: 600,
    }}>
      {pct}
    </span>
  );
}
