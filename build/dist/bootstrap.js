/* Zotero 7 bootstrap shim — auto-generated, do not edit */
const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

let plugin;

function install(data, reason) {}

function uninstall(data, reason) {}

async function startup(data, reason) {
  Services.scriptloader.loadSubScript(data.resourceURI.spec + 'content/bootstrap.js', {});
  // The IIFE assigns itself to _aiCompanionPlugin on the sandbox global
  plugin = globalThis._aiCompanionPlugin || {};
  if (typeof plugin.startup === 'function') {
    await plugin.startup(data, reason);
  }
}

async function shutdown(data, reason) {
  if (typeof plugin?.shutdown === 'function') {
    await plugin.shutdown(data, reason);
  }
  plugin = undefined;
}
