// src/api/sync.ts
import { apiFetch } from './client';

export interface SyncResult {
  queued: number;
  already_synced: number;
}

export async function triggerSync(): Promise<SyncResult> {
  return apiFetch<SyncResult>('/sync', { method: 'POST' });
}

export async function syncMetadata(keys: string[]): Promise<{ synced: number }> {
  return apiFetch<{ synced: number }>('/sync/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
  });
}
