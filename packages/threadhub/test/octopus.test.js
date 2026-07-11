// octopus.test.js — the Octopus writer adapter: a Hermes Agent plugin
// emits build decisions as clista.event records over the non-custodial
// signed path. The hub never sees the agent's private key.
// Run: node --test test/octopus.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/server');
const identity = require('../src/identity');
const { mapBuildEvent, OctopusWriter } = require('../adapters/octopus');

const tmp = () => `/tmp/hub-octo-${Date.now()}-${Math.random().toString(36).slice(2)}.db`;

const CTX = { threadId: 'thd_build', actorId: 'par_octopus' };

test('cascade-block maps to ObjectionRaised', () => {
  const ev = mapBuildEvent({
    type: 'cascade-block',
    build_id: 'bld_42',
    task: 'compile workers bundle',
    reason: 'upstream schema change broke codegen; halting dependents',
    at: '2026-06-11T08:00:00.000Z',
  }, CTX);
  assert.strictEqual(ev.event_type, 'ObjectionRaised');
  assert.strictEqual(ev.thread_id, 'thd_build');
  assert.strictEqual(ev.actor_id, 'par_octopus');
  assert.strictEqual(ev.timestamp, '2026-06-11T08:00:00.000Z');
  const obj = ev.payload.objection;
  assert.strictEqual(obj.object, 'objection');
  assert.strictEqual(obj.status, 'open');
  assert.match(obj.text, /upstream schema change/);
  assert.strictEqual(obj.targetObjectId, 'bld_42');
  // deterministic: same build event, same ids — retries are idempotent in content
  assert.deepStrictEqual(ev, mapBuildEvent({
    type: 'cascade-block', build_id: 'bld_42', task: 'compile workers bundle',
    reason: 'upstream schema change broke codegen; halting dependents',
    at: '2026-06-11T08:00:00.000Z',
  }, CTX));
});

test('recovery maps to DecisionMerged resolving the matching cascade-block', () => {
  const block = mapBuildEvent({
    type: 'cascade-block', build_id: 'bld_42', task: 'compile workers bundle',
    reason: 'codegen broken', at: '2026-06-11T08:00:00.000Z',
  }, CTX);
  const ev = mapBuildEvent({
    type: 'recovery',
    build_id: 'bld_42',
    task: 'compile workers bundle',
    resolution: 'pinned schema to v3 and regenerated stubs',
    at: '2026-06-11T08:20:00.000Z',
  }, CTX);
  assert.strictEqual(ev.event_type, 'DecisionMerged');
  const dcr = ev.payload.decisionRecord;
  assert.strictEqual(dcr.object, 'decisionRecord');
  assert.strictEqual(dcr.status, 'approved');
  assert.match(dcr.rationale, /pinned schema to v3/);
  // the recovery preserves the objection it resolves
  assert.deepStrictEqual(dcr.preservedObjectionIds, [block.payload.objection.id]);
});

test('unknown build event types are refused, not guessed at', () => {
  assert.throws(() => mapBuildEvent({ type: 'esoteric', build_id: 'x' }, CTX),
    /unsupported build event type/);
});

test('OctopusWriter emits signed clista.event records to a live hub', async () => {
  const { server, hub } = createServer(tmp());
  try {
    const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
    hub.createThread({ title: 'Octopus build log', authorId: troy.id, slug: 'octo-build' });
    const keypair = identity.generateKeypair();
    hub.createIdentity({ id: 'id_octopus', displayName: 'Octopus', kind: 'agent', publicKey: keypair.publicKeyHex });
    const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));

    const writer = new OctopusWriter({
      baseUrl: `http://localhost:${port}`,
      slug: 'octo-build',
      authorId: 'id_octopus',
      keypair,
      actorId: 'par_octopus',
    });
    const r1 = await writer.emit({
      type: 'cascade-block', build_id: 'bld_7', task: 'deploy preview',
      reason: 'failing healthcheck', at: '2026-06-11T09:00:00.000Z',
    });
    const r2 = await writer.emit({
      type: 'recovery', build_id: 'bld_7', task: 'deploy preview',
      resolution: 'rolled back migration 0042', at: '2026-06-11T09:05:00.000Z',
    });
    assert.match(r1.record_hash, /^sha256:/);
    assert.strictEqual(r2.seq, r1.seq + 1);

    const report = hub.verifyThread('octo-build');
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.records, 3); // genesis + block + recovery

    const events = hub.exportThread('octo-build').filter(r => r.kind === 'clista.event');
    assert.deepStrictEqual(events.map(r => r.payload.event_type), ['ObjectionRaised', 'DecisionMerged']);
    assert.ok(events.every(r => r.author === 'id_octopus'));
    // non-custodial: the hub holds no private key for the agent
    assert.strictEqual(hub.store.getIdentity('id_octopus').private_key, null);
  } finally { server.close(); }
});

test('OctopusWriter.send is the generic signed path: verbatim payload, any kind', async () => {
  const { server, hub } = createServer(tmp());
  try {
    const troy = hub.createIdentity({ id: 'id_troy', displayName: 'Troy', kind: 'human' });
    hub.createThread({ title: 'Deliberation', authorId: troy.id, slug: 'delib' });
    const keypair = identity.generateKeypair();
    hub.createIdentity({ id: 'id_raft', displayName: 'hermes-raft', kind: 'agent', publicKey: keypair.publicKeyHex });
    const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));

    const writer = new OctopusWriter({
      baseUrl: `http://localhost:${port}`, slug: 'delib', authorId: 'id_raft', keypair,
    });
    const clistaEvent = {
      event_type: 'ClaimCreated', thread_id: 'thd_delib', actor_id: 'par_hermes_raft',
      payload: { claim: { id: 'clm_1', object: 'claim', text: 'Supervised-only is the safer default.' } },
    };
    const r1 = await writer.send({ payload: clistaEvent });           // default kind clista.event
    const r2 = await writer.send({ kind: 'note', payload: { memo: 'session end' } });
    assert.match(r1.record_hash, /^sha256:/);
    assert.strictEqual(r2.seq, r1.seq + 1);

    const report = hub.verifyThread('delib');
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.records, 3); // genesis + event + note

    const records = hub.exportThread('delib');
    assert.deepStrictEqual(records[1].payload, clistaEvent);          // stored verbatim, no mapping
    assert.strictEqual(records[1].kind, 'clista.event');
    assert.strictEqual(records[2].kind, 'note');
    assert.strictEqual(hub.store.getIdentity('id_raft').private_key, null); // non-custodial
  } finally { server.close(); }
});
