// src/api/health.ts
import { apiFetch } from './client';

export interface HealthIssue {
  zotero_key: string;
  title: string;
  issue_type: 'failed_sync' | 'missing_pdf' | 'not_indexed';
  error_message?: string;
  updated_at?: string;
}

export interface LibraryHealth {
  indexed: number;
  unindexed: number;
  failed: number;
  missing_pdf: number;
  total: number;
  sync_percentage: string;
  last_sync: string;
  status: string;
  issues: HealthIssue[];
}

const CACHE_TTL_MS = 60_000;
let healthCache: { data: LibraryHealth; at: number } | null = null;

export async function fetchLibraryHealth(force = false): Promise<LibraryHealth> {
  if (!force && healthCache && Date.now() - healthCache.at < CACHE_TTL_MS) {
    return healthCache.data;
  }
  const data = await apiFetch<LibraryHealth>('/health/library');
  healthCache = { data, at: Date.now() };
  return data;
}

export function invalidateHealthCache() {
  healthCache = null;
}

export async function indexAllPending(): Promise<{ queued: number }> {
  return apiFetch<{ queued: number }>('/sync', { method: 'POST' });
}

export async function fixOrphans(): Promise<{ removed: number; dry_run: boolean }> {
  return apiFetch('/cleanup/orphans', {
    method: 'POST',
    body: JSON.stringify({ dry_run: false }),
  });
}
