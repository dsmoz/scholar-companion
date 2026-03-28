// tests/globals.d.ts
// Ambient type declarations for globals injected in the Jest test environment
declare const global: typeof globalThis & Record<string, unknown>;

declare const Zotero: {
  Prefs: {
    get: (...args: unknown[]) => unknown;
    set: (...args: unknown[]) => void;
  };
  Notifier: {
    registerObserver: (...args: unknown[]) => unknown;
    unregisterObserver: (...args: unknown[]) => void;
  };
  Items: {
    get: (...args: unknown[]) => unknown;
  };
  URI: {
    getItemURI: (...args: unknown[]) => unknown;
  };
};
