#!/usr/bin/env node
/**
 * Release script for Scholar Companion
 *
 * Usage:
 *   npm run release          — bump patch (0.1.0 → 0.1.1)
 *   npm run release minor    — bump minor (0.1.0 → 0.2.0)
 *   npm run release major    — bump major (0.1.0 → 1.0.0)
 *   npm run release 1.2.3    — set explicit version
 *
 * What it does:
 *   1. Bump version in package.json + manifest.json
 *   2. Run npm run build
 *   3. Update update.json with new version + release URL
 *   4. Commit all changes
 *   5. Create git tag vX.Y.Z
 *   6. Push commit + tag to origin
 *   7. Create GitHub release and upload the XPI
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJSON(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJSON(file, obj) {
  writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  throw new Error(`Unknown bump type: ${bump}. Use patch, minor, major, or X.Y.Z`);
}

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

// ── 1. Determine new version ──────────────────────────────────────────────────
const bumpArg = process.argv[2] || 'patch';
const pkg = readJSON(join(root, 'package.json'));
const manifest = readJSON(join(root, 'addon/manifest.json'));

const oldVersion = pkg.version;
const newVersion = bumpVersion(oldVersion, bumpArg);
const tag = `v${newVersion}`;
const repo = 'dsmoz/scholar-companion';
const xpiPath = join(root, 'build/scholar-companion.xpi');
const releaseUrl = `https://github.com/${repo}/releases/download/${tag}/scholar-companion.xpi`;

console.log(`\nReleasing ${oldVersion} → ${newVersion}\n`);

// ── 2. Bump versions in package.json + manifest.json ─────────────────────────
console.log('Bumping versions...');
pkg.version = newVersion;
manifest.version = newVersion;
writeJSON(join(root, 'package.json'), pkg);
writeJSON(join(root, 'addon/manifest.json'), manifest);

// ── 3. Build ──────────────────────────────────────────────────────────────────
console.log('\nBuilding XPI...');
run('npm run build');

// ── 4. Update update.json ─────────────────────────────────────────────────────
console.log('\nUpdating update.json...');
const updateJson = {
  addons: {
    'scholar-companion@dsmoz': {
      updates: [
        {
          version: newVersion,
          update_link: releaseUrl,
        },
      ],
    },
  },
};
writeJSON(join(root, 'update.json'), updateJson);

// ── 5. Commit ─────────────────────────────────────────────────────────────────
console.log('\nCommitting...');
run('git add package.json addon/manifest.json update.json');
run(`git commit -m "chore: release ${tag}"`);

// ── 6. Tag + push ─────────────────────────────────────────────────────────────
console.log('\nTagging and pushing...');
run(`git tag ${tag}`);
run('git push origin main');
run(`git push origin ${tag}`);

// ── 7. Create GitHub release and upload XPI ───────────────────────────────────
console.log('\nCreating GitHub release...');
run(`gh release create ${tag} "${xpiPath}#scholar-companion.xpi" --repo ${repo} --title "Scholar Companion ${tag}" --notes "Release ${tag}" --latest`);

console.log(`\n✓ Released ${tag}`);
console.log(`  XPI: ${releaseUrl}`);
console.log(`  update.json: https://raw.githubusercontent.com/${repo}/main/update.json`);
console.log('\nZotero will pick up the update on next check (or Tools → Add-ons → gear → Check for Updates).');
