#!/usr/bin/env node
/**
 * Reads .electron-target → runs prebuildify for that Electron ABI.
 * Works on every shell / CI provider.
 */
const { readFileSync, existsSync } = require('fs');
const { spawnSync }               = require('child_process');
const path                        = require('path');

const targetFile = path.resolve(__dirname, '..', '.electron-target');
if (!existsSync(targetFile)) {
  console.error('❌  .electron-target not found. Put the Electron version in it.');
  process.exit(1);
}

const version = readFileSync(targetFile, 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌  "${version}" is not a valid semver Electron version`);
  process.exit(1);
}

const { status } = spawnSync(
  'npx',
  [
    'prebuildify',
    '-r', 'electron',
    '-t', `electron@${version}`,    // ← guaranteed string
    '--napi',
    '--strip'
  ],
  { stdio: 'inherit' }
);

process.exit(status ?? 0);
