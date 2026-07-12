const { readEvents, createEvent, appendEvent, newId } = require("./events");
const { prepareEventForAppend } = require("./integrity");
const { validateEvents } = require("./validator");

function structuralErrors(decisionRequest) {
  const reasons = [];
  if (!decisionRequest.supportingEvidenceIds || decisionRequest.supportingEvidenceIds.length === 0) {
    reasons.push("propose_decision requires at least one supportingEvidenceIds pointer");
  }
  if (!decisionRequest.supportingAssumptionIds || decisionRequest.supportingAssumptionIds.length === 0) {
    reasons.push("propose_decision requires at least one supportingAssumptionIds pointer");
  }
  return reasons.map((reason) => ({ event_id: null, event_type: "DecisionRequestOpened", reason }));
}

// DR-2026-07-12-silent-action-prohibition: a gate that refuses an append has
// shaped the output — the record that isn't there — so the refusal itself is
// witnessed by a GateRejectionRecorded event, appended through the same
// validate-the-chained-candidate path as anything else. The rejected candidate
// is committed to by content hash, never embedded. If the witness event itself
// cannot validate (empty log, undeclared writer, already-broken log), the gate
// appends nothing and reports the rejection as unwitnessed — it never corrupts
// the log in order to witness a refusal. That residual boundary is on record
// in the DR, not hidden.
function witnessRejection({ threadId, actorId, gate, candidateEventType, candidateContentHash, errors }, cwd) {
  const existing = readEvents(cwd);
  const rejection = {
    id: newId("grj", gate),
    object: "gateRejection",
    threadId,
    gate,
    candidateEventType,
    reasons: (errors || []).map((e) => ({ reason: e.reason })).filter((r) => r.reason),
    rejectedByParticipantId: actorId,
    rejectedAt: new Date().toISOString()
  };
  if (candidateContentHash) {
    rejection.candidateContentHash = candidateContentHash;
  }
  const draft = createEvent({
    type: "GateRejectionRecorded",
    threadId,
    actorId,
    payload: { gateRejection: rejection }
  });
  const previousHash = existing.length ? existing[existing.length - 1].content_hash : undefined;
  const prepared = prepareEventForAppend(draft, previousHash);
  const result = validateEvents(existing.concat([prepared]));
  if (!result.valid) {
    return null;
  }
  appendEvent(draft, cwd);
  return draft;
}

function proposeDecision(decisionRequest, cwd) {
  const actorId = decisionRequest.openedByParticipantId;
  const missingSlots = structuralErrors(decisionRequest);
  if (missingSlots.length) {
    // Structural refusals never prepare a candidate, so there is no
    // candidateContentHash to commit to — the witness carries type + reasons.
    const rejectionEvent = witnessRejection(
      {
        threadId: decisionRequest.threadId,
        actorId,
        gate: "decision_propose",
        candidateEventType: "DecisionRequestOpened",
        errors: missingSlots
      },
      cwd
    );
    return { valid: false, errors: missingSlots, rejectionEvent, rejectionWitnessed: Boolean(rejectionEvent) };
  }

  const existing = readEvents(cwd);
  const priorResult = validateEvents(existing);
  if (!priorResult.valid) {
    // No witness here: the gate refuses to build on a log the engine has
    // already declared invalid — even a rejection record would extend a
    // broken chain. The unwitnessed refusal is disclosed in the return.
    return {
      valid: false,
      errors: priorResult.errors,
      rejectionWitnessed: false,
      note: "the thread's existing event log is already invalid, independent of this proposal -- nothing new was appended"
    };
  }

  const draft = createEvent({
    type: "DecisionRequestOpened",
    threadId: decisionRequest.threadId,
    actorId,
    payload: { decisionRequest }
  });
  const previousHash = existing.length ? existing[existing.length - 1].content_hash : undefined;
  const prepared = prepareEventForAppend(draft, previousHash);
  const candidate = existing.concat([prepared]);
  const result = validateEvents(candidate);

  if (!result.valid) {
    const ownErrors = result.errors.filter((e) => e.event_id === prepared.event_id);
    const errors = ownErrors.length ? ownErrors : result.errors;
    const rejectionEvent = witnessRejection(
      {
        threadId: decisionRequest.threadId,
        actorId,
        gate: "decision_propose",
        candidateEventType: "DecisionRequestOpened",
        candidateContentHash: prepared.content_hash,
        errors
      },
      cwd
    );
    return { valid: false, errors, rejectionEvent, rejectionWitnessed: Boolean(rejectionEvent) };
  }

  appendEvent(draft, cwd);
  return { valid: true, errors: [], decisionRequest, event: prepared };
}

module.exports = { proposeDecision, witnessRejection };
