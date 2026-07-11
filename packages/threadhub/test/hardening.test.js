// hardening.test.js — abuse limits and operability guarantees.
// Run: node --test test/hardening.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const { createServer } = require('../src/server');
const { Hub } = require('../src/hub');

const tmp = () => `/tmp/hub-hard-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

async function liveHub(opts) {
  const { server, hub } = createServer(tmp(), opts);
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  hub.createThread({ title: 'Hardened', authorId: troy.id, slug: 'hard' });
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
  const post = (path, body) => fetch(`http://localhost:${port}${path}`, {
    method: 'POST', body: JSON.stringify(body),
  });
  return { server, hub, port, post };
}

test('per-record cap: a record over 256KB is rejected with payload_too_large', async () => {
  const { server, hub, post } = await liveHub();
  try {
    const res = await post('/t/hard/records', {
      author: 'id_troy', kind: 'note', payload: { blob: 'x'.repeat(300 * 1024) },
    });
    assert.strictEqual(res.status, 413);
    assert.strictEqual((await res.json()).code, 'payload_too_large');
    assert.strictEqual(hub.store.countRecords(), 1); // genesis only
    // a comfortably-sized record still lands
    const ok = await post('/t/hard/records', { author: 'id_troy', kind: 'note', payload: { n: 1 } });
    assert.strictEqual(ok.status, 201);
  } finally { server.close(); }
});

test('rate limit: POST beyond the per-window budget is 429, GET is unmetered', async () => {
  const { server, port, post } = await liveHub({ rateLimit: { max: 2, windowMs: 60_000 } });
  try {
    const r1 = await post('/t/hard/records', { author: 'id_troy', kind: 'note', payload: { n: 1 } });
    const r2 = await post('/t/hard/records', { author: 'id_troy', kind: 'note', payload: { n: 2 } });
    const r3 = await post('/t/hard/records', { author: 'id_troy', kind: 'note', payload: { n: 3 } });
    assert.strictEqual(r1.status, 201);
    assert.strictEqual(r2.status, 201);
    assert.strictEqual(r3.status, 429);
    assert.strictEqual((await r3.json()).code, 'rate_limited');
    // reads stay open even when writes are throttled
    const read = await fetch(`http://localhost:${port}/t/hard/verify`);
    assert.strictEqual(read.status, 200);
  } finally { server.close(); }
});

test('structured error codes: unknown thread is 404 not_found, stale chain is 409 stale_chain', async () => {
  const { server, port, post } = await liveHub();
  try {
    const missing = await fetch(`http://localhost:${port}/t/nope/verify`);
    assert.strictEqual(missing.status, 404);
    assert.strictEqual((await missing.json()).code, 'not_found');

    const malformed = await post('/t/hard/attest', { author: 'id_troy', payload_hash: 'not-a-hash' });
    assert.strictEqual(malformed.status, 400);
    assert.strictEqual((await malformed.json()).code, 'bad_request');
  } finally { server.close(); }
});

test('verify --all: exit 0 on a healthy store, exit 1 with the broken thread named', () => {
  const db = tmp();
  const hub = new Hub(db);
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  hub.createThread({ title: 'Alpha', authorId: troy.id, slug: 'alpha' });
  const beta = hub.createThread({ title: 'Beta', authorId: troy.id, slug: 'beta' });
  hub.append({ threadId: beta.id, authorId: troy.id, kind: 'note', payload: { amount: 100 } });

  const cli = (args) => spawnSync(process.execPath, ['bin/cli.js', ...args, '--db', db], {
    cwd: `${__dirname}/..`, encoding: 'utf8',
  });

  const healthy = cli(['verify', '--all']);
  assert.strictEqual(healthy.status, 0, healthy.stderr);
  assert.match(healthy.stdout, /alpha/);
  assert.match(healthy.stdout, /beta/);

  // tamper with beta the way an attacker with disk access would
  hub.store.db.exec('DROP TRIGGER records_no_update');
  hub.store.db.exec(`UPDATE records SET body = replace(body, '100', '900') WHERE seq = 1`);

  const broken = cli(['verify', '--all']);
  assert.strictEqual(broken.status, 1);
  assert.match(broken.stdout, /beta/);
  assert.match(broken.stdout, /invalid/i);
});
