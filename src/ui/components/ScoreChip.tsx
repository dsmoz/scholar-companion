import React from 'react';
import { SCORE_THRESHOLDS } from '../../prefs';

interface Props { score: number; }

export function scoreLabel(score: number): 'Best' | 'Good' | 'Fair' {
  if (score >= SCORE_THRESHOLDS.Best) return 'Best';
  if (score >= SCORE_THRESHOLDS.Good) return 'Good';
  return 'Fair';
}

export function ScoreChip({ score }: Props) {
  const label = scoreLabel(score);
  const color = label === 'Best' ? '#a6e3a1' : label === 'Good' ? '#f9e2af' : '#f38ba8';
  return (
    <span style={{
      background: color, color: '#1e1e2e',
      borderRadius: 3, padding: '1px 6px',
      fontSize: '0.65rem', fontWeight: 600,
    }}>
      {label}
    </span>
  );
}
