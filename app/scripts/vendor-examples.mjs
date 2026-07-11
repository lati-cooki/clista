#!/usr/bin/env node
// Vendor the published example decision logs from lati-club/ClisTa-Protocol into
// worker/examples/. This is the SECOND vendoring track, alongside vendor-engine:
//
//   - vendor-engine  : the trust anchor (engine code). Strict, human-reviewed.
//   - vendor-examples: example DATA. Self-verifying (hash chains) and already
//                      reviewed upstream, so this track re-verifies with the
//                      engine and gates on that, not on a trust-anchor review.
//
// The source of truth is ClisTa-Protocol's examples/manifest.json. Adding an
// example to the cockpit is adding a manifest entry upstream — never editing the
// cockpit. For each PUBLISHED entry this script:
//   1. reads every declared thread file,
//   2. re-verifies with the SAME engine the app ships — `validate` per thread
//      (replay) and, for cross-thread examples, verifyCrossThreadProvenance —
//      and refuses to generate anything if an example fails,
//   3. writes worker/examples/<id>.js (events embedded) + worker/examples/index.js.
//
// Usage:
//   node scripts/vendor-examples.mjs [--from <ClisTa-Protocol dir>] [--check]
//     --from   path to a ClisTa-Protocol checkout (default: $CLISTA_PROTOCOL_DIR
//              or ../ClisTa-Protocol). CI clones it at a release tag.
//     --check  report drift, change nothing, exit 1 if anything would change.
//
// Exit codes: 0 clean/applied · 1 drift (in --check) · 2 an example failed
// verification (manifest or data is broken upstream) · 3 usage/IO error.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(repoRoot, "worker", "examples");

const args = process.argv.slice(2);
const argVal = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const CHECK = args.includes("--check");
// Absolute: createRequire (used to load the checkout's engine) rejects relative paths.
const protocolDir = resolve(argVal("--from", process.env.CLISTA_PROTOCOL_DIR || join(repoRoot, "..", "ClisTa-Protocol")));

const fail = (code, msg) => {
  console.error(`\n✘ ${msg}`);
  process.exit(code);
};

const manifestPath = join(protocolDir, "examples", "manifest.json");
if (!existsSync(manifestPath)) {
  fail(3, `No examples/manifest.json at ${protocolDir}\n  Clone lati-club/ClisTa-Protocol there, or pass --from <dir> / set CLISTA_PROTOCOL_DIR.`);
}

// Verify with the protocol's own engine (the same modules the app vendors), so
// the cockpit gates on identical logic. CommonJS, loaded from the checkout.
const reqFrom = createRequire(join(protocolDir, "package.json"));
const { readEventsAt } = reqFrom("./src/events.js");
const { validateEvents } = reqFrom("./src/validator.js");
const { verifyCrossThreadProvenance } = reqFrom("./src/provenance.js");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== "clista.examples.manifest.v0") {
  fail(2, `Unsupported manifest version ${manifest.version}`);
}
const published = (manifest.examples || []).filter((e) => e.published);
if (published.length === 0) {
  fail(2, "manifest has no published examples");
}

const safeIdent = (id) => "ex_" + id.replace(/[^A-Za-z0-9]+/g, "_");
const built = [];

for (const ex of published) {
  const threads = [];
  for (const t of ex.threads) {
    const file = join(protocolDir, t.file);
    if (!existsSync(file)) fail(2, `example ${ex.id}: missing file ${t.file}`);
    const events = readEventsAt(file);
    if (!events.length) fail(2, `example ${ex.id}: ${t.file} is empty`);
    const result = validateEvents(events);
    if (!result.valid) fail(2, `example ${ex.id}: ${t.file} failed validate: ${JSON.stringify(result.errors)}`);
    if (!events.every((e) => e.thread_id === t.threadId)) {
      fail(2, `example ${ex.id}: ${t.file} contains events outside thread ${t.threadId}`);
    }
    threads.push({ role: t.role, threadId: t.threadId, events });
  }
  if (!threads.some((t) => t.threadId === ex.entryThreadId)) {
    fail(2, `example ${ex.id}: entryThreadId ${ex.entryThreadId} not among declared threads`);
  }
  if (ex.verifyCrossThread) {
    const parent = threads.find((t) => t.role === "parent");
    const arms = threads.filter((t) => t.role === "arm");
    if (!parent || arms.length === 0) fail(2, `example ${ex.id}: verifyCrossThread needs one parent + >=1 arm`);
    const report = verifyCrossThreadProvenance(parent.events, arms.map((a) => a.events));
    if (!report.valid || report.summary.verified < 1) {
      fail(2, `example ${ex.id}: cross-thread provenance failed: ${JSON.stringify(report.summary)}`);
    }
  }
  built.push({
    id: ex.id,
    title: ex.title,
    summary: ex.summary,
    kind: ex.kind,
    domain: ex.domain || null,
    entryThreadId: ex.entryThreadId,
    threads,
  });
}

// Render generated modules deterministically (same manifest+files => same bytes).
function moduleFor(ex) {
  return (
    `// Generated from ClisTa-Protocol examples/manifest.json entry "${ex.id}".\n` +
    `// Do not edit by hand — run \`npm run sync:examples\`.\n` +
    `export const example = ${JSON.stringify(ex, null, 2)};\n`
  );
}
function indexModule(exs) {
  const imports = exs.map((e) => `import { example as ${safeIdent(e.id)} } from "./${e.id}.js";`).join("\n");
  const list = exs.map((e) => `  ${safeIdent(e.id)},`).join("\n");
  return (
    `// Generated by scripts/vendor-examples.mjs — do not edit by hand.\n` +
    `// The cockpit's example-mirror registry, vendored from ClisTa-Protocol.\n` +
    `${imports}\n\nexport const examples = [\n${list}\n];\n`
  );
}

const files = new Map();
for (const ex of built) files.set(`${ex.id}.js`, moduleFor(ex));
files.set("index.js", indexModule(built));

if (CHECK) {
  let drift = false;
  const existing = existsSync(outDir) ? new Set(readdirSync(outDir)) : new Set();
  for (const [name, content] of files) {
    const p = join(outDir, name);
    const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
    if (cur !== content) { console.error(`would update worker/examples/${name}`); drift = true; }
    existing.delete(name);
  }
  for (const stale of existing) { console.error(`would remove worker/examples/${stale}`); drift = true; }
  if (drift) process.exit(1);
  console.log(`worker/examples up to date (${built.length} example(s)).`);
  process.exit(0);
}

// Apply: regenerate the directory from scratch so removed examples don't linger.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const [name, content] of files) writeFileSync(join(outDir, name), content, "utf8");

console.log(`\nVendored ${built.length} example(s) into worker/examples/:`);
for (const ex of built) {
  const total = ex.threads.reduce((n, t) => n + t.events.length, 0);
  console.log(`  ${ex.id}  (${ex.threads.length} thread(s), ${total} events)`);
}
