// src/api/jobs.ts
import { apiFetch } from './client';

export interface Job {
  id: string;
  type: 'add_to_qdrant' | 'update_metadata' | 'sync_payload' | 'neo4j_ingest';
  title: string;
  progress?: number;
  time_remaining?: number;
  error?: string;
}

export interface JobsStatus {
  pending: Job[];
  processing: Job | null;
  failed: Job[];
  completed_count: number;
  processor_running: boolean;
}

export async function fetchJobs(): Promise<JobsStatus> {
  return apiFetch<JobsStatus>('/jobs');
}

export async function retryJob(jobId: string): Promise<void> {
  await apiFetch(`/jobs/${jobId}/retry`, { method: 'POST' });
}

export async function pauseProcessor(): Promise<void> {
  await apiFetch('/processor/pause', {
    method: 'POST',
    body: JSON.stringify({ hours: 24, reason: 'paused via plugin' }),
  });
}

export async function resumeProcessor(): Promise<void> {
  await apiFetch('/processor/resume', { method: 'POST' });
}

export async function retryAllFailed(): Promise<void> {
  await apiFetch('/jobs/retry-all', { method: 'POST' });
}

export async function clearCompleted(): Promise<void> {
  await apiFetch('/jobs/completed', { method: 'DELETE' });
}
