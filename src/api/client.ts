// src/api/client.ts
import { getApiUrl, getApiToken, setApiToken, setClientId, setDisplayName } from '../prefs';

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

/** Build headers with optional Bearer auth for SSE and direct fetch calls. */
export function getAuthHeaders(): Record<string, string> {
  const token = getApiToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
      headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string> ?? {}) },
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

export async function checkConnection(): Promise<{ latency: number; clientName?: string }> {
  const start = Date.now();
  try {
    const data = await apiFetch<{ status: string; client_name?: string }>('/health');
    const latency = Date.now() - start;
    console.log('[Scholar Companion] Connection OK:', data.status, '- latency:', latency, 'ms');
    return { latency, clientName: data.client_name };
  } catch (err) {
    console.error('[Scholar Companion] Connection check failed:', err);
    throw err;
  }
}

export interface LoginResult {
  success: boolean;
  client_id: string;
  access_token: string;
  expires_in: number;
  display_name: string;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const base = getApiUrl();
  const url = `${base}/portal/api/login`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch (err: any) {
    console.error('[Scholar Companion] Login fetch failed:', url, err);
    throw new ApiError(0, `Cannot reach server at ${base}. Check your connection.`);
  }
  let data: any;
  try {
    data = await resp.json();
  } catch {
    throw new ApiError(resp.status, `Server returned invalid response (HTTP ${resp.status})`);
  }
  if (!resp.ok) {
    throw new ApiError(resp.status, data.error ?? data.message ?? `HTTP ${resp.status}`);
  }
  // Persist credentials
  setApiToken(data.access_token);
  setClientId(data.client_id);
  setDisplayName(data.display_name || '');
  return data;
}

export function disconnect(): void {
  setApiToken('');
  setClientId('');
  setDisplayName('');
}
