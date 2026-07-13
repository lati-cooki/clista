// landing.test.js — the content-negotiated root (GET /).
//
// Today GET / returns a JSON instance summary. A browser hitting the bare
// domain sees raw JSON. The change: content-negotiate ONLY GET /. A request
// whose Accept includes text/html gets a spare HTML landing page in the
// thread viewer's aesthetic; every API client (curl, urllib, the anchor
// gate — they send */* or no Accept, never text/html) keeps the EXACT
// JSON it gets today, byte-for-byte. The JSON path is the load-bearing
// invariant here: it must not move by a single byte.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { handle } = require('../src/routes');
const { landingHTML } = require('../src/view');
const { Hub } = require('../src/hub');

const HTML_TYPE = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json; charset=utf-8';

// A non-public hub with two threads: everything lists.
function twoThreadHub() {
  const hub = new Hub(':memory:');
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const a = hub.createThread({ title: 'Ship the beta?', authorId: troy.id, slug: 'ship-beta' });
  const b = hub.createThread({ title: 'Adopt <b>SQLite</b> & "workerd"?', authorId: troy.id, slug: 'adopt-sqlite' });
  hub.append({ threadId: a.id, authorId: troy.id, kind: 'note', payload: { n: 1 } });
  return { hub, troy, a, b };
}

// The witnessed publication act (mirrors publication.test.js).
function publicationEventPayload(action, threadId) {
  return {
    event_type: action === 'publish' ? 'ThreadPublished' : 'ThreadPublicationRevoked',
    actor_id: 'par_operator',
    timestamp: new Date().toISOString(),
    payload: {
      threadPublication: {
        id: `tpb_${Math.random().toString(36).slice(2, 10)}`,
        object: 'threadPublication',
        threadId,
        action,
        scope: 'public-read',
        publishedByParticipantId: 'par_operator',
        publishedAt: new Date().toISOString(),
      },
    },
  };
}

// --- (a) browser Accept → HTML ---

test('GET / with Accept: text/html → 200 HTML with a viewer link per thread and the verify line', () => {
  const { hub } = twoThreadHub();
  const out = handle(hub, {
    method: 'GET', path: '/', allowWrite: () => true,
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  });
  assert.strictEqual(out.status, 200);
  assert.strictEqual(out.contentType, HTML_TYPE);
  // A viewer link for every listed thread.
  for (const t of hub.store.listThreads()) {
    assert.ok(
      out.body.includes(`href="/t/${t.slug}/view"`),
      `landing missing viewer link for ${t.slug}`,
    );
    assert.ok(out.body.includes(t.slug), `landing missing slug ${t.slug}`);
  }
  // The verify note and the honest-boundary line.
  assert.match(out.body, /verifies on your machine/);
  assert.ok(out.body.includes('/verify.mjs'), 'verify.mjs reference missing');
  assert.match(out.body, /never that the decision was good/);
  // A real HTML document with the required head bits.
  assert.match(out.body, /<!doctype html>/i);
  assert.match(out.body, /<meta name="viewport"/);
  assert.match(out.body, /<title>/);
});

// --- (b) API Accept variants → EXACT current JSON, byte-identical ---

test('GET / with */*, application/json, and no Accept → the EXACT current JSON, byte-identical', () => {
  const { hub } = twoThreadHub();

  // The literal pre-change body: instance summary, published-unfiltered in
  // non-public mode, JSON.stringify(obj, null, 2) like every JSON response.
  const expected = JSON.stringify({
    instance: 'threadhub.v0',
    records: hub.store.countRecords(),
    threads: hub.store.listThreads().map((t) => ({ id: t.id, slug: t.slug, title: t.title })),
  }, null, 2);

  const variants = [
    ['no Accept', undefined],
    ['*/*', '*/*'],
    ['application/json', 'application/json'],
    ['curl default', '*/*'],
  ];
  for (const [name, accept] of variants) {
    const out = handle(hub, { method: 'GET', path: '/', allowWrite: () => true, accept });
    assert.strictEqual(out.status, 200, name);
    assert.strictEqual(out.contentType, JSON_TYPE, name);
    assert.strictEqual(out.body, expected, `${name}: JSON body drifted from the pre-change bytes`);
  }
});

// --- (c) publicMode hides unpublished threads from the HTML too ---

test('GET / HTML respects publicMode: unpublished threads never appear in the landing', () => {
  const { hub, troy, a, b } = twoThreadHub();
  // Publish only thread a.
  hub.append({
    threadId: a.id, authorId: troy.id, kind: 'clista.event',
    payload: publicationEventPayload('publish', a.id),
  });
  const out = handle(hub, {
    method: 'GET', path: '/', publicMode: true, allowWrite: () => true,
    accept: 'text/html',
  });
  assert.strictEqual(out.status, 200);
  assert.strictEqual(out.contentType, HTML_TYPE);
  assert.ok(out.body.includes(`href="/t/${a.slug}/view"`), 'published thread missing from landing');
  assert.ok(!out.body.includes(`href="/t/${b.slug}/view"`), 'unpublished thread leaked into landing');
  assert.ok(!out.body.includes(b.id), 'unpublished thread id leaked into landing');
  assert.ok(!out.body.includes(b.title), 'unpublished thread title leaked into landing');
});

// --- (d) titles with HTML metacharacters are escaped ---

test('GET / HTML escapes thread titles — metacharacters never reach the page raw', () => {
  const { hub } = twoThreadHub(); // thread b: 'Adopt <b>SQLite</b> & "workerd"?'
  const out = handle(hub, { method: 'GET', path: '/', allowWrite: () => true, accept: 'text/html' });
  assert.ok(!out.body.includes('<b>SQLite</b>'), 'unescaped title markup reached the page');
  assert.ok(out.body.includes('&lt;b&gt;SQLite&lt;/b&gt;'), 'escaped title missing');
  assert.ok(out.body.includes('&amp;'), 'ampersand not escaped');
  assert.ok(out.body.includes('&quot;workerd&quot;'), 'quotes not escaped');
});

// --- empty state ---

test('landingHTML with no threads shows a spare empty state, not an empty list', () => {
  const html = landingHTML([]);
  assert.match(html, /No published records yet\./);
  assert.ok(!html.includes('href="/t/'), 'empty landing should carry no viewer links');
});
