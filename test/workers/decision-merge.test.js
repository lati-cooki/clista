// In-runtime test for the decision-owner merge path the cockpit's "Record the
// decision" affordance drives: a staged proposal (DecisionRequestOpened +
// ReviewSubmitted) is merged by the thread's decision owner into a DecisionMerged,
// and the thread projects to `decided`. Proves the DecisionMerged event shape the
// Cockpit builds is accepted and chains, end-to-end through the real Worker.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const ACTOR = 'par_troylati'; // the dev human → thread creator → decision owner

const iso = () => new Date().toISOString();
const post = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, { method: 'POST', headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const get = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const append = (id, event) => post(`/api/threads/${id}/append`, { event });

describe('decision owner records (merges) a staged decision', () => {
  it('create → claim → evidence → DRQ → review → DecisionMerged → decided', async () => {
    const id = (await (await post('/api/threads', { question: 'Should the decision-merge flow project to decided?' })).json()).id;

    const claimId = 'clm_test_merge';
    await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: claimId, object: 'claim', threadId: id, text: 'The merge flow is mergeable end to end.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });

    const evdId = 'evd_test_merge';
    await append(id, { event_type: 'EvidenceCommitted', payload: { evidence: { id: evdId, object: 'evidence', threadId: id, source: 'test harness', finding: 'There is grounding evidence for the merge.', confidence: 0.9, committedByParticipantId: ACTOR, committedAt: iso() } } });

    const asmId = 'asm_test_merge';
    await append(id, { event_type: 'AssumptionDeclared', payload: { assumption: { id: asmId, object: 'assumption', threadId: id, text: 'The grounding holds for the duration of the decision.', status: 'active', confidence: 0.75, declaredByParticipantId: ACTOR, declaredAt: iso() } } });

    const drqId = 'drq_test_merge';
    const drq = await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: drqId, object: 'decisionRequest', threadId: id, proposal: 'Adopt the merge flow as decided.', status: 'review', supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: [], openedByParticipantId: ACTOR, openedAt: iso() } } });
    expect((await drq.json()).ok).toBe(true);

    const revId = 'rev_test_merge';
    const rev = await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: revId, object: 'review', threadId: id, decisionRequestId: drqId, reviewerParticipantId: ACTOR, status: 'approve_with_conditions', conditions: [], comment: 'approve', reviewedAt: iso() } } });
    expect((await rev.json()).ok).toBe(true);

    // The merge — the exact shape Cockpit.recordDecision() builds.
    const merge = await append(id, { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_test_merge', object: 'decisionRecord', threadId: id, decisionRequestId: drqId, status: 'approved', summary: 'The merge flow is adopted and projects to decided.', rationale: 'evidence and review support it', conditions: ['carry one condition'], supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [asmId], objectionIds: [], reviewIds: [revId], decidedByParticipantId: ACTOR, decidedAt: iso() } } });
    const mj = await merge.json();
    if (!mj.ok) console.log('MERGE REJECTED:', JSON.stringify(mj.reasons || mj, null, 1));
    expect(merge.status).toBe(200);
    expect(mj.ok).toBe(true);

    // Projects to a decided thread carrying the decision record.
    const st = await (await get(`/api/threads/${id}/state`)).json();
    expect(st.thread.status).toBe('decided');
    expect((st.decisionStatus.decisionRecord || {}).summary).toContain('adopted');

    // Chain still validates.
    const v = await (await get(`/api/threads/${id}/validate`)).json();
    expect(v.integrity.valid).toBe(true);
    expect(v.validation.valid).toBe(true);
  });

  it('a non-decision-owner (agent) cannot merge — governance fail-closed', async () => {
    const id = (await (await post('/api/threads', { question: 'Does the merge governance boundary hold for an agent?' })).json()).id;
    const claimId = 'clm_x';
    await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: claimId, object: 'claim', threadId: id, text: 'A claim to support the request.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });
    const evdId = 'evd_x';
    await append(id, { event_type: 'EvidenceCommitted', payload: { evidence: { id: evdId, object: 'evidence', threadId: id, source: 't', finding: 'Grounding evidence here.', confidence: 0.8, committedByParticipantId: ACTOR, committedAt: iso() } } });
    const drqId = 'drq_x';
    await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: drqId, object: 'decisionRequest', threadId: id, proposal: 'Adopt X.', status: 'review', supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [], objectionIds: [], openedByParticipantId: ACTOR, openedAt: iso() } } });
    await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: 'rev_x', object: 'review', threadId: id, decisionRequestId: drqId, reviewerParticipantId: ACTOR, status: 'approve', conditions: [], comment: 'ok', reviewedAt: iso() } } });

    // Agent (par_agent_…) joins, then attempts the merge → fail-closed (422).
    await SELF.fetch(`${ORIGIN}/api/threads/${id}/join`, { method: 'POST', headers: { 'x-clista-agent': 'clistahermes', 'content-type': 'application/json' }, body: '{}' });
    const merge = await SELF.fetch(`${ORIGIN}/api/threads/${id}/append`, {
      method: 'POST', headers: { 'x-clista-agent': 'clistahermes', 'content-type': 'application/json' },
      body: JSON.stringify({ event: { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_x', object: 'decisionRecord', threadId: id, decisionRequestId: drqId, status: 'approved', summary: 'Agent tries to merge this decision.', rationale: 'r', conditions: [], supportingClaimIds: [claimId], supportingEvidenceIds: [evdId], supportingAssumptionIds: [], objectionIds: [], reviewIds: ['rev_x'], decidedByParticipantId: 'par_agent_clistahermes', decidedAt: iso() } } } }),
    });
    expect(merge.status).toBe(422);

    // The thread did NOT become decided.
    const st = await (await get(`/api/threads/${id}/state`)).json();
    expect(st.thread.status).not.toBe('decided');
  });
});
