#!/usr/bin/env node
/*  scripts/prebuild-electron.js
    -----------------------------------------
    Create Node-API prebuilds for the Electron
    versions listed in the “.electron-target”
    file at the project root.

    – 2025-05 cross-platform edition –
       (fixes Windows EINVAL spawn issue)
*/
"use strict";

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

// ─────────────────────────────────────────────
// 1) locate Electron versions we should build
// ─────────────────────────────────────────────
const targetsFile = resolve(__dirname, "..", ".electron-target");
let versions;
try {
  versions = readFileSync(targetsFile, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean); // ignore blank lines
} catch (err) {
  console.error(`❌  Cannot read ${targetsFile}:`, err.message);
  process.exit(1);
}

if (versions.length === 0) {
  console.error("❌  No Electron versions specified in .electron-target");
  process.exit(1);
}

// helper – get absolute path to the prebuildify CLI JS file
function prebuildifyBin() {
  //   node_modules/prebuildify/bin.js
  return resolve(require.resolve("prebuildify"), "../../bin.js");
}

// helper – robustly locate the CLI entry-point inside prebuildify ----------------
function prebuildifyBin() {
  // 1) load its package.json
  const pkg = require("prebuildify/package.json");
  // 2) pkg.bin is usually "./bin.js"
  return resolve(require.resolve("prebuildify"), "..", pkg.bin.prebuildify);
}

// ─────────────────────────────────────────────
// 2) build each Electron target
// ─────────────────────────────────────────────
const commonArgs = [
  "--napi", // Node-API build (works across ABIs)
  "--strip", // smaller binaries
];

for (const version of versions) {
  console.log(`\n▶ Prebuilding for Electron ${version} …`);

  /*  On *all* platforms we spawn:     node  <prebuildify.js>  -r electron -t electron@<v> …
      This avoids the npx.cmd wrapper (which triggers EINVAL on Windows
      after Node 20.12.2 security hardening).                              */
  const { status, error } = spawnSync(
    process.execPath, // current node.exe / node
    [
      prebuildifyBin(),
      "-r",
      "electron",
      "-t",
      `electron@${version}`,
      ...commonArgs,
    ],
    { stdio: "inherit" } // stream output live
  );

  if (status !== 0) {
    console.error("❌  prebuildify failed", error ?? "");
    process.exit(status ?? 1); // abort the entire job
  }
}

// ─────────────────────────────────────────────
// 3) success summary
// ─────────────────────────────────────────────
console.log("\n✅  All Electron prebuilds generated → ./prebuilds/");
