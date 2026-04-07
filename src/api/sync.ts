// src/api/sync.ts
import { apiFetch } from './client';
import { clearAllChatCaches } from './chat';
import { invalidateHealthCache } from './health';

export interface SyncResult {
  queued: number;
  already_synced: number;
}

export async function triggerSync(): Promise<SyncResult> {
  const result = await apiFetch<SyncResult>('/sync', { method: 'POST' });
  // Sync changes library state — invalidate stale caches
  clearAllChatCaches();
  invalidateHealthCache();
  return result;
}

export async function syncMetadata(keys: string[]): Promise<{ synced: number }> {
  return apiFetch<{ synced: number }>('/sync/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
  });
}
