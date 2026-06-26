// In-runtime test for the re-review loop: a post-decision objection on a
// DECIDED thread auto-emits a companion ReviewTriggered (inside ThreadDO.append),
// flips the thread to 're-review' WITHOUT mutating the frozen decision snapshot,
// and notifies the owner. Proves the finance model-risk "monitoring breach →
// re-validate" loop end-to-end through the real Worker, and that a decided
// thread can be superseded by a new decision cycle from re-review.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const ACTOR = 'par_troylati'; // dev human → thread creator → decision owner

const iso = () => new Date().toISOString();
const post = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, { method: 'POST', headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const get = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const append = (id, event) => post(`/api/threads/${id}/append`, { event });

// Drive a thread from creation through a recorded decision. Returns the ids.
async function decideThread(question) {
  const id = (await (await post('/api/threads', { question })).json()).id;
  const claimId = 'clm_rr';
  await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: claimId, object: 'claim', threadId: id, text: 'The claim grounding the re-review decision.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });
  const evdId = 'evd_rr';
  await append(id, { event_type: 'EvidenceCommitted', payload: { evidence: { id: evdId, object: 'evidence', threadId: id, source: 'test harness', finding: 'Grounding evidence for the re-review decision.', confidence: 0.9, committedByParticipantId: ACTOR, committedAt: iso() } } });
  const asmId = 'asm_rr';
  await append(id, { event_type: 'AssumptionDeclared', payload: { assumption: { id: asmId, object: 'assumption', threadId: id, text: 'The grounding holds for the duration of the decision.', status: 'active', confidence: 0.75, declaredByParticipantId: ACTOR, declaredAt: iso() } } });
  const drqId = 'drq_rr';
  await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: drqId, object: 'decisionRequest', threadId: id, proposal: 'Adopt the flow as decided.', status: 'review', supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: [], openedByParticipantId: ACTOR, openedAt: iso() } } });
  await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: 'rev_rr', object: 'review', threadId: id, decisionRequestId: drqId, reviewerParticipantId: ACTOR, status: 'approve_with_conditions', conditions: [], comment: 'approve', reviewedAt: iso() } } });
  const merge = await append(id, { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_rr', object: 'decisionRecord', threadId: id, decisionRequestId: drqId, status: 'approved', summary: 'The flow is adopted and projects to decided.', rationale: 'evidence and review support it', conditions: [], supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: [], reviewIds: ['rev_rr'], decidedByParticipantId: ACTOR, decidedAt: iso() } } });
  expect((await merge.json()).ok).toBe(true);
  return { id, claimId, evdId, asmId, drqId };
}

const objection = (id, oid, target) => ({
  event_type: 'ObjectionRaised',
  payload: { objection: { id: oid, object: 'objection', threadId: id, participantId: ACTOR, targetObjectId: target, targetObjectType: 'claim', text: 'New evidence contradicts the basis of this decision.', status: 'open', raisedAt: iso() } },
});

describe('re-review trigger: post-decision objection flags a decided thread', () => {
  it('auto-emits ReviewTriggered, flips to re-review, freezes the snapshot, idempotent', async () => {
    const { id, claimId, evdId } = await decideThread('Does a post-decision objection flip a decided thread to re-review?');

    // Snapshot before the objection: decided, with the frozen supporting evidence.
    const before = await (await get(`/api/threads/${id}/state`)).json();
    expect(before.thread.status).toBe('decided');
    const frozenEvidenceIds = (before.reasoningState.evidence || []).map((e) => e.id);
    expect(frozenEvidenceIds).toEqual([evdId]);

    // Post-decision objection → server auto-emits the companion ReviewTriggered.
    const res = await (await append(id, objection(id, 'obj_rr_1', claimId))).json();
    expect(res.ok).toBe(true);
    expect(res.reReviewTriggered).toBe(true);
    expect(res.reviewTrigger.triggeringObjectionId).toBe('obj_rr_1');
    expect(res.reviewTrigger.decisionRecordId).toBe('dcr_rr');
    expect(res.reviewTrigger.triggeredByParticipantId).toBe(ACTOR);
    // Two events stored for one append: the objection + the trigger.
    expect(res.events.length).toBe(2);

    // Thread flipped to re-review; the decision record is UNCHANGED (in force).
    const after = await (await get(`/api/threads/${id}/state`)).json();
    expect(after.thread.status).toBe('re-review');
    expect(after.decisionStatus.decisionRecord.id).toBe('dcr_rr');
    expect(after.decisionStatus.decisionRecord.summary).toBe(before.decisionStatus.decisionRecord.summary);
    // The evidence snapshot stays frozen to what the decision was made on.
    expect((after.reasoningState.evidence || []).map((e) => e.id)).toEqual(frozenEvidenceIds);

    // The decision summary view agrees with the real status.
    const sum = await (await get(`/api/threads/${id}/summary`)).json();
    expect(sum.status).toBe('re-review');

    // A SECOND post-decision objection does NOT emit another trigger (one per
    // decision epoch) — it just accrues. Status stays re-review.
    const res2 = await (await append(id, objection(id, 'obj_rr_2', claimId))).json();
    expect(res2.ok).toBe(true);
    expect(res2.reReviewTriggered).toBeFalsy();
    expect(res2.events.length).toBe(1);
    const after2 = await (await get(`/api/threads/${id}/state`)).json();
    expect(after2.thread.status).toBe('re-review');

    // Chain still validates (integrity + structural), incl. the auto-emitted event.
    const v = await (await get(`/api/threads/${id}/validate`)).json();
    expect(v.integrity.valid).toBe(true);
    expect(v.validation.valid).toBe(true);

    // Deterministic: a second projection reads the same status.
    const again = await (await get(`/api/threads/${id}/state`)).json();
    expect(again.thread.status).toBe('re-review');
  });

  it('re-review → review → decided: owner supersedes the flagged decision', async () => {
    const { id, claimId, evdId, asmId } = await decideThread('Can the owner supersede a re-review decision?');
    await append(id, objection(id, 'obj_sup', claimId));
    expect((await (await get(`/api/threads/${id}/state`)).json()).thread.status).toBe('re-review');

    // Owner addresses the concern: resolves the objection that triggered the
    // re-review, then opens a NEW decision request — moves re-review → review.
    await append(id, { event_type: 'ObjectionResolved', payload: { objectionId: 'obj_sup', resolution: 'New evidence reviewed; the original basis still holds.' } });
    await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: 'drq_rr2', object: 'decisionRequest', threadId: id, proposal: 'Re-affirm the decision after re-review.', status: 'review', supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: ['obj_sup'], openedByParticipantId: ACTOR, openedAt: iso() } } });
    expect((await (await get(`/api/threads/${id}/state`)).json()).thread.status).toBe('review');

    await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: 'rev_rr2', object: 'review', threadId: id, decisionRequestId: 'drq_rr2', reviewerParticipantId: ACTOR, status: 'approve_with_conditions', conditions: [], comment: 'reaffirm', reviewedAt: iso() } } });
    const merge2 = await append(id, { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_rr2', object: 'decisionRecord', threadId: id, decisionRequestId: 'drq_rr2', status: 'approved', summary: 'Decision re-affirmed after re-review; the objection was resolved.', rationale: 'objection reviewed and resolved', conditions: [], supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: ['obj_sup'], reviewIds: ['rev_rr2'], decidedByParticipantId: ACTOR, decidedAt: iso() } } });
    const mj2 = await merge2.json();
    if (!mj2.ok) console.log('SUPERSEDE MERGE REJECTED:', JSON.stringify(mj2.reasons || mj2, null, 1));
    expect(mj2.ok).toBe(true);

    const st = await (await get(`/api/threads/${id}/state`)).json();
    expect(st.thread.status).toBe('decided');
    // The newest decision is in force.
    expect(st.decisionStatus.decisionRecord.id).toBe('dcr_rr2');
  });

  it('a malformed ReviewTriggered is rejected fail-closed (422)', async () => {
    const { id } = await decideThread('Does the validator reject a bogus ReviewTriggered?');
    // References a decision/objection that do not exist → fail closed.
    const bad = await append(id, { event_type: 'ReviewTriggered', payload: { reviewTrigger: { id: 'rvt_bad', object: 'reviewTrigger', threadId: id, decisionRecordId: 'dcr_nope', triggeringObjectionId: 'obj_nope', reason: 'post_decision_objection', triggeredByParticipantId: ACTOR, triggeredAt: iso() } } });
    expect(bad.status).toBe(422);
    // The thread is untouched (still decided, not re-review).
    const st = await (await get(`/api/threads/${id}/state`)).json();
    expect(st.thread.status).toBe('decided');
  });
});
