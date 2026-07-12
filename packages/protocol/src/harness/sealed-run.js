// T1 harness — single-prompt sealed run (Mutual Reliance Slice 5).
//
// The smallest live-witnessed run: two writer roles — MAKER (proposes a toy
// decision) and CHECKER (challenges it) — each appending events through the
// sidecar-gate pattern under distinct writer identities, ending in a seal
// (a SealedReport whose claims cite the run's own event hashes; under hash
// v2 semantics the report's hash commits to the chain it renders).
//
// Role payloads are injected, so the same orchestration serves both variants:
//   - deterministic: scripted payloads (test/sealed-run-harness.test.js)
//   - agent:         payloads produced by live model calls
//                    (scripts/t1-agent-run.mjs)
//
// T1 pass criterion (the only one that counts): the emitted thread passes
// existing chain verification.
const { createEvent, readEvents, appendEvent, newId } = require("../events");
const { validateEvents } = require("../validator");
const { verifyEventIntegrity, prepareEventForAppend } = require("../integrity");

// The sidecar-gate pattern generalized to any event type: build the candidate,
// chain it onto the real log IN MEMORY, run the same validateEvents the
// validate command runs, and append only a known-valid event. On rejection,
// nothing is appended. (Per DR-2026-07-12-silent-action-prohibition, a silent
// rejection is a known protocol gap; this harness surfaces rejections in its
// return value and run record rather than swallowing them.)
function appendThroughGate({ type, threadId, actorId, payload }, cwd) {
  const existing = readEvents(cwd);
  const draft = createEvent({ type, threadId, actorId, payload });
  const previousHash = existing.length ? existing[existing.length - 1].content_hash : undefined;
  const prepared = prepareEventForAppend(draft, previousHash);
  const result = validateEvents(existing.concat([prepared]));
  if (!result.valid) {
    const ownErrors = result.errors.filter((e) => e.event_id === prepared.event_id);
    return { valid: false, errors: ownErrors.length ? ownErrors : result.errors, event: null };
  }
  appendEvent(draft, cwd);
  return { valid: true, errors: [], event: draft };
}

// Run the maker/checker toy decision end to end. `roles` supplies the free
// text each role contributes; everything structural is the harness's job.
//
// roles = {
//   maker:   { proposal, evidenceSource, evidenceFinding, assumption,
//              decisionSummary, decisionRationale },
//   checker: { objection, resolution, reviewNotes }
// }
function runSealedRun({ cwd, threadTitle, question, roles, now }) {
  const at = now || (() => new Date().toISOString());
  const rejections = [];
  const appended = [];

  const gate = (spec) => {
    const result = appendThroughGate(spec, cwd);
    if (!result.valid) {
      rejections.push({ type: spec.type, errors: result.errors });
      throw new SealedRunRejection(spec.type, result.errors);
    }
    appended.push(result.event);
    return result.event;
  };

  const threadId = newId("thd", "sealed_run");
  const makerId = "par_t1_maker";
  const checkerId = "par_t1_checker";

  try {
    gate({
      type: "ParticipantAdded", threadId, actorId: makerId,
      payload: { participant: { id: makerId, object: "participant", kind: "agent", name: "T1 maker", role: "maker" } }
    });
    gate({
      type: "ParticipantAdded", threadId, actorId: checkerId,
      payload: { participant: { id: checkerId, object: "participant", kind: "agent", name: "T1 checker", role: "checker" } }
    });
    const threadEvt = gate({
      type: "ThreadCreated", threadId, actorId: makerId,
      payload: {
        thread: {
          id: threadId, object: "thread", title: threadTitle, question,
          status: "active", participantIds: [makerId, checkerId],
          createdAt: at(), updatedAt: at()
        }
      }
    });
    gate({
      type: "ParticipantAuthorityGranted", threadId, actorId: makerId,
      payload: {
        participantAuthority: {
          id: newId("auth", "t1_maker_owner"), object: "participantAuthority",
          participantId: makerId, authority: "decision_owner", scope: "thread",
          threadId, grantedBy: makerId, grantedAt: at()
        }
      }
    });

    // MAKER proposes: evidence + assumption, then the decision request through
    // the same pattern the real decision gate enforces (cite or fail).
    const evidenceId = newId("evd", "t1");
    const evidenceEvt = gate({
      type: "EvidenceCommitted", threadId, actorId: makerId,
      payload: {
        evidence: {
          id: evidenceId, object: "evidence", threadId,
          source: roles.maker.evidenceSource, finding: roles.maker.evidenceFinding,
          committedByParticipantId: makerId, committedAt: at()
        }
      }
    });
    const assumptionId = newId("asm", "t1");
    gate({
      type: "AssumptionDeclared", threadId, actorId: makerId,
      payload: {
        assumption: {
          id: assumptionId, object: "assumption", threadId,
          statement: roles.maker.assumption, status: "open",
          declaredByParticipantId: makerId, declaredAt: at()
        }
      }
    });
    const claimId = newId("clm", "t1");
    const claimEvt = gate({
      type: "ClaimCreated", threadId, actorId: makerId,
      payload: {
        claim: {
          id: claimId, object: "claim", threadId,
          text: roles.maker.proposal, status: "draft",
          evidenceIds: [evidenceId], assumptionIds: [assumptionId],
          contradictingEvidenceIds: [],
          createdByParticipantId: makerId, createdAt: at()
        }
      }
    });
    const requestId = newId("drq", "t1");
    const drqEvt = gate({
      type: "DecisionRequestOpened", threadId, actorId: makerId,
      payload: {
        decisionRequest: {
          id: requestId, object: "decisionRequest", threadId,
          proposal: roles.maker.proposal, status: "review",
          supportingEvidenceIds: [evidenceId],
          supportingClaimIds: [claimId],
          supportingAssumptionIds: [assumptionId],
          objectionIds: [],
          openedByParticipantId: makerId, openedAt: at()
        }
      }
    });

    // CHECKER challenges: an objection against the request, later resolved by
    // its own author once the challenge is answered, then the review.
    const objectionId = newId("obj", "t1");
    const objectionEvt = gate({
      type: "ObjectionRaised", threadId, actorId: checkerId,
      payload: {
        objection: {
          id: objectionId, object: "objection", threadId,
          participantId: checkerId, status: "open", blocking: false,
          targetObjectType: "decisionRequest", targetObjectId: requestId,
          statement: roles.checker.objection, raisedAt: at()
        }
      }
    });
    const resolutionEvt = gate({
      type: "ObjectionResolved", threadId, actorId: checkerId,
      payload: { objectionId, resolution: roles.checker.resolution }
    });
    const reviewId = newId("rev", "t1");
    const reviewEvt = gate({
      type: "ReviewSubmitted", threadId, actorId: checkerId,
      payload: {
        review: {
          id: reviewId, object: "review", threadId,
          decisionRequestId: requestId, reviewerParticipantId: checkerId,
          status: "approve", conditions: [], notes: roles.checker.reviewNotes,
          reviewedAt: at()
        }
      }
    });

    // MAKER decides, then seals: the SealedReport's claims cite the hashes of
    // the events the run just witnessed — the report is the final event.
    const decisionId = newId("dcr", "t1");
    const decisionEvt = gate({
      type: "DecisionMerged", threadId, actorId: makerId,
      payload: {
        decisionRecord: {
          id: decisionId, object: "decisionRecord", threadId,
          decisionRequestId: requestId, decidedByParticipantId: makerId,
          status: "approved",
          summary: roles.maker.decisionSummary,
          rationale: roles.maker.decisionRationale,
          supportingEvidenceIds: [evidenceId],
          supportingClaimIds: [claimId],
          supportingAssumptionIds: [assumptionId],
          reviewIds: [reviewId],
          decidedAt: at()
        }
      }
    });
    const reportEvt = gate({
      type: "SealedReport", threadId, actorId: makerId,
      payload: {
        sealedReport: {
          id: newId("rpt", "t1"), object: "sealedReport", threadId,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: makerId, renderedAt: at(),
          claims: [
            { text: `the thread was opened on the question: ${question}`, citedEventHashes: [threadEvt.content_hash] },
            { text: `the maker committed evidence: ${roles.maker.evidenceFinding}`, citedEventHashes: [evidenceEvt.content_hash] },
            { text: `the maker proposed: ${roles.maker.proposal}`, citedEventHashes: [drqEvt.content_hash, claimEvt.content_hash] },
            { text: `the checker challenged the proposal: ${roles.checker.objection}`, citedEventHashes: [objectionEvt.content_hash] },
            { text: `the challenge was resolved: ${roles.checker.resolution}`, citedEventHashes: [resolutionEvt.content_hash, objectionEvt.content_hash] },
            { text: "the checker approved on review", citedEventHashes: [reviewEvt.content_hash] },
            { text: `the maker merged the decision: ${roles.maker.decisionSummary}`, citedEventHashes: [decisionEvt.content_hash, reviewEvt.content_hash] }
          ]
        }
      }
    });

    // T1 pass criterion: the emitted thread passes existing chain verification.
    const events = readEvents(cwd);
    const integrity = verifyEventIntegrity(events);
    const validation = validateEvents(events);
    return {
      pass: integrity.valid && validation.valid,
      threadId,
      events,
      integrity,
      validation,
      sealEventId: reportEvt.event_id,
      rejections,
      appendedCount: appended.length
    };
  } catch (error) {
    if (error instanceof SealedRunRejection) {
      const events = readEvents(cwd);
      return {
        pass: false,
        threadId,
        events,
        integrity: verifyEventIntegrity(events),
        validation: validateEvents(events),
        sealEventId: null,
        rejections,
        appendedCount: appended.length
      };
    }
    throw error;
  }
}

class SealedRunRejection extends Error {
  constructor(type, errors) {
    super(`gate rejected ${type}: ${errors.map((e) => e.reason).join("; ")}`);
    this.name = "SealedRunRejection";
    this.eventType = type;
    this.gateErrors = errors;
  }
}

module.exports = { appendThroughGate, runSealedRun, SealedRunRejection };
