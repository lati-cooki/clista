// Proves adaptCockpit consumes the projection's `allEvidence` (v0.31.0): the
// evidence panel shows the full ledger with a `supporting` flag (membership in
// the narrowed reasoningState.evidence set), the Compose pickers offer every
// committed item, and provenance resolves evidence the current proposal
// doesn't cite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptCockpit } from '../src/adapt.js';

const cited = { id: 'evd_cited', object: 'evidence', finding: 'Cited finding', source: 'doc A', confidence: 0.9 };
const uncited = { id: 'evd_uncited', object: 'evidence', finding: 'Committed but uncited', source: 'doc B', confidence: 0.5 };

const state = {
  thread: { id: 'thd_x', question: 'Q?', status: 'decided', createdAt: '2026-06-24T00:00:00.000Z' },
  identityState: { participants: [{ id: 'par_a', name: 'Ann', role: 'decision_owner' }] },
  allEvidence: [cited, uncited],
  reasoningState: {
    // The narrowed supporting set: only what the proposal/decision cites.
    evidence: [cited],
    claims: [{ id: 'clm_1', text: 'claim', evidenceIds: ['evd_uncited'], assumptionIds: [] }],
    assumptions: [],
    objections: [],
  },
  decisionStatus: {
    decisionRecord: {
      id: 'dcr_1', decisionRequestId: 'drq_1', summary: 'yes',
      supportingClaimIds: ['clm_1'],
    },
  },
};

test('vm.evidence is the full ledger with a supporting flag', () => {
  const vm = adaptCockpit(state, { auditTrail: [] }, {});
  assert.deepEqual(vm.evidence.map((e) => e.id), ['evd_cited', 'evd_uncited']);
  assert.equal(vm.evidence.find((e) => e.id === 'evd_cited').supporting, true);
  assert.equal(vm.evidence.find((e) => e.id === 'evd_uncited').supporting, false);
});

test('compose pickers offer every committed evidence item', () => {
  const vm = adaptCockpit(state, { auditTrail: [] }, {});
  assert.deepEqual(vm.refLists.evidence.map((e) => e.id), ['evd_cited', 'evd_uncited']);
});

test('provenance resolves evidence outside the narrowed supporting set', () => {
  const vm = adaptCockpit(state, { auditTrail: [] }, {});
  const claim = vm.provenance.claims.find((c) => c.id === 'clm_1');
  assert.equal(claim.evidence[0].id, 'evd_uncited');
  assert.equal(claim.evidence[0].text, 'Committed but uncited', 'lookup must use allEvidence, not the narrowed set');
});

test('falls back to reasoningState.evidence when allEvidence is absent', () => {
  const { allEvidence, ...older } = state;
  const vm = adaptCockpit(older, { auditTrail: [] }, {});
  assert.deepEqual(vm.evidence.map((e) => e.id), ['evd_cited']);
  assert.equal(vm.evidence[0].supporting, true);
});
