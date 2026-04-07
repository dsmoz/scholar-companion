// src/api/health.ts
import { apiFetch } from './client';

export interface HealthIssue {
  zotero_key: string;
  title: string;
  issue_type: 'failed_sync' | 'missing_pdf' | 'not_indexed';
  error_message?: string;
}

export interface LibraryHealth {
  indexed: number;
  unindexed: number;
  failed: number;
  missing_pdf: number;
  issues: HealthIssue[];
}

let _healthCache: { data: LibraryHealth; expiresAt: number } | null = null;
const HEALTH_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchLibraryHealth(): Promise<LibraryHealth> {
  if (_healthCache && Date.now() < _healthCache.expiresAt) return _healthCache.data;
  const data = await apiFetch<LibraryHealth>('/health/library');
  _healthCache = { data, expiresAt: Date.now() + HEALTH_TTL_MS };
  return data;
}

export function invalidateHealthCache(): void {
  _healthCache = null;
}
