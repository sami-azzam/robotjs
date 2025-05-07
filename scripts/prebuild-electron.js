#!/usr/bin/env node
/**
 * Produce Electron prebuilds for all platforms.
 * - Works on Windows (npx.cmd) and *nix (npx)
 * - Fails loudly if no prebuilds are generated
 */
const { readFileSync, existsSync, readdirSync } = require('fs');
const { join, resolve }                         = require('path');
const { spawnSync }                             = require('child_process');

const root        = resolve(__dirname, '..');
const targetFile  = resolve(root, '.electron-target');
const prebuildDir = resolve(root, 'prebuilds');

if (!existsSync(targetFile)) {
  console.error('❌  .electron-target not found. Put the Electron version in it.');
  process.exit(1);
}

const version = readFileSync(targetFile, 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌  "${version}" is not a valid semver Electron version`);
  process.exit(1);
}

// Pick the right npx binary for the host OS
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const { status, error, output } = spawnSync(
  NPX,
  [
    '--no-install',          // don’t hit the network – prebuildify is already dep
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
  if (error) {
    console.error('❌  Error:');
    console.error(error);
  } else if (output && output.length) {
    console.error('❌  Output:');
    console.error(output.join('\n'));
  }
  process.exit(status);
}

// Ensure we actually produced a prebuild for *this* platform/arch
const platArch = `${process.platform}-${process.arch}`;
const dir      = join(prebuildDir, platArch);

try {
  const files = readdirSync(dir);
  if (!files.length) throw new Error();
  console.log(`✅  Created ${files.length} prebuild file(s) in ${dir}`);
} catch {
  console.error(`❌  No prebuilds were generated in ${dir}`);
  process.exit(1);
}
