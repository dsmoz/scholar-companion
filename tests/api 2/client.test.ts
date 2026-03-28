// tests/api/client.test.ts
import { apiFetch, ApiError } from '../../src/api/client';

global.fetch = jest.fn();

describe('apiFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Zotero prefs to return default API URL
    (globalThis as any).Zotero = {
      Prefs: {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'extensions.zotero-ai.apiUrl') return 'http://localhost:6500';
          return undefined;
        }),
        set: jest.fn(),
      },
    };
  });

  it('returns parsed JSON on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
    const result = await apiFetch('/health');
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws ApiError on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not found' }),
    });
    await expect(apiFetch('/items/BADKEY')).rejects.toThrow(ApiError);
  });

  it('prepends base URL from prefs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await apiFetch('/search?q=test');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:6500/api/plugin/search?q=test'),
      expect.any(Object)
    );
  });
});
