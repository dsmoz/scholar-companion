// tests/globals.d.ts
// Ambient type declaration for the Zotero global injected by the test mock
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
