// In-runtime tests for the approve-as-objection triage path (follow-up recorded
// on #20's closure): a public contribution that MATERIALLY CONTRADICTS a thread
// can be approved as an ObjectionRaised instead of an EvidenceCommitted — so an
// outside contradiction of a DECIDED thread trips the re-review loop with a
// human (the triaging owner, who vouches) in the loop, and the owner is
// notified through the same seam as a direct post-decision objection.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const ACTOR = 'par_troylati'; // dev human → creator → decision owner → triager

const iso = () => new Date().toISOString();
const post = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, { method: 'POST', headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const get = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const publicPost = (body) =>
  SELF.fetch(`${ORIGIN}/api/intake/submit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const append = (id, event) => post(`/api/threads/${id}/append`, { event });

// Drive a thread from creation through a recorded decision (the canonical path
// shared with re-review-trigger.test.js). Returns the thread id.
async function decideThread(question) {
  const id = (await (await post('/api/threads', { question })).json()).id;
  await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: 'clm_io', object: 'claim', threadId: id, text: 'The claim grounding the intake-objection decision.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });
  await append(id, { event_type: 'EvidenceCommitted', payload: { evidence: { id: 'evd_io', object: 'evidence', threadId: id, source: 'test harness', finding: 'Grounding evidence for the intake-objection decision.', confidence: 0.9, committedByParticipantId: ACTOR, committedAt: iso() } } });
  await append(id, { event_type: 'AssumptionDeclared', payload: { assumption: { id: 'asm_io', object: 'assumption', threadId: id, text: 'The grounding holds for the duration of the decision.', status: 'active', confidence: 0.75, declaredByParticipantId: ACTOR, declaredAt: iso() } } });
  await append(id, { event_type: 'DecisionRequestOpened', payload: { decisionRequest: { id: 'drq_io', object: 'decisionRequest', threadId: id, proposal: 'Adopt the flow as decided.', status: 'review', supportingClaimIds: ['clm_io'], supportingEvidenceIds: ['evd_io'], supportingAssumptionIds: ['asm_io'], objectionIds: [], openedByParticipantId: ACTOR, openedAt: iso() } } });
  await append(id, { event_type: 'ReviewSubmitted', payload: { review: { id: 'rev_io', object: 'review', threadId: id, decisionRequestId: 'drq_io', reviewerParticipantId: ACTOR, status: 'approve_with_conditions', conditions: [], comment: 'approve', reviewedAt: iso() } } });
  const merge = await append(id, { event_type: 'DecisionMerged', payload: { decisionRecord: { id: 'dcr_io', object: 'decisionRecord', threadId: id, decisionRequestId: 'drq_io', status: 'approved', summary: 'The flow is adopted and projects to decided.', rationale: 'evidence and review support it', conditions: [], supportingClaimIds: ['clm_io'], supportingEvidenceIds: ['evd_io'], supportingAssumptionIds: ['asm_io'], objectionIds: [], reviewIds: ['rev_io'], decidedByParticipantId: ACTOR, decidedAt: iso() } } });
  expect((await merge.json()).ok).toBe(true);
  return id;
}

describe('intake approve-as-objection', () => {
  it('a public contradiction of a DECIDED thread, approved as objection, trips re-review and notifies the owner', async () => {
    const id = await decideThread('Can an outside contradiction re-open a decided thread via triage?');

    const sub = await publicPost({
      kind: 'contribution',
      targetThreadId: id,
      body: 'Field data from our deployment contradicts the basis of this decision.',
      handle: 'outside@elsewhere.test',
    });
    expect(sub.status).toBe(200);
    const receipt = (await sub.json()).receipt;

    const approve = await post(`/api/intake/${receipt}/approve`, { as: 'objection' });
    expect(approve.status).toBe(200);
    const body = await approve.json();
    expect(body.status).toBe('approved');
    expect(body.id).toBe(id);
    expect(body.objection).toBe(true);
    // The objection landed on a decided thread → the DO minted the companion
    // ReviewTriggered, and the notify targeted the current decision owner.
    expect(body.reReview).toBe(true);
    expect(body.reReviewNotify.ownerId).toBe(ACTOR);
    expect(body.reReviewNotify.emailed).toBe(false); // no send_email binding in tests

    const state = await (await get(`/api/threads/${id}/state`)).json();
    expect(state.thread.status).toBe('re-review');
    // The objection carries the vouched provenance; the decision snapshot is untouched.
    expect(JSON.stringify(state)).toContain(`public submission ${receipt}`);
    expect(state.decisionStatus.decisionRecord.id).toBe('dcr_io');

    const v = await (await get(`/api/threads/${id}/validate`)).json();
    expect(v.integrity.valid).toBe(true);
    expect(v.validation.valid).toBe(true);
  });

  it('approving as objection on an UNDECIDED thread appends the objection without a re-review trigger', async () => {
    const id = (await (await post('/api/threads', { question: 'A target thread for a pre-decision objection contribution' })).json()).id;
    const sub = await publicPost({
      kind: 'contribution',
      targetThreadId: id,
      body: 'An outside reviewer disputes the framing of this question.',
    });
    const receipt = (await sub.json()).receipt;

    const approve = await post(`/api/intake/${receipt}/approve`, { as: 'objection' });
    expect(approve.status).toBe(200);
    const body = await approve.json();
    expect(body.objection).toBe(true);
    expect(body.reReview).toBe(false);
    expect(body.reReviewNotify).toBe(null);

    const state = await (await get(`/api/threads/${id}/state`)).json();
    expect(state.thread.status).not.toBe('re-review');
    expect((state.reasoningState.objections || []).length).toBe(1);
  });

  it('approve as objection is refused for kinds that mint a new thread (422)', async () => {
    const sub = await publicPost({
      kind: 'decision',
      question: 'Should this proposal be rejected as an objection target?',
      handle: 'outside@elsewhere.test',
    });
    const receipt = (await sub.json()).receipt;
    const approve = await post(`/api/intake/${receipt}/approve`, { as: 'objection' });
    expect(approve.status).toBe(422);
    // The item is still pending — a refused approve consumes nothing.
    const list = await (await get('/api/intake')).json();
    expect(list.intake.some((i) => i.id === receipt)).toBe(true);
  });
});
