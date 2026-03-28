// src/api/client.ts
import { getApiUrl } from '../prefs';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (err instanceof ApiError && err.status < 500) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  throw lastError;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiUrl();
  const url = `${base}/api/plugin${path}`;
  return withRetry(async () => {
    const resp = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try {
        const body = await resp.json();
        msg = body.error ?? msg;
      } catch { /* ignore */ }
      throw new ApiError(resp.status, msg);
    }
    return resp.json() as Promise<T>;
  });
}

export async function checkConnection(): Promise<{ latency: number }> {
  const start = Date.now();
  await apiFetch('/health');
  return { latency: Date.now() - start };
}
