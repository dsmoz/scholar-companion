// tests/api/apiCache.test.ts
import { TTLCache } from '../../src/api/apiCache';

describe('TTLCache', () => {
  it('returns null for missing key', () => {
    const cache = new TTLCache<string, string>(() => 1000);
    expect(cache.get('x')).toBeNull();
  });

  it('returns stored value within TTL', () => {
    const cache = new TTLCache<string, number>(() => 5000);
    cache.set('a', 42);
    expect(cache.get('a')).toBe(42);
  });

  it('returns null after TTL expires', () => {
    jest.useFakeTimers();
    const cache = new TTLCache<string, number>(() => 1000);
    cache.set('a', 99);
    jest.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeNull();
    jest.useRealTimers();
  });

  it('clear() removes all entries', () => {
    const cache = new TTLCache<string, string>(() => 5000);
    cache.set('a', 'hello');
    cache.set('b', 'world');
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('reads TTL from getter on each set()', () => {
    jest.useFakeTimers();
    let ttl = 1000;
    const cache = new TTLCache<string, number>(() => ttl);
    cache.set('a', 1);
    ttl = 5000;
    cache.set('b', 2);
    jest.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe(2);
    jest.useRealTimers();
  });
});
