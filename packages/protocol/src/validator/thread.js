const { isKnownEventType, primaryObject } = require("../event-types");
const { HASH_PATTERN } = require("../integrity");
const { unique } = require("../utils");
const {
  addError,
  isDecisionOwner,
  validateIdsExist,
  validateThreadObject
} = require("./shared");

function validateThreadCreated(event, state) {
  const thread = event.payload.thread;
  if (!thread?.id) {
    addError(state, event, "ThreadCreated payload missing thread.id");
    return;
  }
  if (thread.id !== event.thread_id) {
    addError(state, event, "thread.id must match event thread_id");
  }
  for (const participantId of thread.participantIds || []) {
    if (!state.participants.has(participantId)) {
      addError(state, event, `thread references unknown participant ${participantId}`);
    }
  }
  state.threads.set(thread.id, thread);
}

function validateThreadForked(event, index, state) {
  const fork = event.payload.threadFork;
  if (!fork?.forkThreadId) {
    addError(state, event, "ThreadForked payload missing threadFork.forkThreadId");
    return;
  }
  if (fork.forkThreadId !== event.thread_id) {
    addError(state, event, "forkThreadId must match event thread_id");
  }
  if (state.threads.has(fork.forkThreadId) || state.forks.has(fork.forkThreadId)) {
    addError(state, event, `forkThreadId is not unique: ${fork.forkThreadId}`);
  }
  const parent = state.threads.get(fork.parentThreadId);
  if (!parent) {
    addError(state, event, `fork references unknown parent thread ${fork.parentThreadId}`);
  }
  if (!state.participants.has(fork.forkedBy)) {
    addError(state, event, `fork references unknown participant ${fork.forkedBy}`);
  }

  const boundaryIndex = state.allEventIndexById.get(fork.inheritedThroughEventId);
  const inheritedEvent = state.processedEventsById.get(fork.inheritedThroughEventId);
  if (boundaryIndex === undefined) {
    addError(state, event, `fork inheritedThroughEventId does not exist: ${fork.inheritedThroughEventId}`);
  } else if (boundaryIndex >= index) {
    addError(state, event, `fork cannot inherit from future event ${fork.inheritedThroughEventId}`);
  } else if (!inheritedEvent) {
    addError(state, event, `fork inheritedThroughEventId was not processed: ${fork.inheritedThroughEventId}`);
  } else if (!eventBelongsToThread(inheritedEvent, fork.parentThreadId)) {
    addError(state, event, `fork inheritedThroughEventId is not in parent thread ${fork.parentThreadId}`);
  }

  validateIdsBelongToThread(event, state, fork.changedAssumptionIds, state.assumptions, "assumption", fork.parentThreadId);
  validateIdsBelongToThread(event, state, fork.changedClaimIds, state.claims, "claim", fork.parentThreadId);
  const inheritedObjectIds = collectInheritedObjectIdsThroughBoundary(
    state.events,
    fork.parentThreadId,
    fork.inheritedThroughEventId
  );
  validateIdsInheritedThroughBoundary(
    event,
    state,
    fork.changedAssumptionIds,
    state.assumptions,
    inheritedObjectIds,
    "assumption",
    fork.inheritedThroughEventId
  );
  validateIdsInheritedThroughBoundary(
    event,
    state,
    fork.changedClaimIds,
    state.claims,
    inheritedObjectIds,
    "claim",
    fork.inheritedThroughEventId
  );

  const thread = {
    id: fork.forkThreadId,
    object: "thread",
    title: fork.forkTitle,
    question: parent?.question || fork.forkTitle,
    status: "active",
    participantIds: unique([
      ...(parent?.participantIds || []),
      fork.forkedBy
    ]),
    parentThreadId: fork.parentThreadId,
    fork,
    createdAt: fork.forkedAt || event.timestamp,
    updatedAt: fork.forkedAt || event.timestamp
  };
  state.forks.set(fork.forkThreadId, fork);
  state.threads.set(fork.forkThreadId, thread);
  state.forkInheritedObjectIds.set(fork.forkThreadId, inheritedObjectIds);
}

function validateCrossThreadEvidence(event, state) {
  const cte = event.payload.crossThreadEvidence;
  if (!cte?.id) {
    addError(state, event, "CrossThreadEvidence payload missing crossThreadEvidence.id");
    return;
  }
  if (!cte.sourceThreadId) {
    addError(state, event, "CrossThreadEvidence missing sourceThreadId");
  }
  if (!cte.sourceDecisionRecordId) {
    addError(state, event, "CrossThreadEvidence missing sourceDecisionRecordId");
  }
  if (!cte.sourceEventHash) {
    addError(state, event, "CrossThreadEvidence missing sourceEventHash");
  }
  if (!cte.derivation) {
    addError(state, event, "CrossThreadEvidence missing derivation");
  }
  const validDerivations = ["decision_output", "preserved_objection", "minority_report", "assumption_propagation", "evidence_propagation"];
  if (cte.derivation && !validDerivations.includes(cte.derivation)) {
    addError(state, event, `CrossThreadEvidence unsupported derivation ${cte.derivation}`);
  }
  if (!cte.finding) {
    addError(state, event, "CrossThreadEvidence missing finding");
  }
  validateThreadObject(event, cte, state, "crossThreadEvidence");
  // Require an attributed committer, matching validateEvidenceCommitted. Cross-
  // thread evidence is registered into the same state.evidence map that claims,
  // assumptions, and positions reference, so it must not enter the decision graph
  // unattributed — that would weaken the "who put this in the record" guarantee.
  if (!cte.committedByParticipantId) {
    addError(state, event, "CrossThreadEvidence missing committedByParticipantId");
  } else if (!state.participants.has(cte.committedByParticipantId)) {
    addError(state, event, `crossThreadEvidence committed by unknown participant ${cte.committedByParticipantId}`);
  }
  // Register as evidence so downstream claims, assumptions, positions can reference it
  state.evidence.set(cte.id, {
    id: cte.id,
    object: "evidence",
    threadId: cte.threadId,
    source: `CrossThread:${cte.sourceThreadId}:${cte.sourceDecisionRecordId}`,
    finding: cte.finding,
    confidence: cte.confidence,
    committedByParticipantId: cte.committedByParticipantId,
    committedAt: cte.committedAt,
    artifactIds: [],
    contentHash: cte.contentHash,
    crossThreadRef: {
      sourceThreadId: cte.sourceThreadId,
      sourceDecisionRecordId: cte.sourceDecisionRecordId,
      sourceEventHash: cte.sourceEventHash,
      derivation: cte.derivation,
    },
  });
}

// GateRejectionRecorded (DR-2026-07-12 silent-action-prohibition): a gate that
// refuses an append has shaped the output — the record that isn't there — so
// the refusal is witnessed at action time. The rejected candidate is committed
// to by content hash, never embedded: the log carries THAT a specific append
// was refused and WHY, without hosting an invalid payload. Does not register
// into any other state map.
function validateGateRejectionRecorded(event, state) {
  const rejection = event.payload.gateRejection;
  if (!rejection?.id) {
    addError(state, event, "GateRejectionRecorded payload missing gateRejection.id");
    return;
  }
  validateThreadObject(event, rejection, state, "gateRejection");
  for (const field of ["gate", "rejectedAt"]) {
    if (!rejection[field]) {
      addError(state, event, `GateRejectionRecorded missing ${field}`);
    }
  }
  if (!rejection.candidateEventType) {
    addError(state, event, "GateRejectionRecorded missing candidateEventType");
  } else if (!isKnownEventType(rejection.candidateEventType)) {
    addError(state, event, `GateRejectionRecorded unknown candidateEventType ${rejection.candidateEventType}`);
  }
  if (rejection.candidateContentHash && !HASH_PATTERN.test(rejection.candidateContentHash)) {
    addError(state, event, `GateRejectionRecorded candidateContentHash is not a sha256 hash: ${rejection.candidateContentHash}`);
  }
  if (!Array.isArray(rejection.reasons) || rejection.reasons.length === 0) {
    addError(state, event, "GateRejectionRecorded reasons must be a non-empty array");
  } else {
    rejection.reasons.forEach((entry, index) => {
      if (!entry || typeof entry.reason !== "string" || entry.reason.length === 0) {
        addError(state, event, `GateRejectionRecorded reason ${index + 1} missing text`);
      }
    });
  }
  if (!rejection.rejectedByParticipantId) {
    addError(state, event, "GateRejectionRecorded missing rejectedByParticipantId");
  } else if (!state.participants.has(rejection.rejectedByParticipantId)) {
    addError(state, event, `gateRejection recorded by unknown participant ${rejection.rejectedByParticipantId}`);
  }
}

// PrecedentReference (DR-2026-07-12 precedent-as-citation): a witnessed reuse
// of a prior conclusion. The HOLDING travels as a tagged citation — source
// thread/event hash, live + source context hashes, precedent date, regrounding
// mode. The rationale does NOT travel: the shape has no rationale field, and a
// payload that smuggles one in is rejected outright — rationale transplant is
// unrepresentable, not discouraged. Like SealedReport, this does NOT register
// into state.evidence: a reused conclusion that also serves as evidence
// crosses via CrossThreadEvidence; neither event substitutes for the other.
function validatePrecedentReference(event, state) {
  const ref = event.payload.precedentReference;
  if (!ref?.id) {
    addError(state, event, "PrecedentReference payload missing precedentReference.id");
    return;
  }
  validateThreadObject(event, ref, state, "precedentReference");
  if ("rationale" in ref || "sourceRationale" in ref) {
    addError(state, event, "PrecedentReference must not carry a rationale — cite the holding, re-ground against the live context");
  }
  for (const field of ["sourceThreadId", "holding", "precedentDate", "reusedAt"]) {
    if (!ref[field]) {
      addError(state, event, `PrecedentReference missing ${field}`);
    }
  }
  if (!ref.sourceEventHash) {
    addError(state, event, "PrecedentReference missing sourceEventHash");
  } else if (!HASH_PATTERN.test(ref.sourceEventHash)) {
    addError(state, event, `PrecedentReference sourceEventHash is not a sha256 hash: ${ref.sourceEventHash}`);
  }
  if (!ref.contextHash) {
    addError(state, event, "PrecedentReference missing contextHash");
  } else if (!HASH_PATTERN.test(ref.contextHash)) {
    addError(state, event, `PrecedentReference contextHash is not a sha256 hash: ${ref.contextHash}`);
  }
  if (ref.sourceContextHash && !HASH_PATTERN.test(ref.sourceContextHash)) {
    addError(state, event, `PrecedentReference sourceContextHash is not a sha256 hash: ${ref.sourceContextHash}`);
  }
  if (!ref.regrounding) {
    addError(state, event, "PrecedentReference missing regrounding");
  } else if (!["fresh", "templated_precedent"].includes(ref.regrounding)) {
    addError(state, event, `PrecedentReference unsupported regrounding ${ref.regrounding}`);
  }
  if (!ref.reusedByParticipantId) {
    addError(state, event, "PrecedentReference missing reusedByParticipantId");
  } else if (!state.participants.has(ref.reusedByParticipantId)) {
    addError(state, event, `precedentReference reused by unknown participant ${ref.reusedByParticipantId}`);
  }
  // Precedent age is reusedAt − precedentDate, derivable mechanically; it is
  // never stored. The one thing to enforce is that it is non-negative.
  if (ref.precedentDate && ref.reusedAt) {
    const precedentDate = Date.parse(ref.precedentDate);
    const reusedAt = Date.parse(ref.reusedAt);
    if (!Number.isNaN(precedentDate) && !Number.isNaN(reusedAt) && reusedAt < precedentDate) {
      addError(state, event, `PrecedentReference reusedAt precedes precedentDate (${ref.reusedAt} < ${ref.precedentDate})`);
    }
  }
}

// SealedReport (DR-2026-07-12 claim-citation events): an ordered claim list,
// every claim citing content_hashes of EARLIER events in the SAME thread.
// The report does NOT register into state.evidence — reports are renderings,
// never evidence; they must not re-enter the decision graph.
function validateSealedReport(event, state) {
  const report = event.payload.sealedReport;
  if (!report?.id) {
    addError(state, event, "SealedReport payload missing sealedReport.id");
    return;
  }
  validateThreadObject(event, report, state, "sealedReport");
  if (!report.renderingRuleVersion || typeof report.renderingRuleVersion !== "string") {
    addError(state, event, "SealedReport missing renderingRuleVersion");
  }
  if (!report.renderedByParticipantId) {
    addError(state, event, "SealedReport missing renderedByParticipantId");
  } else if (!state.participants.has(report.renderedByParticipantId)) {
    addError(state, event, `sealedReport rendered by unknown participant ${report.renderedByParticipantId}`);
  }
  if (!Array.isArray(report.claims) || report.claims.length === 0) {
    addError(state, event, "SealedReport claims must be a non-empty array");
    return;
  }
  // Hashes citable by this report: every already-processed event in the same
  // thread (state.events holds strictly earlier events at this point, so
  // forward and self citation are unrepresentable here by construction).
  const earlierHashes = new Set();
  for (const earlier of state.events) {
    if (earlier?.thread_id === event.thread_id && earlier.content_hash) {
      earlierHashes.add(earlier.content_hash);
    }
  }
  report.claims.forEach((claim, index) => {
    if (!claim || typeof claim.text !== "string" || claim.text.length === 0) {
      addError(state, event, `SealedReport claim ${index + 1} missing text`);
      return;
    }
    if (!Array.isArray(claim.citedEventHashes) || claim.citedEventHashes.length === 0) {
      addError(state, event, `SealedReport claim ${index + 1} has no citations`);
      return;
    }
    for (const hash of claim.citedEventHashes) {
      if (!earlierHashes.has(hash)) {
        addError(state, event, `SealedReport claim ${index + 1} cited event hash does not exist in thread: ${hash}`);
      }
    }
  });
}

function validateEvidenceCommitted(event, state) {
  const evidence = event.payload.evidence;
  if (!evidence?.id) {
    addError(state, event, "EvidenceCommitted payload missing evidence.id");
    return;
  }
  validateThreadObject(event, evidence, state, "evidence");
  if (!state.participants.has(evidence.committedByParticipantId)) {
    addError(state, event, `evidence committed by unknown participant ${evidence.committedByParticipantId}`);
  }
  state.evidence.set(evidence.id, evidence);
}

function validateAssumptionDeclared(event, state) {
  const assumption = event.payload.assumption;
  if (!assumption?.id) {
    addError(state, event, "AssumptionDeclared payload missing assumption.id");
    return;
  }
  validateThreadObject(event, assumption, state, "assumption");
  validateIdsExist(event, state, assumption.evidenceIds, state.evidence, "evidence");
  if (!state.participants.has(assumption.declaredByParticipantId)) {
    addError(state, event, `assumption declared by unknown participant ${assumption.declaredByParticipantId}`);
  }
  state.assumptions.set(assumption.id, assumption);
}

function validateClaimCreated(event, state) {
  const claim = event.payload.claim;
  if (!claim?.id) {
    addError(state, event, "ClaimCreated payload missing claim.id");
    return;
  }
  validateThreadObject(event, claim, state, "claim");
  validateIdsExist(event, state, claim.evidenceIds, state.evidence, "evidence");
  validateIdsExist(event, state, claim.contradictingEvidenceIds, state.evidence, "evidence");
  validateIdsExist(event, state, claim.assumptionIds, state.assumptions, "assumption");
  if (!state.participants.has(claim.createdByParticipantId)) {
    addError(state, event, `claim created by unknown participant ${claim.createdByParticipantId}`);
  }
  state.claims.set(claim.id, claim);
}

function validatePositionTaken(event, state) {
  const position = event.payload.position;
  if (!position?.id) {
    addError(state, event, "PositionTaken payload missing position.id");
    return;
  }
  validateThreadObject(event, position, state, "position");
  if (!state.participants.has(position.participantId)) {
    addError(state, event, `position references unknown participant ${position.participantId}`);
  }
  validateTargetExists(event, position.targetObjectType, position.targetObjectId, state);
  state.positions.set(position.id, position);
}

function validateObjectionRaised(event, state) {
  const objection = event.payload.objection;
  if (!objection?.id) {
    addError(state, event, "ObjectionRaised payload missing objection.id");
    return;
  }
  validateThreadObject(event, objection, state, "objection");
  if (!state.participants.has(objection.participantId)) {
    addError(state, event, `objection references unknown participant ${objection.participantId}`);
  }
  validateTargetExists(event, objection.targetObjectType, objection.targetObjectId, state);
  if (objection.status === "resolved") {
    validateResolution(event, objection, state);
  }
  state.objections.set(objection.id, objection);
}

function validateObjectionResolved(event, state) {
  const objectionId = event.payload.objectionId || event.payload.objection?.id;
  const resolution = event.payload.resolution || event.payload.objection?.resolution;
  const objection = state.objections.get(objectionId);

  if (!objection) {
    addError(state, event, `objection resolved before objection exists: ${objectionId}`);
    return;
  }
  if (!resolution || !String(resolution).trim()) {
    addError(state, event, `objection ${objectionId} marked resolved without resolution text`);
  }
  if (!isAuthorizedToResolve(event.actor_id, objection, state)) {
    addError(state, event, `objection ${objectionId} resolved by unauthorized actor ${event.actor_id}`);
  }
  state.objections.set(objectionId, {
    ...objection,
    status: "resolved",
    resolution
  });
}

function validateResolution(event, objection, state) {
  if (!objection.resolution || !String(objection.resolution).trim()) {
    addError(state, event, `objection ${objection.id} marked resolved without resolution text`);
  }
  if (!isAuthorizedToResolve(event.actor_id, objection, state)) {
    addError(state, event, `objection ${objection.id} resolved by unauthorized actor ${event.actor_id}`);
  }
}

function validateAlignmentCalculated(event, state) {
  const snapshot = event.payload.alignmentSnapshot;
  if (!snapshot) {
    addError(state, event, "AlignmentCalculated payload missing alignmentSnapshot");
    return;
  }
  if (!snapshot.id) {
    addError(state, event, "alignmentSnapshot missing id");
  }
  if (snapshot.object !== "alignmentSnapshot") {
    addError(state, event, 'alignmentSnapshot object must be "alignmentSnapshot"');
  }
  validateThreadObject(event, snapshot, state, "alignment snapshot");
  if (typeof snapshot.createdAt !== "string" || !snapshot.createdAt) {
    addError(state, event, "alignmentSnapshot missing createdAt");
  }
  for (const field of ["evidenceAlignment", "positionAlignment", "riskAlignment", "overallAlignment"]) {
    const value = snapshot[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      addError(state, event, `alignmentSnapshot ${field} must be a number`);
    } else if (value < 0 || value > 1) {
      addError(state, event, `alignmentSnapshot ${field} must be between 0 and 1`);
    }
  }
}

function validateTargetExists(event, targetType, targetId, state) {
  if (!targetId) {
    return;
  }
  const targetCollections = {
    thread: state.threads,
    evidence: state.evidence,
    assumption: state.assumptions,
    claim: state.claims,
    position: state.positions,
    decisionRequest: state.decisionRequests
  };
  const collection = targetCollections[targetType];
  if (!collection) {
    addError(state, event, `unsupported targetObjectType ${targetType}`);
    return;
  }
  if (!collection.has(targetId)) {
    addError(state, event, `${targetType} target does not exist: ${targetId}`);
  }
}

function validateIdsBelongToThread(event, state, ids, collection, label, threadId) {
  for (const id of ids || []) {
    const object = collection.get(id);
    if (!object) {
      addError(state, event, `${label} reference does not exist: ${id}`);
    } else if (object.threadId !== threadId) {
      addError(state, event, `${label} ${id} does not belong to parent thread ${threadId}`);
    }
  }
}

function collectInheritedObjectIdsThroughBoundary(events, parentThreadId, inheritedThroughEventId) {
  const ids = new Set();
  for (const event of events) {
    const object = primaryObject(event);
    if (object?.id && object.threadId === parentThreadId) {
      ids.add(object.id);
    }
    if (event.event_id === inheritedThroughEventId) {
      break;
    }
  }
  return ids;
}

function validateIdsInheritedThroughBoundary(event, state, ids, collection, inheritedObjectIds, label, inheritedThroughEventId) {
  for (const id of ids || []) {
    if (collection.has(id) && !inheritedObjectIds.has(id)) {
      addError(state, event, `${label} ${id} is not inherited through ${inheritedThroughEventId}`);
    }
  }
}

function eventBelongsToThread(event, threadId) {
  return event?.thread_id === threadId
    || event?.threadId === threadId
    || event?.payload?.thread?.id === threadId
    || event?.payload?.threadFork?.forkThreadId === threadId;
}

function isAuthorizedToResolve(actorId, objection, state) {
  return actorId === objection.participantId || isDecisionOwner(actorId, state, objection.threadId);
}

module.exports = {
  validateAlignmentCalculated,
  validateAssumptionDeclared,
  validateClaimCreated,
  validateCrossThreadEvidence,
  validateEvidenceCommitted,
  validateGateRejectionRecorded,
  validateObjectionRaised,
  validateObjectionResolved,
  validatePositionTaken,
  validatePrecedentReference,
  validateSealedReport,
  validateThreadCreated,
  validateThreadForked
};
