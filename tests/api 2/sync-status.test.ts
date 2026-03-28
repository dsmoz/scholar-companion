// tests/api/sync-status.test.ts
import { fetchSyncStatus, updateItemMetadata } from '../../src/api/sync-status';

global.fetch = jest.fn();

describe('sync-status API', () => {
  it('fetchSyncStatus returns items', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ zotero_key: 'ABC12345', sync_status: 'synced', title: 'Test' }], total: 1 }),
    });
    const result = await fetchSyncStatus();
    expect(result.total).toBe(1);
    expect(result.items[0].sync_status).toBe('synced');
  });

  it('updateItemMetadata calls POST endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ queued: true }),
    });
    const result = await updateItemMetadata('ABC12345');
    expect(result.queued).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/ABC12345/metadata'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
