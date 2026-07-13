// publication.test.js — the publication gate (DR-2026-07-13
// record-is-the-interface, rules 2 and 5).
//
// A public thread viewer without a publication gate quietly converts every
// sealed thread into a potentially public thread: slug knowledge would equal
// read access. So publication is a witnessed per-thread act — a sealed
// ThreadPublished event on the thread itself, revocable only by appending
// ThreadPublicationRevoked — and in public mode EVERY read surface serves
// only effectively-published threads. Unpublished and nonexistent must be
// indistinguishable from outside: same status, byte-identical body.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/server');
const { effectivePublication } = require('../src/publication');

const tmp = () => `/tmp/hub-pub-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

// --- fixtures ---

function publicationEventPayload(action, overrides = {}) {
  return {
    event_type: action === 'publish' ? 'ThreadPublished' : 'ThreadPublicationRevoked',
    actor_id: 'par_operator',
    timestamp: new Date().toISOString(),
    payload: {
      threadPublication: {
        id: `tpb_${Math.random().toString(36).slice(2, 10)}`,
        object: 'threadPublication',
        threadId: 'thd_x',
        action,
        scope: 'public-read',
        publishedByParticipantId: 'par_operator',
        publishedAt: new Date().toISOString(),
        ...overrides,
      },
    },
  };
}

function envelope(kind, payload) {
  return { kind, payload };
}

// Two threads on a live server: 'published' carries a ThreadPublished act,
// 'sealed' is a normal sealed thread that never consented to publication.
async function liveHub(opts) {
  const { server, hub } = createServer(tmp(), opts);
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const pub = hub.createThread({ title: 'Published thread', authorId: troy.id, slug: 'published' });
  const sealed = hub.createThread({ title: 'Sealed private thread', authorId: troy.id, slug: 'sealed' });
  hub.append({ threadId: pub.id, authorId: troy.id, kind: 'note', payload: { n: 1 } });
  hub.append({ threadId: sealed.id, authorId: troy.id, kind: 'note', payload: { secret: 'do not serve' } });
  const publish = (threadId, action = 'publish') => hub.append({
    threadId, authorId: troy.id, kind: 'clista.event',
    payload: publicationEventPayload(action, { threadId }),
  });
  publish(pub.id);
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
  return { server, hub, port, pub, sealed, publish };
}

// --- effectivePublication: one small pure function of the records ---

test('publication: no publication event means unpublished', () => {
  assert.strictEqual(effectivePublication([]).published, false);
  assert.strictEqual(effectivePublication([
    envelope('genesis', { title: 't' }),
    envelope('note', { n: 1 }),
  ]).published, false);
});

test('publication: a ThreadPublished event publishes', () => {
  const state = effectivePublication([
    envelope('genesis', { title: 't' }),
    envelope('clista.event', publicationEventPayload('publish')),
  ]);
  assert.strictEqual(state.published, true);
  assert.strictEqual(state.act.action, 'publish');
});

test('publication: the LAST publication event wins — publish then revoke is unpublished', () => {
  const state = effectivePublication([
    envelope('clista.event', publicationEventPayload('publish')),
    envelope('note', { unrelated: true }),
    envelope('clista.event', publicationEventPayload('revoke')),
  ]);
  assert.strictEqual(state.published, false);
});

test('publication: revoke then re-publish is published again (append-only reversal)', () => {
  const state = effectivePublication([
    envelope('clista.event', publicationEventPayload('publish')),
    envelope('clista.event', publicationEventPayload('revoke')),
    envelope('clista.event', publicationEventPayload('publish')),
  ]);
  assert.strictEqual(state.published, true);
});

test('publication: fails closed — unregistered scope or mismatched action publishes nothing', () => {
  assert.strictEqual(effectivePublication([
    envelope('clista.event', publicationEventPayload('publish', { scope: 'everyone' })),
  ]).published, false);
  assert.strictEqual(effectivePublication([
    envelope('clista.event', publicationEventPayload('publish', { action: 'revoke' })),
  ]).published, false);
  // a malformed LAST publication event does not fall through to an earlier publish
  assert.strictEqual(effectivePublication([
    envelope('clista.event', publicationEventPayload('publish')),
    envelope('clista.event', { event_type: 'ThreadPublished', payload: {} }),
  ]).published, false);
});

// --- public mode: every read surface filters ---

test('public mode: unpublished thread is absent from / and /threads listings', async () => {
  const { server, port, sealed } = await liveHub({ publicMode: true });
  try {
    const rootBody = await (await fetch(`http://localhost:${port}/`)).text();
    const root = JSON.parse(rootBody);
    assert.ok(root.threads.every((t) => t.slug !== 'sealed'), 'root listing leaks the sealed thread');
    assert.ok(root.threads.some((t) => t.slug === 'published'));
    assert.ok(!rootBody.includes(sealed.id), 'root listing leaks the sealed thread id');
    const threadsBody = await (await fetch(`http://localhost:${port}/threads`)).text();
    const threads = JSON.parse(threadsBody);
    assert.ok(threads.every((t) => t.slug !== 'sealed'), '/threads leaks the sealed thread');
    assert.ok(threads.some((t) => t.slug === 'published'));
    assert.ok(!threadsBody.includes(sealed.id), '/threads leaks the sealed thread id');
  } finally { server.close(); }
});

test('public mode: unpublished and nonexistent are byte-identical 404s on every thread surface', async () => {
  const { server, port } = await liveHub({ publicMode: true });
  try {
    for (const suffix of ['', '.json', '/verify', '/view']) {
      const missing = await fetch(`http://localhost:${port}/t/does-not-exist${suffix}`);
      const sealed = await fetch(`http://localhost:${port}/t/sealed${suffix}`);
      assert.strictEqual(missing.status, 404, `nonexistent /t/:slug${suffix}`);
      assert.strictEqual(sealed.status, 404, `unpublished /t/:slug${suffix}`);
      assert.strictEqual(await sealed.text(), await missing.text(),
        `unpublished vs nonexistent bodies differ on /t/:slug${suffix}`);
    }
  } finally { server.close(); }
});

test('public mode: a record fetched by hash 404s when its thread is unpublished — byte-identical with a missing hash', async () => {
  const { server, hub, port, sealed } = await liveHub({ publicMode: true });
  try {
    const sealedHead = hub.store.headOf(sealed.id);
    const byHash = await fetch(`http://localhost:${port}/r/${sealedHead.record_hash}`);
    const missing = await fetch(`http://localhost:${port}/r/sha256:${'ab'.repeat(32)}`);
    assert.strictEqual(byHash.status, 404);
    assert.strictEqual(missing.status, 404);
    assert.strictEqual(await byHash.text(), await missing.text());
  } finally { server.close(); }
});

test('public mode: published threads serve on every read surface; /verify.mjs stays public', async () => {
  const { server, hub, port, pub } = await liveHub({ publicMode: true });
  try {
    const pubHead = hub.store.headOf(pub.id);
    assert.strictEqual((await fetch(`http://localhost:${port}/t/published`)).status, 200);
    const records = await (await fetch(`http://localhost:${port}/t/published.json`)).json();
    assert.ok(Array.isArray(records) && records.length >= 3);
    const verify = await (await fetch(`http://localhost:${port}/t/published/verify`)).json();
    assert.strictEqual(verify.valid, true);
    assert.strictEqual((await fetch(`http://localhost:${port}/r/${pubHead.record_hash}`)).status, 200);
    assert.strictEqual((await fetch(`http://localhost:${port}/verify.mjs`)).status, 200);
  } finally { server.close(); }
});

test('public mode: revocation takes the thread back off the surface (revoke only by appending)', async () => {
  const { server, port, pub, publish } = await liveHub({ publicMode: true });
  try {
    assert.strictEqual((await fetch(`http://localhost:${port}/t/published.json`)).status, 200);
    publish(pub.id, 'revoke');
    const revoked = await fetch(`http://localhost:${port}/t/published.json`);
    const missing = await fetch(`http://localhost:${port}/t/does-not-exist.json`);
    assert.strictEqual(revoked.status, 404);
    assert.strictEqual(await revoked.text(), await missing.text());
  } finally { server.close(); }
});

test('default (non-public) mode: local behavior unchanged — unpublished threads still serve', async () => {
  const { server, port } = await liveHub();
  try {
    assert.strictEqual((await fetch(`http://localhost:${port}/t/sealed`)).status, 200);
    assert.strictEqual((await fetch(`http://localhost:${port}/t/sealed.json`)).status, 200);
    const threads = await (await fetch(`http://localhost:${port}/threads`)).json();
    assert.ok(threads.some((t) => t.slug === 'sealed'));
  } finally { server.close(); }
});

test('THREADHUB_PUBLIC_MODE=1 env flips public mode without code changes', async () => {
  process.env.THREADHUB_PUBLIC_MODE = '1';
  let server;
  try {
    let port;
    ({ server, port } = await liveHub());
    assert.strictEqual((await fetch(`http://localhost:${port}/t/sealed.json`)).status, 404);
    assert.strictEqual((await fetch(`http://localhost:${port}/t/published.json`)).status, 200);
  } finally {
    delete process.env.THREADHUB_PUBLIC_MODE;
    server?.close();
  }
});
