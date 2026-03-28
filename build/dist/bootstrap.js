/* Zotero 7 bootstrap shim — auto-generated, based on zotero-plugin-template */
var chromeHandle;
var ctx;

function install(data, reason) {}
function uninstall(data, reason) {}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "zotero-ai-companion", rootURI + "content/"],
  ]);

  await Zotero.initializationPromise;

  ctx = {
    rootURI,
    document: Zotero.getMainWindow().document,
  };
  ctx._globalThis = ctx;
  Services.scriptloader.loadSubScript(rootURI + "content/bootstrap.js", ctx);
  await ctx.startup({ id, version, resourceURI, rootURI }, reason);
}

async function onMainWindowLoad({ window }, reason) {
  if (ctx && typeof ctx.onMainWindowLoad === "function") {
    await ctx.onMainWindowLoad({ window }, reason);
  }
}

async function onMainWindowUnload({ window }, reason) {
  if (ctx && typeof ctx.onMainWindowUnload === "function") {
    await ctx.onMainWindowUnload({ window }, reason);
  }
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  if (ctx && typeof ctx.shutdown === "function") {
    await ctx.shutdown({ id, version, resourceURI, rootURI }, reason);
  }
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}
