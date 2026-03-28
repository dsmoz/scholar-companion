// tests/prefs.test.ts
import { getApiUrl, setApiUrl, getSyncInterval, getTheme } from '../src/prefs';

describe('prefs', () => {
  beforeEach(() => {
    (Zotero.Prefs.get as jest.Mock).mockImplementation((key: string) => {
      const defaults: Record<string, unknown> = {
        'extensions.zotero-ai.apiUrl': 'http://localhost:6500',
        'extensions.zotero-ai.syncInterval': 12,
        'extensions.zotero-ai.theme': 'auto',
      };
      return defaults[key];
    });
  });

  it('returns default API URL', () => {
    expect(getApiUrl()).toBe('http://localhost:6500');
  });

  it('returns default sync interval', () => {
    expect(getSyncInterval()).toBe(12);
  });

  it('returns default theme', () => {
    expect(getTheme()).toBe('auto');
  });

  it('sets API URL', () => {
    setApiUrl('http://localhost:7000');
    expect(Zotero.Prefs.set).toHaveBeenCalledWith('extensions.zotero-ai.apiUrl', 'http://localhost:7000');
  });
});
