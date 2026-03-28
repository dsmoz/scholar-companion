import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, rmSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'build/dist');

// Clean and recreate dist staging directory
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'content/graph'), { recursive: true });
mkdirSync(join(dist, 'content/icons'), { recursive: true });

// 1. Bundle TypeScript → content/bootstrap.js as CommonJS
// CJS format means startup/shutdown become exports.startup / exports.shutdown,
// which the bootstrap shim reads via the sandbox's `exports` object.
await build({
  entryPoints: [join(root, 'src/bootstrap.ts')],
  bundle: true,
  outfile: join(dist, 'content/bootstrap.js'),
  format: 'iife',
  target: 'firefox102',
  external: ['zotero', 'components/'],
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  jsxImportSource: 'react',
  minify: true,
});

// 2. Copy static assets
copyFileSync(join(root, 'src/graph/network.html'), join(dist, 'content/graph/network.html'));
copyFileSync(join(root, 'addon/manifest.json'), join(dist, 'manifest.json'));
copyFileSync(join(root, 'addon/content/icons/favicon.png'), join(dist, 'content/icons/favicon.png'));

// 3. Write Zotero 7 bootstrap shim using the official registerChrome pattern.
// loadSubScript runs the CJS bundle in `ctx`; the bundle writes to ctx.exports,
// so startup/shutdown are available as ctx.exports.startup etc.
writeFileSync(join(dist, 'bootstrap.js'), `/* Zotero 7 bootstrap shim — auto-generated, based on zotero-plugin-template */
var chromeHandle;

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
  await ctx.startup({ id, version, resourceURI, rootURI }, reason);
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;
  await _globalThis.shutdown({ id, version, resourceURI, rootURI }, reason);
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}
`);

// 4. Package into .xpi (zip)
const xpiPath = join(root, 'build/zotero-ai-companion.xpi');
const output = createWriteStream(xpiPath);
const archive = archiver('zip', { zlib: { level: 9 } });

await new Promise((resolve, reject) => {
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(dist, false);
  archive.finalize();
});

console.log(`XPI built: build/zotero-ai-companion.xpi (${(archive.pointer() / 1024).toFixed(1)} KB)`);
