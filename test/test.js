// test.js — the properties that ARE the product, as executable claims.
// Run: node --test test/test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { Hub } = require('../src/hub');
const { contentAddress, canonicalize } = require('../src/canonical');
const identity = require('../src/identity');

const tmp = () => `/tmp/hub-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

function seeded() {
  const hub = new Hub(tmp());
  const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
  const octo = hub.createIdentity({ id: 'id_octopus', displayName: 'Octopus', kind: 'agent' });
  return { hub, troy, octo };
}

test('canonical JSON is order-independent', () => {
  assert.strictEqual(
    contentAddress({ b: 1, a: [2, { z: 3, y: 4 }] }),
    contentAddress({ a: [2, { y: 4, z: 3 }], b: 1 })
  );
});

test('records chain: each prev points at prior record hash', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Chain test', authorId: troy.id });
  const r1 = hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { n: 1 } });
  const r2 = hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { n: 2 } });
  assert.strictEqual(r1.envelope.prev, t.genesisHash);
  assert.strictEqual(r2.envelope.prev, r1.record_hash);
  assert.strictEqual(r2.envelope.seq, 2);
});

test('verifyThread passes on an honest chain and stays trusted:false', () => {
  const { hub, troy, octo } = seeded();
  const t = hub.createThread({ title: 'Honest', authorId: troy.id });
  hub.append({ threadId: t.id, authorId: octo.id, kind: 'note', payload: { decision: 'ship' } });
  const report = hub.verifyThread(t.id);
  assert.strictEqual(report.valid, true);
  assert.strictEqual(report.trusted, false); // never escalates
});

test('tampering with a stored body is detected', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Tamper', authorId: troy.id });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { amount: 100 } });
  // Bypass triggers the way an attacker with disk access would: rewrite the file is
  // out of scope, but simulate by dropping triggers then editing.
  hub.store.db.exec('DROP TRIGGER records_no_update');
  hub.store.db.exec(`UPDATE records SET body = replace(body, '100', '900') WHERE seq = 1`);
  const report = hub.verifyThread(t.id);
  assert.strictEqual(report.valid, false);
  assert.ok(report.problems.some(p => /hash mismatch/.test(p.error)));
});

test('append-only is enforced by the database itself', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Immutable', authorId: troy.id });
  assert.throws(() => hub.store.db.exec(`DELETE FROM records`), /append-only/);
  assert.throws(() => hub.store.db.exec(`UPDATE records SET seq = 99`), /append-only/);
});

test('signatures bind author identity: wrong key fails verification', () => {
  const { publicKeyHex } = identity.generateKeypair();
  const { privateKeyPem } = identity.generateKeypair(); // different pair
  const msg = 'ab'.repeat(32);
  const sig = identity.sign(msg, privateKeyPem);
  assert.strictEqual(identity.verify(msg, sig, publicKeyHex), false);
});

test('forged signature on a real record is detected', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Forgery', authorId: troy.id });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { x: 1 } });
  hub.store.db.exec('DROP TRIGGER records_no_update');
  hub.store.db.exec(`UPDATE records SET signature = '${'00'.repeat(64)}' WHERE seq = 1`);
  const report = hub.verifyThread(t.id);
  assert.ok(report.problems.some(p => /invalid signature/.test(p.error)));
});

test('ClisTa NDJSON event log ingests as a verifiable thread', () => {
  const { hub, octo } = seeded();
  const path = `${__dirname}/../fixtures/events.ndjson`;
  const events = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const { thread, records } = hub.ingestClistaEvents({ events, authorId: octo.id, slug: 'clista-first' });
  assert.strictEqual(records.length, events.length);
  const report = hub.verifyThread('clista-first');
  assert.strictEqual(report.valid, true);
  // round-trip: exported payloads equal original events
  const exported = hub.exportThread(thread.id).filter(r => r.kind === 'clista.event');
  assert.deepStrictEqual(exported.map(r => r.payload), events);
});

test('dogfood thread #1: founding architecture log ingests verifiably, objection preserved', () => {
  const { hub, troy } = seeded();
  const path = `${__dirname}/../threads/founding-architecture.ndjson`;
  const events = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  const { thread } = hub.ingestClistaEvents({ events, authorId: troy.id, slug: 'founding' });
  assert.strictEqual(hub.verifyThread('founding').valid, true);

  // The custodial-keys objection is the deliberate trust concession of v1.
  // It must survive into the merged decision, not get cleaned up.
  const payloads = hub.exportThread(thread.id)
    .filter(r => r.kind === 'clista.event').map(r => r.payload);
  const objection = payloads.find(e => e.event_type === 'ObjectionRaised')?.payload.objection;
  assert.strictEqual(objection.targetObjectId, 'clm_custodial_keys_v1');
  const merged = payloads.find(e => e.event_type === 'DecisionMerged')?.payload.decisionRecord;
  assert.ok(merged.preservedObjectionIds.includes(objection.id));
  assert.ok(payloads.some(e => e.event_type === 'MinorityReportFiled'
    && e.payload.minorityReport.objectionIds.includes(objection.id)));
});

test('hash-only attestation records existence without content', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Notary', authorId: troy.id });
  const secretDecision = { classified: 'air-gapped thread contents' };
  const h = contentAddress(secretDecision);
  const r = hub.attest({ threadId: t.id, authorId: troy.id, payloadHash: h, claim: 'decision existed, 2 signers' });
  const stored = JSON.parse(hub.store.getRecord(r.record_hash).body);
  assert.strictEqual(stored.payload.payload_hash, h);
  assert.strictEqual(stored.payload.disclosed, false);
  assert.ok(!canonicalize(stored).includes('classified')); // zero content leakage
  // later disclosure proves the match
  assert.strictEqual(contentAddress(secretDecision), stored.payload.payload_hash);
});

test('records are portable: verification needs nothing but the records', () => {
  const { hub, troy } = seeded();
  const t = hub.createThread({ title: 'Portable', authorId: troy.id });
  hub.append({ threadId: t.id, authorId: troy.id, kind: 'note', payload: { v: 1 } });
  const exported = hub.exportThread(t.id);
  // standalone re-verification, no Hub instance, no DB
  let prev = null;
  for (const env of exported) {
    const h = contentAddress(env);
    assert.strictEqual(env.prev, prev);
    prev = h;
  }
});
