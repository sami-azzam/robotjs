#!/usr/bin/env node
/**
 * Generate Electron prebuilds for the current OS / arch.
 * Works on Windows-2019 runners (Git-Bash), macOS and Linux.
 */

const { readFileSync, existsSync, readdirSync } = require('fs');
const { resolve, join }                         = require('path');
const { spawnSync }                             = require('child_process');

const root        = resolve(__dirname, '..');
const targetFile  = resolve(root, '.electron-target');
const prebuildDir = resolve(root, 'prebuilds');

if (!existsSync(targetFile)) {
  console.error('❌  .electron-target not found.');
  process.exit(1);
}

const version = readFileSync(targetFile, 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌  "${version}" is not a valid semver Electron version`);
  process.exit(1);
}

/* ---------- locate the real npx entry-point ------------------- */
const npmPrefix  = resolve(process.execPath, '..', '..');           // e.g. C:\hostedtoolcache\windows\node\20.19.1\x64
const npxCliPath = resolve(npmPrefix, 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js');

/* ---------- run prebuildify ----------------------------------- */
const { status, error, stderr } = spawnSync(
  process.execPath,                 // the current Node binary
  [
    npxCliPath,                     // JS entry point of npx
    '--no-install',
    'prebuildify',
    '-r', 'electron',
    '-t', `electron@${version}`,
    '--napi',
    '--strip'
  ],
  { stdio: 'inherit' }
);

if (status !== 0) {
  console.error('❌  prebuildify failed');
  if (error) console.error(error);
  if (stderr) console.error(stderr.toString());
  process.exit(status);
}

/* ---------- sanity-check output ------------------------------- */
const platArch = `${process.platform}-${process.arch}`;
const dir      = join(prebuildDir, platArch);

try {
  const files = readdirSync(dir);
  if (!files.length) throw new Error();
  console.log(`✅  ${files.length} prebuild file(s) in ${dir}`);
} catch {
  console.error(`❌  No prebuilds were generated in ${dir}`);
  process.exit(1);
}
