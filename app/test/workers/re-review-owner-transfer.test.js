// In-runtime test for issue #21: the re-review notify targets the CURRENT
// decision-owner authority holder, not the frozen decisionRecord
// .decidedByParticipantId. Transfers ownership on a decided thread via
// ParticipantAuthorityGranted + ParticipantAuthorityRevoked, then lands a
// post-decision objection and asserts the notify resolved the NEW owner. Also
// proves participant.email capture: the creator's identity email rides on the
// genesis ParticipantDeclared into the hash-chained log.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const ACTOR = 'par_troylati'; // dev human → thread creator → initial decision owner
const NEW_OWNER = 'par_new_owner';

const iso = () => new Date().toISOString();
const post = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, { method: 'POST', headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const get = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const append = (id, event) => post(`/api/threads/${id}/append`, { event });
const expectOk = async (res) => {
  const body = await res.json();
  if (!body.ok) console.log('APPEND REJECTED:', JSON.stringify(body.reasons || body, null, 1));
  expect(body.ok).toBe(true);
  return body;
};

// Drive a thread from creation through a recorded decision (same canonical
// path as re-review-trigger.test.js). Returns the ids.
async function decideThread(question) {
  const id = (await (await post('/api/threads', { question })).json()).id;
  const claimId = 'clm_ot';
  await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: claimId, object: 'claim', threadId: id, text: 'The claim grounding the transfer decision.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });
  await append(id, { event_type: 'EvidenceCommitted', payload: { evidence: { id: 'evd_ot', object: 'evidence', threadId: id, source: 'test harness', finding: 'Grounding evidence for the transfer decision.', confidence: 0.9, committedByParticipantId: ACTOR, committedAt: iso() } } });
  await append(id, { event_type: 'AssumptionDeclared', payload: { assumption: { id: 'asm_ot', object: 'assumption', threadId: id, text: 'The grounding holds for the duration of the decision.', status: 'active', confidence: 0.75, declaredByParticipantId: ACTOR, declaredAt: iso() } } });
  await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: 'drq_ot', object: 'decisionRequest', threadId: id, proposal: 'Adopt the flow as decided.', status: 'review', supportingClaimIds: [claimId], supportingEvidenceIds: ['evd_ot'], supportingAssumptionIds: ['asm_ot'], objectionIds: [], openedByParticipantId: ACTOR, openedAt: iso() } } });
  await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: 'rev_ot', object: 'review', threadId: id, decisionRequestId: 'drq_ot', reviewerParticipantId: ACTOR, status: 'approve_with_conditions', conditions: [], comment: 'approve', reviewedAt: iso() } } });
  const merge = await append(id, { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_ot', object: 'decisionRecord', threadId: id, decisionRequestId: 'drq_ot', status: 'approved', summary: 'The flow is adopted and projects to decided.', rationale: 'evidence and review support it', conditions: [], supportingClaimIds: [claimId], supportingEvidenceIds: ['evd_ot'], supportingAssumptionIds: ['asm_ot'], objectionIds: [], reviewIds: ['rev_ot'], decidedByParticipantId: ACTOR, decidedAt: iso() } } });
  await expectOk(merge);
  return { id, claimId };
}

describe('re-review notify after an owner transfer (issue #21)', () => {
  it('resolves the CURRENT decision owner, and the genesis participant carries the identity email', async () => {
    const { id, claimId } = await decideThread('Does the re-review notify follow a decision-owner transfer?');

    // participant.email capture: the creator's Access/dev email is on the
    // genesis ParticipantDeclared, preserved through projection.
    const before = await (await get(`/api/threads/${id}/state`)).json();
    expect(before.thread.status).toBe('decided');
    const creator = (before.identityState.participants || []).find((p) => p.id === ACTOR);
    expect(creator.email).toBe(EMAIL);

    // Transfer ownership: declare the new participant, grant them
    // decision_owner on this thread, revoke the creator's grant (which the
    // genesis 'decision owner' role minted at thread scope).
    await expectOk(await append(id, {
      event_type: 'ParticipantDeclared',
      payload: { participant: { id: NEW_OWNER, object: 'participant', kind: 'human', name: 'New Owner', email: 'new-owner@example.com', role: 'contributor' } },
    }));
    await expectOk(await append(id, {
      event_type: 'ParticipantAuthorityGranted',
      payload: { participantAuthority: { id: 'auth_ot_1', object: 'participantAuthority', participantId: NEW_OWNER, authority: 'decision_owner', scope: 'thread', threadId: id, grantedBy: ACTOR, grantedAt: iso() } },
    }));
    await expectOk(await append(id, {
      event_type: 'ParticipantAuthorityRevoked',
      payload: { participantAuthorityRevocation: { id: 'rev_ot_1', object: 'participantAuthorityRevocation', participantId: ACTOR, authority: 'decision_owner', scope: 'thread', threadId: id, revokedBy: ACTOR, revokedAt: iso() } },
    }));

    // Post-decision objection → trigger fires, and the notify targets the NEW
    // owner (current authority holder), not the frozen decidedByParticipantId.
    const res = await expectOk(await append(id, {
      event_type: 'ObjectionRaised',
      payload: { objection: { id: 'obj_ot_1', object: 'objection', threadId: id, participantId: ACTOR, targetObjectId: claimId, targetObjectType: 'claim', text: 'New evidence contradicts the basis of this decision.', status: 'open', raisedAt: iso() } },
    }));
    expect(res.reReviewTriggered).toBe(true);
    expect(res.reviewTrigger.decisionRecordId).toBe('dcr_ot');
    expect(res.reReviewNotify.ownerId).toBe(NEW_OWNER);
    // No send_email binding in the test env → the alert is skipped, not errored.
    expect(res.reReviewNotify.emailed).toBe(false);

    const after = await (await get(`/api/threads/${id}/state`)).json();
    expect(after.thread.status).toBe('re-review');
    // The frozen decision snapshot still names the original decider.
    expect(after.decisionStatus.decisionRecord.decidedByParticipantId).toBe(ACTOR);

    // The whole chain (incl. transfer events + auto trigger) still validates.
    const v = await (await get(`/api/threads/${id}/validate`)).json();
    expect(v.integrity.valid).toBe(true);
    expect(v.validation.valid).toBe(true);
  });
});
