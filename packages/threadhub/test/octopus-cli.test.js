// octopus-cli.test.js — the Node bridge the Octopus Python plugin shells out
// to, exercised end-to-end against an in-process hub (createServer, port 0),
// exactly like octopus.test.js. No mocks: real keygen, real signed POST, real
// chain verification. This is the actual `emit` path the Python glue invokes.
// Run: node --test test/octopus-cli.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { createServer } = require('../src/server');

const CLI = path.join(__dirname, '..', 'adapters', 'octopus-cli.js');
const tmp = (ext) => `/tmp/octo-cli-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

// Run the CLI as a real subprocess (how Python invokes it) and parse its JSON
// line. MUST be async: the hub runs in THIS process, so a synchronous spawn
// would freeze the event loop and the subprocess could never reach the server.
function cli(args, input) {
  return new Promise((resolve, reject) => {
    const child = execFile('node', [CLI, ...args], { encoding: 'utf8' }, (err, stdout) => {
      if (err && !stdout) return reject(err);
      try { resolve(JSON.parse(stdout.trim().split('\n').pop())); } catch (e) { reject(e); }
    });
    if (input !== undefined) { child.stdin.write(input); child.stdin.end(); }
  });
}

test('octopus-cli: keygen → register → emit lands a verifiable, non-custodial pair', async () => {
  const dbPath = tmp('.db');
  const keyPath = tmp('.pem');
  const { server, hub } = createServer(dbPath);
  try {
    const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
    // Thread creation is the operator's (custodial) action — mirrors the doc.
    hub.createThread({ title: 'Octopus build log', authorId: troy.id, slug: 'octo-build' });
    const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
    const hubUrl = `http://localhost:${port}`;

    // 1. keygen — private key written locally, mode 0600, never sent anywhere.
    const k = await cli(['keygen', '--key', keyPath]);
    assert.strictEqual(k.ok, true);
    assert.strictEqual(k.created, true);
    assert.match(k.public_key, /^[0-9a-f]{64}$/);
    assert.strictEqual(fs.statSync(keyPath).mode & 0o777, 0o600, 'private key must be 0600');

    // keygen is idempotent: same key, re-derived, not regenerated.
    const k2 = await cli(['keygen', '--key', keyPath]);
    assert.strictEqual(k2.created, false);
    assert.strictEqual(k2.public_key, k.public_key);

    // 2. register — only the PUBLIC key crosses to the hub.
    const reg = await cli(['register', '--hub', hubUrl, '--pub', k.public_key, '--name', 'Octopus']);
    assert.strictEqual(reg.ok, true);
    assert.strictEqual(reg.custodial, false);
    const authorId = reg.id;

    const emitArgs = ['--hub', hubUrl, '--slug', 'octo-build', '--author', authorId, '--actor', 'par_octopus', '--key', keyPath];

    // 3. emit a cascade-block, then the recovery that resolves it (stdin path).
    const r1 = await cli(['emit', ...emitArgs], JSON.stringify({
      type: 'cascade-block', build_id: 'bld_7', task: 'deploy preview',
      reason: 'failing healthcheck', at: '2026-06-11T09:00:00.000Z',
    }));
    assert.strictEqual(r1.ok, true);
    assert.match(r1.record_hash, /^sha256:/);

    const r2 = await cli(['emit', ...emitArgs, '--event', JSON.stringify({
      type: 'recovery', build_id: 'bld_7', task: 'deploy preview',
      resolution: 'rolled back migration 0042', at: '2026-06-11T09:05:00.000Z',
    })]);
    assert.strictEqual(r2.ok, true);
    assert.strictEqual(r2.seq, r1.seq + 1);

    // The chain verifies, and the pair is exactly what the mapping promises.
    const report = hub.verifyThread('octo-build');
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.records, 3); // genesis + block + recovery

    const events = hub.exportThread('octo-build').filter((r) => r.kind === 'clista.event');
    assert.deepStrictEqual(events.map((r) => r.payload.event_type), ['ObjectionRaised', 'DecisionMerged']);
    assert.ok(events.every((r) => r.author === authorId));

    // Non-custodial: the hub holds no private key for the Octopus identity.
    assert.strictEqual(hub.store.getIdentity(authorId).private_key, null);
  } finally {
    server.close();
    fs.rmSync(keyPath, { force: true });
    fs.rmSync(dbPath, { force: true });
  }
});
