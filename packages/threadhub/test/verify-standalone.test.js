// verify-standalone.test.js — the standalone checker IS the product:
// a single file a stranger can save from GET /verify.mjs and run on a
// clean machine, with nothing but Node, to re-verify a thread without
// trusting the hub that produced it. These tests hold the three claims
// that make that true:
//   1. it verifies real exports (both the bare-envelope shape the live
//      GET /t/:slug.json emits and the full shape with record_hash +
//      signature), and fails LOUDLY — nonzero exit, naming the seq and
//      the check — on tamper, broken prev, or a bad signature;
//   2. it imports nothing but node: builtins (grep-asserted below);
//   3. the hub serves its exact bytes at GET /verify.mjs.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { Hub } = require('../src/hub');
const { createServer } = require('../src/server');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'verify-standalone.mjs');
const tmpDb = () => `/tmp/hub-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

function run(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}

// A real chain, exported in the FULL shape: envelope + record_hash +
// signature sidecar fields, straight from the store rows.
function seededExport() {
  const hub = new Hub(tmpDb());
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const t = hub.createThread({ title: 'Checker fixture', authorId: troy.id, slug: 'checker' });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { n: 1 } });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { n: 2 } });
  const full = hub.store.recordsOf(t.id)
    .map((r) => ({ ...JSON.parse(r.body), record_hash: r.record_hash, signature: r.signature }));
  const bare = hub.exportThread(t.id); // the live GET /t/:slug.json shape
  const head = hub.verifyThread(t.id).head;
  return { hub, full, bare, head };
}

function writeJSON(records) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-standalone-')), 'thread.json');
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return file;
}

test('checker: PASS on a valid full export (record_hash + signature), naming records and head', () => {
  const { full, head } = seededExport();
  const { code, out } = run(writeJSON(full));
  assert.strictEqual(code, 0);
  assert.match(out, /^PASS/);
  assert.match(out, /3 records/);
  assert.ok(out.includes(head), 'summary names the head hash');
  assert.match(out, /3\/3/, 'all 3 signatures verified');
});

test('checker: PASS on the live bare-envelope export shape, disclosing zero signatures', () => {
  const { bare, head } = seededExport();
  const { code, out } = run(writeJSON(bare));
  assert.strictEqual(code, 0);
  assert.match(out, /^PASS/);
  assert.ok(out.includes(head));
  assert.match(out, /0\/3/, 'discloses that no record carried a signature');
  assert.match(out, /hash chain only/i);
});

test('checker: tampered payload fails loudly, naming the seq and the check', () => {
  const { full } = seededExport();
  full[1].payload.n = 999; // body altered after signing
  const { code, err } = run(writeJSON(full));
  assert.strictEqual(code, 1);
  assert.match(err, /seq 1/);
  assert.match(err, /hash mismatch/i);
});

test('checker: tampered payload on a BARE export still fails via the chain (next prev breaks)', () => {
  const { bare } = seededExport();
  bare[1].payload.n = 999; // no record_hash to compare — seq 2's prev betrays it
  const { code, err } = run(writeJSON(bare));
  assert.strictEqual(code, 1);
  assert.match(err, /seq 2/);
  assert.match(err, /broken chain/i);
});

test('checker limitation (disclosed in header): tampered LAST record of a bare export passes — only the printed head betrays it', () => {
  const { bare, head } = seededExport();
  bare[2].payload.n = 999; // last record: no next prev, no signature — held by the head alone
  const { code, out } = run(writeJSON(bare));
  assert.strictEqual(code, 0);
  assert.match(out, /^PASS/);
  assert.ok(!out.includes(head), 'printed head must differ from the independently held head — the comparison the header demands');
});

test('checker: broken prev link fails loudly, naming the seq', () => {
  const { full } = seededExport();
  full[2].prev = 'sha256:' + 'ab'.repeat(32);
  const { code, err } = run(writeJSON(full));
  assert.strictEqual(code, 1);
  assert.match(err, /seq 2/);
  assert.match(err, /broken chain|prev/i);
});

test('checker: bad signature fails loudly, naming the seq', () => {
  const { full } = seededExport();
  full[1].signature = '00'.repeat(64);
  const { code, err } = run(writeJSON(full));
  assert.strictEqual(code, 1);
  assert.match(err, /seq 1/);
  assert.match(err, /invalid signature/i);
});

test('checker: sequence gap fails loudly', () => {
  const { full } = seededExport();
  const gapped = [full[0], full[2]]; // seq 1 missing
  const { code, err } = run(writeJSON(gapped));
  assert.strictEqual(code, 1);
  assert.match(err, /sequence/i);
});

test('checker: usage error on missing argument', () => {
  const { code, err } = run();
  assert.strictEqual(code, 1);
  assert.match(err, /usage/i);
});

test('checker: imports NOTHING — zero imports, full stop (the browser runs these exact bytes)', () => {
  // Stricter than the old node:-builtins allowance: the single-source rule
  // (DR-2026-07-13 rule 4) makes this file the in-browser verifier via a
  // direct import of /verify.mjs, so it may depend on nothing an environment
  // could resolve differently. import.meta is syntax, not an import.
  const src = fs.readFileSync(SCRIPT, 'utf8');
  assert.ok(!/require\s*\(/.test(src), 'no require() at all');
  assert.ok(!/^\s*import[\s"'(]/m.test(src), 'no static import declarations');
  assert.ok(!/\bimport\s*\(/.test(src), 'no dynamic import()');
});

test('checker: verifyExport returns the structured result the viewer renders', async () => {
  // The same environment-agnostic path a browser page takes: import the
  // module (no CLI side effects), hand it the records, read the structure.
  const { full, bare, head } = seededExport();
  const { verifyExport } = await import(pathToFileURL(SCRIPT).href);

  const ok = await verifyExport(full);
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.records, 3);
  assert.strictEqual(ok.head, head);
  assert.strictEqual(ok.signaturesVerified, 3);
  assert.strictEqual(ok.signatureVerificationAvailable, true);
  assert.strictEqual(ok.failure, null);
  assert.match(ok.line, /^PASS: 3 records/);
  assert.ok(ok.line.includes(head));

  const bareOk = await verifyExport(bare);
  assert.strictEqual(bareOk.ok, true);
  assert.strictEqual(bareOk.signaturesVerified, 0);
  assert.match(bareOk.line, /0\/3/);
  assert.match(bareOk.line, /hash chain only/i);

  full[1].payload.n = 999;
  const bad = await verifyExport(full);
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.failure.seq, 1);
  assert.match(bad.line, /^FAIL at seq 1: hash mismatch/i);

  const empty = await verifyExport([]);
  assert.strictEqual(empty.ok, false);
  assert.match(empty.line, /^FAIL: input is not a non-empty array/);
});

test('checker: importing the module runs NO CLI side effects (guarded entry)', async () => {
  // Importing from a page (or a test) must not read argv, print, or exit.
  const before = process.exitCode;
  await import(pathToFileURL(SCRIPT).href);
  assert.strictEqual(process.exitCode, before);
});

test('checker header discloses: served by the hub it checks; save and run elsewhere; structure not truth', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  assert.match(src, /convenience/i);
  assert.match(src, /save/i);
  assert.match(src, /not .*(true|truth)|never proves/i);
});

test('GET /verify.mjs serves the exact checker bytes; the viewer imports exactly that URL', async () => {
  const { server, hub } = createServer(tmpDb());
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  hub.createThread({ title: 'Identity', authorId: troy.id, slug: 'identity' });
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
  try {
    const res = await fetch(`http://localhost:${port}/verify.mjs`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /^text\/javascript/);
    assert.strictEqual(await res.text(), fs.readFileSync(SCRIPT, 'utf8'));
    // Build-level implementation identity (DR-2026-07-13 rule 4): the viewer
    // page runs verification only via a module import of exactly /verify.mjs —
    // the URL whose bytes were just proven identical to the repo file. Any
    // other script URL on the page would be a second source of truth.
    const page = await (await fetch(`http://localhost:${port}/t/identity/view`)).text();
    assert.ok(page.includes("import('/verify.mjs')"), 'viewer must import the literal /verify.mjs');
    const scriptRefs = [...page.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)|src=["']([^"']+\.m?js)["']/g)]
      .map((m) => m[1] ?? m[2]);
    assert.deepStrictEqual([...new Set(scriptRefs)], ['/verify.mjs'],
      `the viewer references script URLs other than /verify.mjs: ${scriptRefs.join(', ')}`);
  } finally { server.close(); }
});

test('end to end: checker saved from the route verifies the hub own export over HTTP', async () => {
  const { server, hub } = createServer(tmpDb());
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const t = hub.createThread({ title: 'Live', authorId: troy.id, slug: 'live' });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { hello: 'world' } });
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
  try {
    // "save this file and run it elsewhere" — the exact loop a stranger runs.
    // (async spawn: the server lives in THIS process, so its event loop must
    // stay free to answer the child checker's HTTP request)
    const saved = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-standalone-')), 'verify.mjs');
    fs.writeFileSync(saved, await (await fetch(`http://localhost:${port}/verify.mjs`)).text());
    const r = await new Promise((resolve) => {
      const child = spawn(process.execPath, [saved, `http://localhost:${port}/t/live.json`]);
      let stdout = '', stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('close', (status) => resolve({ status, stdout, stderr }));
    });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /^PASS/);
    assert.match(r.stdout, /2 records/);
    assert.ok(r.stdout.includes(hub.verifyThread(t.id).head));
  } finally { server.close(); }
});
