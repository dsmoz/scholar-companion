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

export async function fetchLibraryHealth(): Promise<LibraryHealth> {
  return apiFetch<LibraryHealth>('/health/library');
}
