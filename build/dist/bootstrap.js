/* Zotero 7 bootstrap shim — auto-generated */
var chromeHandle;
var _plugin;

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

  var ctx = { rootURI };
  ctx._globalThis = ctx;
  Services.scriptloader.loadSubScript(rootURI + "content/bootstrap.js", ctx);
  _plugin = ctx._aiCompanionPlugin || {};
  if (typeof _plugin.startup === "function") {
    await _plugin.startup({ id, version, resourceURI, rootURI }, reason);
  }
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  if (typeof _plugin?.shutdown === "function") {
    await _plugin.shutdown({ id, version, resourceURI, rootURI }, reason);
  }
  _plugin = undefined;
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}
