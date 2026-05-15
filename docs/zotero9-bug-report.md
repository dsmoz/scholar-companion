# Bug Report: Scholar Companion inactive on Zotero 9.0.3

**Date:** 2026-05-15
**Plugin:** scholar-companion@dsmoz v0.2.6
**Zotero:** 9.0.3 (Firefox 140.10.0esr)
**Status:** `active=false`, `userDisabled=false`, `appDisabled=false`

---

## Symptoms

The plugin installs successfully but remains **inactive** with no visible error. The Zotero extensions database (`extensions.json`) reports:

```
active: false
userDisabled: false
appDisabled: false
hasErrors: (not present)
loader: null
```

All other bootstrapped plugins (Knowledge4Zotero, Better BibTeX, ZoteroTag, Scite) load correctly on the same Zotero version.

---

## Root Cause

**Order of operations in the bootstrap shim (`scripts/build.mjs`, lines 73–94).**

The `startup()` function accesses `Components.classes` and `Services.io` **before** awaiting `Zotero.initializationPromise`:

```javascript
async function startup({ id, version, resourceURI, rootURI }, reason) {
  // ❌ Components accessed BEFORE initializationPromise resolves
  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "scholar-companion", rootURI + "content/"],
    ["locale", "scholar-companion", "en-US", rootURI + "locale/en-US/"],
  ]);

  await Zotero.initializationPromise;   // ← too late
  ...
```

In Zotero 9 (Firefox 140 ESR), the `Components` XPCOM object is **not yet available** in the bootstrap scope at the time `startup()` begins executing. Accessing it before `Zotero.initializationPromise` resolves throws a silent exception, causing Zotero to mark the addon as inactive.

## Evidence — Working Plugins

Knowledge4Zotero (v3.0.5, active on Zotero 9) awaits the promise **first**:

```javascript
async function startup({ id, version, resourceURI, rootURI }, reason) {
  await Zotero.initializationPromise;   // ✅ first thing

  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  ...
```

This follows the [official Zotero 7 developer guide](https://www.zotero.org/support/dev/zotero_7_for_developers) and the Make It Red reference plugin.

---

## Fix

In `scripts/build.mjs` (line ~83), move `await Zotero.initializationPromise;` to **immediately after the opening brace of the `startup` function** (before any `Components` or `Services` access). The corrected bootstrap shim should read:

```diff
 async function startup({ id, version, resourceURI, rootURI }, reason) {
+  await Zotero.initializationPromise;
   var aomStartup = Components.classes[
     "@mozilla.org/addons/addon-manager-startup;1"
   ].getService(Components.interfaces.amIAddonManagerStartup);
   var manifestURI = Services.io.newURI(rootURI + "manifest.json");
   chromeHandle = aomStartup.registerChrome(manifestURI, [
     ["content", "scholar-companion", rootURI + "content/"],
     ["locale", "scholar-companion", "en-US", rootURI + "locale/en-US/"],
   ]);

-  await Zotero.initializationPromise;
   ...
```

---

## Verification

After applying the fix:

1. Run `npm run build` to rebuild the XPI
2. Restart Zotero
3. Confirm the plugin shows as **active** in about:addons
4. Confirm the Tools → Scholar Companion menu appears
5. Confirm the item pane section renders when selecting a library item

---

## Related Files

| File | Purpose |
|---|---|
| `scripts/build.mjs` | Build script that generates the bootstrap shim (line 66–119) |
| `addon/manifest.json` | Plugin manifest (strict_max_version already set to 9.*) |
| `src/bootstrap.ts` | Plugin bootstrap logic (loaded via loadSubScript) |
