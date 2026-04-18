// src/api/client.ts
import { getApiUrl, getApiToken, setApiToken, setClientId, setUserId, setDisplayName } from '../prefs';

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
      if (resp.status === 401) {
        msg = 'Session expired or not authorised. Please reconnect in Settings.';
      } else if (resp.status === 403) {
        msg = 'Account not provisioned. Finish setup in the DS-MOZ portal, then reconnect.';
      }
      throw new ApiError(resp.status, msg);
    }
    return resp.json() as Promise<T>;
  });
}

export async function checkConnection(): Promise<{ latency: number; clientName?: string }> {
  const base = getApiUrl();
  const url = `${base}/health`;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) throw new ApiError(resp.status, `HTTP ${resp.status}`);
    const data = await resp.json() as { status: string; client_name?: string };
    const latency = Date.now() - start;
    console.log('[Scholar Companion] Connection OK:', data.status, '- latency:', latency, 'ms');
    return { latency, clientName: data.client_name };
  } catch (err) {
    clearTimeout(timer);
    console.error('[Scholar Companion] Connection check failed:', err);
    throw err;
  }
}

export interface LoginResult {
  success: boolean;
  client_id: string;
  user_id?: string;
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
  setUserId(data.user_id || '');
  setDisplayName(data.display_name || '');
  return data;
}

export function disconnect(): void {
  setApiToken('');
  setClientId('');
  setUserId('');
  setDisplayName('');
  // Clear all API caches on disconnect
  import('./chat').then(m => m.clearAllChatCaches());
}

/**
 * Confirm the stored token can reach a tenanted endpoint. Use after login to
 * distinguish "gateway OK" from "user not provisioned on mcp-scholar yet".
 * Returns null if provisioned, or an actionable message for the user.
 */
export async function verifyProvisioned(): Promise<string | null> {
  const base = getApiUrl();
  const url = `${base}/api/plugin/health/library`;
  try {
    const resp = await fetch(url, { headers: getAuthHeaders() });
    if (resp.ok) return null;
    if (resp.status === 401) return 'Session expired or not authorised. Please reconnect.';
    if (resp.status === 403) return 'Account not provisioned. Finish setup in the DS-MOZ portal, then reconnect.';
    return `Server returned HTTP ${resp.status}. Try again shortly.`;
  } catch (err: any) {
    return `Cannot reach server: ${err?.message || err}`;
  }
}
