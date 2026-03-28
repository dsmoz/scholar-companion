import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, rmSync, mkdirSync, copyFileSync, readFileSync } from 'fs';
import { createGzip } from 'zlib';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'build/dist');

// Clean and recreate dist staging directory
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
mkdirSync(join(dist, 'content/graph'), { recursive: true });

// 1. Bundle TypeScript → content/bootstrap.js
await build({
  entryPoints: [join(root, 'src/bootstrap.ts')],
  bundle: true,
  outfile: join(dist, 'content/bootstrap.js'),
  format: 'iife',
  target: 'firefox102',
  external: ['zotero', 'components/'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  jsx: 'automatic',
  jsxImportSource: 'react',
  minify: true,
});

// 2. Copy static assets
copyFileSync(join(root, 'src/graph/network.html'), join(dist, 'content/graph/network.html'));
copyFileSync(join(root, 'addon/manifest.json'), join(dist, 'manifest.json'));

// 3. Write Zotero 7 bootstrap shim
// Zotero calls install/startup/shutdown/uninstall on the bootstrap scope.
// We load our bundled content/bootstrap.js via Services.scriptloader
// and forward the lifecycle calls.
const bootstrapShim = `/* Zotero 7 bootstrap shim — auto-generated, do not edit */
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
`;

import { writeFileSync } from 'fs';
writeFileSync(join(dist, 'bootstrap.js'), bootstrapShim);

// 4. Update esbuild IIFE wrapper so startup/shutdown are reachable from the shim
// The iife wraps everything — we need to expose the exports. Patch the bundle:
const bundle = readFileSync(join(dist, 'content/bootstrap.js'), 'utf8');
const patched = bundle + '\nglobalThis._aiCompanionPlugin={startup,shutdown};';
writeFileSync(join(dist, 'content/bootstrap.js'), patched);

// 5. Package into .xpi (zip)
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

const bytes = archive.pointer();
console.log(`XPI built: build/zotero-ai-companion.xpi (${(bytes / 1024).toFixed(1)} KB)`);
