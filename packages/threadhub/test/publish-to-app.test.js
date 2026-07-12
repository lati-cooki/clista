'use strict';
// Tests for the pure helpers of scripts/publish-to-app.js — the hub→app bridge
// (mirror of clista-ai-app scripts/archive-thread.mjs, which is app→hub).
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clistaEventsOf,
  appThreadIdOf,
  isFinal,
  buildAuthHeaders,
} = require('../scripts/publish-to-app.js');

// A minimal hub export: threadhub.record.v0 envelopes as GET /t/:slug.json
// returns them. Only `seq`, `kind`, `payload` matter to the bridge.
const env = (seq, kind, payload) => ({
  hub: 'threadhub.record.v0',
  thread: 'th_test',
  seq,
  prev: seq === 0 ? null : `sha256:${'a'.repeat(64)}`,
  author: 'id_troy',
  author_key: 'ed25519:xxx',
  recorded_at: '2026-07-09T00:00:00.000Z',
  kind,
  payload,
});

const ev = (type, extra = {}) => ({ event_type: type, thread_id: 'thr_1', ...extra });

test('clistaEventsOf keeps only clista.event records, in seq order, unwrapped', () => {
  const envelopes = [
    env(2, 'clista.event', ev('ClaimCreated')),
    env(0, 'genesis', { title: 't' }),
    env(1, 'clista.event', ev('ThreadCreated')),
    env(3, 'attestation', { payload_hash: 'sha256:...' }),
    env(4, 'note', { text: 'hi' }),
  ];
  const events = clistaEventsOf(envelopes);
  assert.deepEqual(events.map((e) => e.event_type), ['ThreadCreated', 'ClaimCreated']);
});

test('clistaEventsOf returns [] for an empty or eventless thread', () => {
  assert.deepEqual(clistaEventsOf([]), []);
  assert.deepEqual(clistaEventsOf([env(0, 'genesis', {})]), []);
});

test('appThreadIdOf reads the ThreadCreated thread id', () => {
  const events = [
    ev('ThreadCreated', { payload: { thread: { id: 'thr_abc123' } } }),
    ev('ClaimCreated'),
  ];
  assert.equal(appThreadIdOf(events), 'thr_abc123');
});

test('appThreadIdOf is null without a ThreadCreated', () => {
  assert.equal(appThreadIdOf([ev('ClaimCreated')]), null);
});

test('isFinal accepts a formal decision (DecisionMerged)', () => {
  assert.equal(isFinal([ev('ThreadCreated'), ev('DecisionMerged')]), true);
});

test('isFinal accepts a sealed decision-as-claim (ClaimCreated)', () => {
  assert.equal(isFinal([ev('ThreadCreated'), ev('ClaimCreated')]), true);
});

test('isFinal rejects a thread with neither', () => {
  assert.equal(isFinal([ev('ThreadCreated'), ev('ObjectionRaised')]), false);
});

test('buildAuthHeaders: --email wins (dev identity path)', () => {
  const h = buildAuthHeaders({ CF_ACCESS_TOKEN: 'tok' }, 'me@x.dev');
  assert.deepEqual(h, { 'x-clista-email': 'me@x.dev' });
});

test('buildAuthHeaders: CF_ACCESS_TOKEN → cf-access-token header', () => {
  const h = buildAuthHeaders({ CF_ACCESS_TOKEN: 'tok' }, null);
  assert.deepEqual(h, { 'cf-access-token': 'tok' });
});

test('buildAuthHeaders: service token pair → CF-Access-Client-Id/Secret', () => {
  const h = buildAuthHeaders(
    { CF_ACCESS_CLIENT_ID: 'id.access', CF_ACCESS_CLIENT_SECRET: 's3cret' },
    null
  );
  assert.deepEqual(h, {
    'CF-Access-Client-Id': 'id.access',
    'CF-Access-Client-Secret': 's3cret',
  });
});

test('buildAuthHeaders: nothing configured → null (caller falls back to cloudflared)', () => {
  assert.equal(buildAuthHeaders({}, null), null);
});
