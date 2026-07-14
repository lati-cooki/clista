// Unit tests for the pure portfolio-signals module. No engine, no DO — plain
// projected-state and stored-row literals in, health signals out.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERDUE_DAYS, deriveStage, deriveSignals, buildCard,
  computeTiming, deriveAttention, summarize, assemblePortfolio,
} from '../worker/portfolio-signals.js';

const state = (over = {}) => ({
  thread: { id: 'thd_x', title: 'T', question: 'Q?', status: 'active', updatedAt: '2026-07-10T00:00:00.000Z', ...(over.thread || {}) },
  identityState: { participants: [{ id: 'par_o', name: 'Owner', role: 'decision owner' }] },
  claims: over.claims || [],
  allEvidence: over.allEvidence || [],
  unresolvedObjections: over.unresolvedObjections || [],
  decisionStatus: { decisionRecord: over.decisionRecord || null },
});

test('deriveStage maps status + conditions to a lifecycle stage', () => {
  assert.equal(deriveStage(state()), 'active');
  assert.equal(deriveStage(state({ thread: { status: 'review' } })), 'in_review');
  assert.equal(deriveStage(state({ thread: { status: 're-review' } })), 're_review');
  assert.equal(deriveStage(state({ thread: { status: 'decided' }, decisionRecord: { conditions: [] } })), 'decided');
  assert.equal(deriveStage(state({ thread: { status: 'decided' }, decisionRecord: { conditions: ['c1'] } })), 'decided_with_conditions');
  assert.equal(deriveStage(state({ thread: { status: 'failed' } })), 'failed');
});

test('deriveSignals counts objections, evidence, grounded claims, conditions', () => {
  const s = state({
    thread: { status: 'decided' },
    claims: [{ id: 'clm_1', evidenceIds: ['evd_1'] }, { id: 'clm_2', evidenceIds: [] }],
    allEvidence: [{ id: 'evd_1' }],
    unresolvedObjections: [{ id: 'obj_1' }],
    decisionRecord: { conditions: ['a', 'b'] },
  });
  const sig = deriveSignals(s, { chainValid: true });
  assert.equal(sig.stage, 'decided_with_conditions');
  assert.equal(sig.open_objections, 1);
  assert.equal(sig.evidence_count, 1);
  assert.equal(sig.claims_total, 2);
  assert.equal(sig.claims_grounded, 1);
  assert.equal(sig.outstanding_conditions, 2);
  assert.equal(sig.re_review, false);
  assert.equal(sig.chain_valid, true);
});

test('buildCard merges lite fields with signals and owner name', () => {
  const card = buildCard(state({ thread: { status: 'review' } }), { chainValid: true, eventCount: 5, lastTimestamp: '2026-07-10T00:00:00.000Z' });
  assert.equal(card.id, 'thd_x');
  assert.equal(card.owner, 'Owner');
  assert.equal(card.events, 5);
  assert.equal(card.stage, 'in_review');
  assert.equal(card.updated_ms, Date.parse('2026-07-10T00:00:00.000Z'));
});

test('computeTiming flags an overdue in-review thread past OVERDUE_DAYS', () => {
  const now = Date.parse('2026-07-20T00:00:00.000Z');
  const old = Date.parse('2026-07-01T00:00:00.000Z'); // 19 days
  assert.equal(computeTiming('in_review', old, now).overdue, true);
  assert.equal(computeTiming('decided', old, now).overdue, false); // only in_review is "overdue"
  assert.equal(computeTiming('in_review', now, now).overdue, false);
  assert.equal(computeTiming('in_review', 0, now).staleness_days, null);
  assert.ok(OVERDUE_DAYS === 7);
});

test('deriveAttention lists every tripped trigger in rank order', () => {
  assert.deepEqual(deriveAttention({ stage: 'in_review', open_objections: 2, overdue: true, claims_grounded: 0, outstanding_conditions: 0, re_review: false }),
    ['contested', 'overdue', 'unevidenced']);
  assert.deepEqual(deriveAttention({ stage: 'decided_with_conditions', open_objections: 0, overdue: false, claims_grounded: 1, outstanding_conditions: 3, re_review: false }),
    ['with_conditions']);
  assert.deepEqual(deriveAttention({ stage: 'active', open_objections: 0, overdue: false, claims_grounded: 1, outstanding_conditions: 0, re_review: false }), []);
});

test('assemblePortfolio adds timing + attention and summarizes', () => {
  const now = Date.parse('2026-07-20T00:00:00.000Z');
  const rows = [
    { id: 'a', stage: 'in_review', status: 'review', updated_ms: Date.parse('2026-07-01T00:00:00.000Z'), open_objections: 1, claims_grounded: 0, outstanding_conditions: 0, re_review: 0, chain_valid: 1 },
    { id: 'b', stage: 'decided', status: 'decided', updated_ms: now, open_objections: 0, claims_grounded: 2, outstanding_conditions: 0, re_review: 0, chain_valid: 1 },
  ];
  const { summary, threads } = assemblePortfolio(rows, now);
  assert.equal(summary.total, 2);
  assert.equal(summary.byStage.in_review, 1);
  assert.equal(summary.byStage.decided, 1);
  assert.equal(summary.attention.contested, 1);
  assert.equal(summary.attention.overdue, 1);   // 'a' is 19 days old in review
  assert.equal(summary.allChainValid, true);
  assert.ok(threads[0].attention.includes('contested'));
  assert.equal(threads[0].chain_valid, true);    // 1 → true
});
