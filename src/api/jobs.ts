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
