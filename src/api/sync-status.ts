// src/api/sync-status.ts
import { apiFetch } from './client';

export interface SyncStatusItem {
  zotero_key: string;
  sync_status: 'synced' | 'pending' | 'error';
  title: string;
}

export interface SyncStatusResponse {
  items: SyncStatusItem[];
  total: number;
}

export function fetchSyncStatus(keys?: string[]): Promise<SyncStatusResponse> {
  if (keys && keys.length > 0) {
    return apiFetch<SyncStatusResponse>('/sync-status', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });
  }
  return apiFetch<SyncStatusResponse>('/sync-status');
}

export function updateItemMetadata(zoteroKey: string): Promise<{ queued: boolean }> {
  return apiFetch<{ queued: boolean }>(`/items/${zoteroKey}/metadata`, { method: 'POST' });
}
