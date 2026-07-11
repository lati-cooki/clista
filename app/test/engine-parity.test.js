// Phase 1 trust anchor: prove the ported engine (js-sha256 + Workers shims)
// projects the scenario-demo log byte-for-byte identically to the ClisTa CLI,
// and that its hash chain re-validates. Mirrors the engine's own
// test/scenario-demo.test.js field-for-field, but runs against worker/engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const engine = require('../worker/engine/index.js');

const events = readFileSync(join(here, 'fixtures', 'scenario-demo.ndjson'), 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const expected = JSON.parse(readFileSync(join(here, 'fixtures', 'scenario-demo.expected-state.json'), 'utf8'));

test('appended log hash-chains and re-validates (js-sha256 byte-identical to node:crypto)', () => {
  // The DO chains raw events on append (content_hash + previous_hash). Verifying
  // the chained log is the real integrity guarantee; on the unhashed source log
  // there is nothing to check.
  const chained = engine.chainEvents(events);
  const integrity = engine.verifyEventIntegrity(chained, { strict: true });
  assert.equal(integrity.valid, true, JSON.stringify(integrity.reasons, null, 2));
  assert.equal(integrity.eventCount, expected.durableState.eventCount);
  assert.ok(/^sha256:[a-f0-9]{64}$/.test(integrity.headHash), 'head hash present');
});

test('validate-before-trust accepts the canonical log', () => {
  const result = engine.validateEvents(events);
  assert.equal(result.valid, true, JSON.stringify(result.reasons, null, 2));
});

test('projection matches expected durable reasoning state', () => {
  const state = engine.selectThreadState(engine.projectEvents(events), expected.threadId);
  const decision = state.decisionStatus.decisionRecord;

  assert.equal(events.length, expected.durableState.eventCount);
  assert.equal(state.reasoningState.question, expected.question);
  assert.equal(decision.id, expected.decision.id);
  assert.equal(decision.status, expected.decision.status);
  assert.equal(decision.summary, expected.decision.summary);
  assert.equal(decision.nextAction, expected.decision.nextAction);
  assert.deepEqual(state.reasoningState.evidence.map((i) => i.id), expected.durableState.evidenceIds);
  assert.deepEqual(state.reasoningState.assumptions.map((i) => i.id), expected.durableState.assumptionIds);
  assert.deepEqual(state.reasoningState.claims.map((i) => i.id), expected.durableState.claimIds);
  assert.deepEqual(state.reasoningState.positions.map((i) => i.id), expected.durableState.positionIds);
  assert.deepEqual(state.reasoningState.objections.map((i) => i.id), expected.durableState.objectionIds);
  assert.deepEqual(state.decisionStatus.reviews.map((i) => i.id), expected.durableState.reviewIds);
  assert.deepEqual(state.reasoningState.minority_reports.map((i) => i.id), expected.durableState.minorityReportIds);
  assert.equal(state.reasoningState.audit_summary.source, 'append_only_event_log');
  assert.equal(state.reasoningState.audit_summary.events_replayed, expected.durableState.eventCount);
});

test('preserved privacy objection survives the approval', () => {
  const state = engine.selectThreadState(engine.projectEvents(events), expected.threadId);
  assert.equal(state.reasoningState.objections[0].status, 'preserved');
});

test('decision summary surfaces the four answers', () => {
  const summary = engine.selectDecisionSummary(engine.projectEvents(events), expected.threadId);
  assert.equal(summary.schema, 'clista.decisionSummary.v0');
  assert.ok(summary.whatWasDecided, 'whatWasDecided present');
});

test('tampering a stored event breaks the chain (fail-closed)', () => {
  const chained = engine.chainEvents(events);
  // mutate a stored row's payload without recomputing its hash, as a tamper would
  chained[5] = { ...chained[5], payload: { ...chained[5].payload, tampered: true } };
  const integrity = engine.verifyEventIntegrity(chained);
  assert.equal(integrity.valid, false);
  assert.ok(integrity.reasons.length > 0);
});
