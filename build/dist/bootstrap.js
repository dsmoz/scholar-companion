/* Zotero 7 bootstrap shim — auto-generated */
var chromeHandle;
var _startup, _shutdown;

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

  var ctx = { rootURI, exports: {} };
  ctx.module = { exports: ctx.exports };
  Services.scriptloader.loadSubScript(rootURI + "content/bootstrap.js", ctx);
  _startup = ctx.exports.startup || ctx.module.exports.startup;
  _shutdown = ctx.exports.shutdown || ctx.module.exports.shutdown;
  if (typeof _startup === "function") {
    await _startup({ id, version, resourceURI, rootURI }, reason);
  }
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  if (typeof _shutdown === "function") {
    await _shutdown({ id, version, resourceURI, rootURI }, reason);
  }
  _startup = _shutdown = undefined;
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}
