// src/globals.d.ts
// Ambient declarations for Zotero globals available at runtime inside Zotero's XUL process.
// The actual shape is much wider; we only declare what the plugin code touches directly.
// Methods accessed via `(Zotero as any)` do not need to be declared here.

declare const Zotero: {
  Prefs: {
    get: (...args: unknown[]) => unknown;
    set: (...args: unknown[]) => void;
  };
  Notifier: {
    registerObserver: (...args: unknown[]) => string;
    unregisterObserver: (id: string) => void;
  };
  Items: {
    get: (id: number) => { isRegularItem: () => boolean } | undefined;
    trashTx: (ids: number[]) => Promise<void>;
  };
  URI: {
    getItemURI: (...args: unknown[]) => unknown;
  };
};
