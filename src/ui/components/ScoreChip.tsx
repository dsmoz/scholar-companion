import React from 'react';
import { SCORE_THRESHOLDS } from '../../prefs';

const SIGNAL_LABELS: Record<string, string> = {
  semantic: 'Semantic',
  entity_overlap: 'Entities',
  bibliographic_coupling: 'References',
  shared_collections: 'Collections',
  shared_tags: 'Tags',
  shared_authors: 'Authors',
  user_related: 'Linked',
  context_boost: 'Context',
};

interface Props {
  score: number;
  signals?: Record<string, number>;
}

export function scoreLabel(score: number): 'Best' | 'Good' | 'Fair' {
  if (score >= SCORE_THRESHOLDS.Best) return 'Best';
  if (score >= SCORE_THRESHOLDS.Good) return 'Good';
  return 'Fair';
}

function buildTooltip(score: number, signals?: Record<string, number>): string {
  const parts = [`Score: ${(score * 100).toFixed(0)}%`];
  if (signals) {
    const active = Object.entries(signals)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
    for (const [key, val] of active) {
      const label = SIGNAL_LABELS[key] ?? key;
      parts.push(`${label}: ${(val * 100).toFixed(0)}%`);
    }
  }
  return parts.join('\n');
}

export function ScoreChip({ score, signals }: Props) {
  const label = scoreLabel(score);
  const color = label === 'Best' ? '#a6e3a1' : label === 'Good' ? '#f9e2af' : '#f38ba8';
  return (
    <span
      title={buildTooltip(score, signals)}
      style={{
        background: color, color: '#1e1e2e',
        borderRadius: 3, padding: '1px 6px',
        fontSize: '0.65rem', fontWeight: 600,
        cursor: 'default',
      }}
    >
      {label}
    </span>
  );
}
