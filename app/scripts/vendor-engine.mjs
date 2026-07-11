#!/usr/bin/env node
// Re-vendor the ClisTa engine from lati-club/ClisTa-Protocol into worker/engine/.
//
// The engine is the app's trust anchor: it is copied (vendored) from the
// protocol repo, NOT consumed as a live dependency, so upstream changes only
// reach production through a reviewed PR + redeploy. This script performs the
// copy deterministically and guards the two hand-adapted Worker ports.
//
// Three classes of file in worker/engine/:
//   - verbatim   : copied byte-for-byte from upstream src/ (the bulk).
//   - adapted    : integrity.js + events.js — Worker ports (js-sha256, Web
//                  Crypto, no fs). NEVER overwritten. Instead we GUARD them:
//                  if upstream changed the file we adapted, the script fails and
//                  asks a human to re-apply the port, then bless it with
//                  --update-baseline.
//   - app-owned  : index.js (public surface) + package.json. Never touched.
// Files intentionally NOT vendored (cli.js, src/cli/, continuity.js,
// mcp_server.js, release.js, runtime.js) are simply absent from worker/engine/,
// and this script never adds new top-level files — it only mirrors the curated
// set already there. EXCEPTION: subdirectories listed in VENDORED_SUBDIRS are
// vendored WHOLESALE (upstream additions are copied in, engine-side orphans
// flagged) — upstream #49 split validator.js into src/validator/<domain>.js
// modules, and the curated top-level rule can't see files that don't exist
// in worker/engine/ yet.
//
// Usage:
//   node scripts/vendor-engine.mjs [--from <ClisTa-Protocol dir>] [--check] [--update-baseline]
//     --from            path to a ClisTa-Protocol checkout (default: $CLISTA_PROTOCOL_DIR
//                       or ../ClisTa-Protocol). CI clones it at a release tag.
//     --check           report drift, change nothing, exit 1 if anything would change.
//     --update-baseline after re-porting integrity.js/events.js by hand, record the
//                       new upstream hashes as the blessed baseline.
//
// Exit codes: 0 clean/applied · 1 drift (in --check) · 2 port drift on an
// adapted file (manual re-port required) · 3 usage/IO error.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const engineDir = join(repoRoot, "worker", "engine");
const baselinePath = join(engineDir, ".upstream-baseline.json");

const args = process.argv.slice(2);
const argVal = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const CHECK = args.includes("--check");
const UPDATE_BASELINE = args.includes("--update-baseline");
const protocolDir =
  argVal("--from", process.env.CLISTA_PROTOCOL_DIR || join(repoRoot, "..", "ClisTa-Protocol"));
const srcDir = join(protocolDir, "src");

const APP_OWNED = new Set(["index.js", "package.json"]);
const ADAPTED = new Set(["integrity.js", "events.js"]);
// Subdirectories of src/ vendored wholesale (see header). Everything upstream
// in these dirs is copied; a new upstream subdir must be added here on purpose.
const VENDORED_SUBDIRS = ["validator"];

const fail = (code, msg) => {
  console.error(`\n✘ ${msg}`);
  process.exit(code);
};
const sha = (buf) => "sha256:" + createHash("sha256").update(buf).digest("hex");

if (!existsSync(srcDir)) {
  fail(
    3,
    `No ClisTa-Protocol checkout at ${protocolDir}\n` +
      `  Clone lati-club/ClisTa-Protocol there, or pass --from <dir> / set CLISTA_PROTOCOL_DIR.`
  );
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, "utf8"))
  : { source: "lati-club/ClisTa-Protocol", ref: null, files: {} };
baseline.files ||= {};

// The vendored set: the .js files already in worker/engine/ that also exist
// upstream and aren't app-owned (the curated exclusion list), PLUS the
// VENDORED_SUBDIRS wholesale — for those, upstream is the source of the file
// list, so a module upstream adds to src/validator/ vendors in automatically.
// All paths below are engine-relative ("validator/shared.js").
const engineJs = readdirSync(engineDir).filter((f) => f.endsWith(".js"));
const listJs = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".js")) : [];
const vendoredFiles = [...engineJs];
for (const sub of VENDORED_SUBDIRS) {
  const names = new Set([...listJs(join(srcDir, sub)), ...listJs(join(engineDir, sub))]);
  for (const f of [...names].sort()) vendoredFiles.push(posix.join(sub, f));
}

const updated = [];      // verbatim files copied/would-copy
const portDrift = [];    // adapted files whose upstream changed
const orphaned = [];     // in engine, gone upstream
const missingDeps = [];  // require('./x') with no x.js in engine

for (const f of vendoredFiles) {
  if (APP_OWNED.has(f)) continue;
  const up = join(srcDir, f);
  if (!existsSync(up)) {
    orphaned.push(f);
    continue;
  }
  const upBuf = readFileSync(up);
  const upHash = sha(upBuf);

  if (ADAPTED.has(f)) {
    // Guard: compare upstream to the blessed baseline. We never overwrite the port.
    const blessed = baseline.files[f];
    if (UPDATE_BASELINE) {
      baseline.files[f] = upHash;
    } else if (blessed && blessed !== upHash) {
      portDrift.push(f);
    } else if (!blessed) {
      baseline.files[f] = upHash; // first run: record current upstream as the baseline
    }
    continue;
  }

  // Verbatim: copy if upstream differs from what we have vendored.
  const cur = existsSync(join(engineDir, f)) ? readFileSync(join(engineDir, f)) : null;
  if (!cur || sha(cur) !== upHash) {
    updated.push(f);
    if (!CHECK) {
      mkdirSync(dirname(join(engineDir, f)), { recursive: true });
      writeFileSync(join(engineDir, f), upBuf);
    }
  }
  baseline.files[f] = upHash;
}

// Dependency check: every relative require in a vendored file must resolve
// inside worker/engine/. Subpath-aware: "./validator/shared" from validator.js
// and "../events" from validator/shared.js both resolve against the requiring
// file's engine-relative directory.
const reqRe = /require\(\s*["'](\.\.?\/[\w/-]+)["']\s*\)/g;
const present = new Set(vendoredFiles.map((f) => f.replace(/\.js$/, "")));
for (const f of vendoredFiles) {
  const abs = join(engineDir, f);
  if (!existsSync(abs)) continue; // --check on a not-yet-copied addition
  const txt = readFileSync(abs, "utf8");
  let m;
  while ((m = reqRe.exec(txt))) {
    const resolved = posix.normalize(posix.join(posix.dirname(f), m[1]));
    if (resolved.startsWith("..")) {
      if (!missingDeps.includes(resolved)) missingDeps.push(`${resolved} escapes worker/engine/ (required by ${f})`);
      continue;
    }
    if (!present.has(resolved) && !missingDeps.some((d) => d.startsWith(`${resolved}.js`))) {
      missingDeps.push(`${resolved}.js (required by ${f})`);
    }
  }
}

// ---- report ----------------------------------------------------------------
const ref = (() => {
  try {
    // Branch checkout → "ref: refs/heads/main"; detached tag/sha → the sha itself.
    return readFileSync(join(protocolDir, ".git", "HEAD"), "utf8").trim().replace(/^ref:\s*/, "");
  } catch {
    return null;
  }
})();
console.log(`ClisTa engine sync · source ${protocolDir}${ref ? ` (${ref})` : ""}`);
console.log(`  verbatim ${CHECK ? "to update" : "updated"}: ${updated.length ? updated.join(", ") : "none"}`);
if (orphaned.length) console.log(`  ⚠ in engine but gone upstream: ${orphaned.join(", ")}`);
if (missingDeps.length) console.log(`  ⚠ unresolved local requires: ${missingDeps.join(", ")}`);

if (portDrift.length) {
  fail(
    2,
    `Upstream changed adapted port(s): ${portDrift.join(", ")}\n` +
      `  These are hand-ported for the Workers runtime (js-sha256 / Web Crypto / no fs).\n` +
      `  Re-apply the port to worker/engine/${portDrift[0]} from src/, run "npm test", then\n` +
      `  bless the new upstream with: node scripts/vendor-engine.mjs --update-baseline`
  );
}
if (missingDeps.length) {
  fail(2, `A vendored module now requires a file that isn't vendored. Add it (and confirm it has no Node builtins), then re-run.`);
}

if (CHECK) {
  if (updated.length) {
    console.error(`\n✘ engine drift: ${updated.length} file(s) differ from upstream. Run the sync.`);
    process.exit(1);
  }
  console.log("\n✓ engine is in sync with upstream.");
  process.exit(0);
}

baseline.ref = ref;
writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
console.log(`\n✓ ${updated.length ? `synced ${updated.length} file(s)` : "already in sync"}. Now run: npm test`);
