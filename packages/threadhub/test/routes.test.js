// routes.test.js — the transport-agnostic seam (task: hub Phase 1).
//
// Three focused guards:
//   1. PUBLIC_404_BODY is byte-pinned: the one public 404, serialized
//      exactly as the server has always serialized it. Any drift here is
//      a publication-oracle regression, not a formatting nit.
//   2. gateWrites: on a gated public deployment every POST answers the
//      shared 404 bytes before rate limit or route match; with the flag
//      off (what the Node server passes) POSTs behave exactly as today.
//   3. Hub duck-types its constructor argument: a store-shaped object is
//      used as-is; anything else is treated as a database path.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { handle, rateLimiter, PUBLIC_404_BODY } = require('../src/routes');
const { Hub } = require('../src/hub');
const { Store } = require('../src/store');

// --- 1. PUBLIC_404_BODY byte pin ---

test('PUBLIC_404_BODY is the exact bytes the server has always sent', () => {
  assert.strictEqual(
    PUBLIC_404_BODY,
    '{\n  "error": "not found",\n  "code": "not_found"\n}'
  );
  // And it is what JSON.stringify(obj, null, 2) produces — the same
  // serializer as every other JSON response, so byte-identity between
  // filtered 404s and the fallthrough 404 holds by construction.
  assert.strictEqual(PUBLIC_404_BODY, JSON.stringify({ error: 'not found', code: 'not_found' }, null, 2));
});

test('fallthrough 404 answers PUBLIC_404_BODY bytes in every mode', () => {
  const hub = new Hub(':memory:');
  for (const publicMode of [false, true]) {
    const out = handle(hub, { method: 'GET', path: '/no/such/route', publicMode, allowWrite: () => true });
    assert.strictEqual(out.status, 404);
    assert.strictEqual(out.body, PUBLIC_404_BODY);
    assert.strictEqual(out.contentType, 'application/json; charset=utf-8');
  }
});

// --- 2. gateWrites ---

function seededHub() {
  const hub = new Hub(':memory:');
  const author = hub.createIdentity({ displayName: 'Troy', kind: 'human' });
  return { hub, author };
}

test('gateWrites + publicMode: every POST answers the shared 404 bytes, before rate limit or route match', () => {
  const { hub, author } = seededHub();
  const neverCalled = () => { throw new Error('rate limiter consulted despite write gate'); };
  for (const path of ['/threads', '/identities', '/t/anything/records', '/no/such/route']) {
    const out = handle(hub, {
      method: 'POST', path, bodyJson: { title: 'x', author: author.id },
      publicMode: true, gateWrites: true, ip: '1.2.3.4', allowWrite: neverCalled,
    });
    assert.strictEqual(out.status, 404, `POST ${path}`);
    assert.strictEqual(out.body, PUBLIC_404_BODY, `POST ${path} — byte-identical with a route that never existed`);
  }
  // Nothing was written: the gate answered before the route table.
  assert.strictEqual(hub.store.listThreads().length, 0);
});

test('gateWrites without publicMode leaves POSTs routable (flag arms only a public deployment)', () => {
  const { hub, author } = seededHub();
  const out = handle(hub, {
    method: 'POST', path: '/threads', bodyJson: { title: 'Gated but private', author: author.id },
    publicMode: false, gateWrites: true, ip: '1.2.3.4', allowWrite: () => true,
  });
  assert.strictEqual(out.status, 201);
  assert.strictEqual(hub.store.listThreads().length, 1);
});

test('gateWrites: false (what the Node server passes) — POSTs behave exactly as today, incl. rate limiting', () => {
  const { hub, author } = seededHub();
  const allowWrite = rateLimiter({ max: 1, windowMs: 60_000 });
  const req = (bodyJson) => handle(hub, {
    method: 'POST', path: '/threads', bodyJson,
    publicMode: true, gateWrites: false, ip: '1.2.3.4', allowWrite,
  });
  const first = req({ title: 'First', author: author.id });
  assert.strictEqual(first.status, 201);
  const second = req({ title: 'Second', author: author.id });
  assert.strictEqual(second.status, 429);
  assert.strictEqual(JSON.parse(second.body).code, 'rate_limited');
});

// --- 3. Hub constructor duck-typing ---

test('Hub uses a store-shaped argument as-is (getThread + insertRecord quack the duck test)', () => {
  const fake = {
    getThread: () => null,
    insertRecord: () => {},
    insertIdentity: () => {},
    getIdentity: () => null,
  };
  const hub = new Hub(fake);
  assert.strictEqual(hub.store, fake, 'the provided store is used, not wrapped or replaced');
});

test('Hub still treats a non-store argument as a database path', () => {
  const hub = new Hub(':memory:');
  assert.ok(hub.store instanceof Store);
  // and it works end to end: identity -> thread -> verified chain
  const author = hub.createIdentity({ displayName: 'Troy', kind: 'human' });
  const thread = hub.createThread({ title: 'Path-constructed hub', authorId: author.id });
  assert.strictEqual(hub.verifyThread(thread.id).valid, true);
});
