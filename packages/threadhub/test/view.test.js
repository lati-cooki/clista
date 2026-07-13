// view.test.js — the public thread viewer (DR-2026-07-13
// record-is-the-interface, rules 1, 3, 4).
//
// The record is the interface: /t/:slug/view renders the witnessed sequence
// in witnessed order — genesis question, every record as a block, chain
// metadata subordinate — and dissent-bearing events (the protocol registry's
// DISSENT_BEARING_TYPES) render mechanically heavier than everything else.
// The reversal is the most readable thing on the page: a PositionTaken
// followed by the final ClaimCreated that answers it is shown, not
// summarized. The verify button imports the literal /verify.mjs — the same
// bytes the skeptic is told to save.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/server');
const view = require('../src/view');

const tmp = () => `/tmp/hub-view-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

const clistaEvent = (eventType, payload) => ({
  event_type: eventType,
  actor_id: 'par_troy',
  timestamp: '2026-07-13T00:00:00.000Z',
  payload,
});

// The reversal story: evidence → claim to ship → an opposing position →
// a blocking objection → its resolution → the final claim that REVERSES the
// first. The argument is the merchandise; the viewer must not bury it.
async function liveThread(opts) {
  const { server, hub } = createServer(tmp(), opts);
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const t = hub.createThread({
    title: 'Ship the beta?', question: 'Do we ship the support beta this week?',
    authorId: troy.id, slug: 'story',
  });
  const append = (kind, payload) => hub.append({ threadId: t.id, authorId: troy.id, kind, payload });
  append('clista.event', clistaEvent('EvidenceCommitted', {
    evidence: { id: 'evd_1', threadId: t.id, finding: '82% of tickets are FAQ-shaped', source: 'support logs' },
  }));
  append('clista.event', clistaEvent('ClaimCreated', {
    claim: { id: 'clm_ship', threadId: t.id, text: 'Yes <script>alert("ship")</script> — ship it this week' },
  }));
  append('clista.event', clistaEvent('PositionTaken', {
    position: { id: 'pos_1', threadId: t.id, participantId: 'par_troy', stance: 'oppose', reason: 'privacy review has not cleared raw tickets' },
  }));
  append('clista.event', clistaEvent('ObjectionRaised', {
    objection: { id: 'obj_1', threadId: t.id, participantId: 'par_troy', targetObjectId: 'clm_ship', targetObjectType: 'claim', text: 'PII exposure if unredacted tickets go out', blocking: true },
  }));
  append('clista.event', clistaEvent('ObjectionResolved', {
    objectionId: 'obj_1', resolution: 'scope cut to redacted sample tickets only',
  }));
  append('clista.event', clistaEvent('ClaimCreated', {
    claim: { id: 'clm_final', threadId: t.id, text: 'REVERSED: ship redacted sample tickets only, not the full beta' },
  }));
  append('note', { aside: 'operator note' });
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
  const html = await (await fetch(`http://localhost:${port}/t/story/view`)).text();
  return { server, hub, port, thread: t, html };
}

// --- the mechanical dissent definition stays in sync with the registry ---

test('view: vendored DISSENT_BEARING_TYPES is byte-equal to the protocol registry', () => {
  const protocol = require('../../protocol/src/event-types');
  assert.deepStrictEqual([...view.DISSENT_BEARING_TYPES], [...protocol.DISSENT_BEARING_TYPES],
    'threadhub/src/view.js has drifted from packages/protocol/src/event-types.js DISSENT_BEARING_TYPES');
});

// --- rendering ---

test('view: renders genesis title and question, records in witnessed order, chain metadata subordinate', async () => {
  const { server, html } = await liveThread();
  try {
    assert.match(html, /<h1[^>]*>Ship the beta\?<\/h1>/);
    assert.ok(html.includes('Do we ship the support beta this week?'), 'genesis question missing');
    // witnessed order: each human text appears, in seq order, no reordering
    const sequence = [
      '82% of tickets are FAQ-shaped',
      'ship it this week',
      'privacy review has not cleared raw tickets',
      'PII exposure if unredacted tickets go out',
      'scope cut to redacted sample tickets only',
      'REVERSED: ship redacted sample tickets only',
    ];
    let cursor = -1;
    for (const text of sequence) {
      const at = html.indexOf(text);
      assert.ok(at > cursor, `"${text}" missing or out of witnessed order`);
      cursor = at;
    }
    // chain metadata present but subordinate: every block names its record hash
    assert.ok((html.match(/class="chain"/g) || []).length >= 7, 'per-record chain metadata missing');
    assert.match(html, /sha256:[0-9a-f]{12}/, 'record hashes missing');
    // author id and display name both shown
    assert.ok(html.includes('id_troy'), 'author id missing');
    assert.ok(html.includes('Troy'), 'known identity display name missing');
  } finally { server.close(); }
});

test('view: dissent-bearing events carry a distinct, heavier class marker than other records', async () => {
  const { server, html } = await liveThread();
  try {
    const blocks = [...html.matchAll(/<article class="([^"]*)" data-event-type="([^"]*)"/g)]
      .map((m) => ({ classes: m[1], type: m[2] }));
    assert.ok(blocks.length >= 7, `expected one block per record, got ${blocks.length}`);
    const { DISSENT_BEARING_TYPE_SET } = require('../../protocol/src/event-types');
    for (const b of blocks) {
      if (DISSENT_BEARING_TYPE_SET.has(b.type)) {
        assert.match(b.classes, /\bdissent\b/, `${b.type} must carry the dissent marker`);
      } else {
        assert.doesNotMatch(b.classes, /\bdissent\b/, `${b.type} must not carry the dissent marker`);
      }
    }
    // present AND distinct: both markers occur, and the stylesheet weights dissent
    assert.ok(blocks.some((b) => /\bdissent\b/.test(b.classes)), 'no dissent blocks rendered');
    assert.ok(blocks.some((b) => !/\bdissent\b/.test(b.classes)), 'no plain blocks rendered');
    assert.match(html, /\.rec\.dissent\s*{/, 'no dissent styling rule');
  } finally { server.close(); }
});

test('view: everything is escaped — payload script tags never reach the page raw', async () => {
  const { server, html } = await liveThread();
  try {
    assert.ok(!html.includes('<script>alert'), 'unescaped payload script tag');
    assert.ok(html.includes('&lt;script&gt;alert'), 'escaped claim text missing');
  } finally { server.close(); }
});

test('view: verify section imports the literal /verify.mjs and carries the independence caveat', async () => {
  const { server, html } = await liveThread();
  try {
    assert.ok(html.includes("import('/verify.mjs')"),
      'the verify button must import THE SAME URL/bytes the skeptic saves — no bundle, no sibling');
    assert.match(html, /convenience/i, 'the host-served-verification caveat is missing');
    assert.match(html, /save/i, 'the save-and-run-elsewhere instruction is missing');
  } finally { server.close(); }
});

test('view: footer discloses the custody regime derived from the author set', async () => {
  const { server, html } = await liveThread();
  try {
    assert.match(html, /custod/i, 'custody disclosure missing');
    assert.ok(html.includes('id_troy'), 'custody disclosure does not name the author');
  } finally { server.close(); }
});

test('view: unknown thread 404s; raw /t/:slug stays untouched alongside /view', async () => {
  const { server, port } = await liveThread();
  try {
    assert.strictEqual((await fetch(`http://localhost:${port}/t/nope/view`)).status, 404);
    const raw = await fetch(`http://localhost:${port}/t/story`);
    assert.strictEqual(raw.status, 200);
    assert.match(await raw.text(), /<details class="rec">/); // the existing raw viewer, unchanged
  } finally { server.close(); }
});
