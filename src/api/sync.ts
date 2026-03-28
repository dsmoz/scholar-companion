// src/api/sync.ts
import { apiFetch } from './client';

export interface SyncResult {
  queued: number;
  already_synced: number;
}

export async function triggerSync(): Promise<SyncResult> {
  return apiFetch<SyncResult>('/sync', { method: 'POST' });
}
