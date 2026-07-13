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
// T1 pass criteria: the emitted thread passes existing chain verification,
// full validation, and report-layer verification — chain, existence,
// coverage, and (T2b, DR-2026-07-12-curation-check) curation: no
// dissent-bearing event silently omitted from the seal. Curation joined the
// pass criteria for runs from 2026-07-12 on; earlier run artifacts are
// immutable and keep the verdicts they were measured under.
const fs = require("node:fs");
const path = require("node:path");
const { createEvent, readEvents, appendEvent, newId } = require("../events");
const { validateEvents } = require("../validator");
const { verifyEventIntegrity, prepareEventForAppend } = require("../integrity");
const { verifyReport } = require("../report");
const { witnessRejection } = require("../gate");

// --- injected signers (Phase 5 Slice 2, DR-phase5-topology rule 5.1) ---
//
// A signer is the non-custodial voice of one writer role:
//   { publicKeyHex: string, sign(hashHex: string) -> signatureHex: string }
// (per-run ed25519 keys; see scripts/run-keys.mjs for the primitive and the
// derived signature preimage — the raw 32 bytes of the hex hash, exactly
// what ThreadHub's /records/signed verifies).
//
// Signing happens AT REASONING TIME: the same gate call that appends an
// event writes its signature. Signatures live in a sidecar NDJSON next to
// the event log — NOT inside the events — so the canonical thread bytes
// (rule 2.1) are identical with or without signers, and every existing
// verifier keeps working unmodified. This mirrors ThreadHub itself, where
// the signature sits beside the envelope it signs, never inside it. The
// signature covers the event's content_hash.
//
// HONESTY BOUNDARY — what that signature holds under v1: createEvent stamps
// hash_version clista.event_hash.v1, whose hash material EXCLUDES
// previous_hash (integrity.js canonicalEventHashMaterial; verified
// empirically — recomputing the same event under a different previous_hash
// yields the same content_hash). So the sidecar signature commits to the
// event's OWN material only, not to the prefix chain the writer saw when it
// signed; chain binding lives in the unsigned previous_hash field and is
// held by chain verification, not by these signatures. Contrast gate.py,
// whose record hash material includes prev and therefore does bind the
// chain. Migrating the harness to v2 (canonicalEventHashMaterialV2 retains
// previous_hash, making each hash a rolling commitment to the prefix) is a
// future DR, not this comment's job.
const SIGNATURES_FILE = "signatures.ndjson";

function signaturesPath(cwd = process.cwd()) {
  return path.join(cwd, ".clista", SIGNATURES_FILE);
}

function recordSignature(event, signer, cwd) {
  const record = {
    schema: "clista.run_signature.v0",
    event_id: event.event_id,
    content_hash: event.content_hash,
    actor_id: event.actor_id,
    public_key: signer.publicKeyHex,
    signature: signer.sign(event.content_hash.slice(7)),
    signed_at: new Date().toISOString()
  };
  fs.appendFileSync(signaturesPath(cwd), `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

// The sidecar-gate pattern generalized to any event type: build the candidate,
// chain it onto the real log IN MEMORY, run the same validateEvents the
// validate command runs, and append only a known-valid event. On rejection the
// candidate is not appended; instead the refusal is witnessed by a
// GateRejectionRecorded event (DR-2026-07-12-silent-action-prohibition) —
// unless the witness itself cannot validate (empty log, undeclared writer),
// in which case nothing appends and rejectionEvent is null: the gate never
// corrupts the log in order to witness a refusal.
// `signer` is optional; without one, behavior is byte-identical to the
// pre-signer harness (tested in test/sealed-run-signers.test.js).
function appendThroughGate({ type, threadId, actorId, payload }, cwd, signer) {
  const existing = readEvents(cwd);
  const draft = createEvent({ type, threadId, actorId, payload });
  const previousHash = existing.length ? existing[existing.length - 1].content_hash : undefined;
  const prepared = prepareEventForAppend(draft, previousHash);
  const result = validateEvents(existing.concat([prepared]));
  if (!result.valid) {
    const ownErrors = result.errors.filter((e) => e.event_id === prepared.event_id);
    const errors = ownErrors.length ? ownErrors : result.errors;
    const rejectionEvent = witnessRejection(
      {
        threadId,
        actorId,
        gate: "append_through_gate",
        candidateEventType: type,
        candidateContentHash: prepared.content_hash,
        errors
      },
      cwd
    );
    return { valid: false, errors, event: null, rejectionEvent };
  }
  appendEvent(draft, cwd);
  // Sign at reasoning time: the append and its signature are one gate call.
  // A rejected candidate is never signed (nothing above this line appended).
  const signature = signer ? recordSignature(draft, signer, cwd) : undefined;
  return { valid: true, errors: [], event: draft, signature };
}

// Run the maker/checker toy decision end to end. `roles` supplies the free
// text each role contributes; everything structural is the harness's job.
//
// roles = {
//   maker:   { proposal, evidenceSource, evidenceFinding, assumption,
//              decisionSummary, decisionRationale },
//   checker: { objection, resolution, reviewNotes }
// }
//
// `signers` (optional) maps writer actor ids to injected signers
// ({ par_t1_maker, par_t1_checker }); each event is then signed at append
// time by its own writer's key. Absent signers, nothing changes.
function runSealedRun({ cwd, threadTitle, question, roles, now, signers }) {
  const at = now || (() => new Date().toISOString());
  const rejections = [];
  const appended = [];
  const signatures = signers ? [] : undefined;

  const gate = (spec) => {
    // Rule 5.1: every writer keyed. A provided-but-incomplete signers map is
    // misconfiguration, not a mode — throwing beats silently appending an
    // unsigned event for the forgotten writer.
    if (signers && !signers[spec.actorId]) {
      throw new Error(
        `signers map provided but has no signer for "${spec.actorId}" — ` +
        "every writer must be keyed (DR-phase5-topology rule 5.1); partial custody is misconfiguration, not a mode"
      );
    }
    const result = appendThroughGate(spec, cwd, signers?.[spec.actorId]);
    if (!result.valid) {
      rejections.push({ type: spec.type, errors: result.errors });
      throw new SealedRunRejection(spec.type, result.errors);
    }
    appended.push(result.event);
    if (result.signature) {
      signatures.push(result.signature);
    }
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

    // T1 pass criteria: chain verification, full validation, and the
    // report-layer checks (chain/existence/coverage/curation — T2b).
    const events = readEvents(cwd);
    const integrity = verifyEventIntegrity(events);
    const validation = validateEvents(events);
    const report = verifyReport(events);
    return {
      pass: integrity.valid && validation.valid && report.valid,
      threadId,
      events,
      integrity,
      validation,
      report,
      sealEventId: reportEvt.event_id,
      rejections,
      appendedCount: appended.length,
      signatures
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
        report: verifyReport(events),
        sealEventId: null,
        rejections,
        appendedCount: appended.length,
        signatures
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

module.exports = { appendThroughGate, runSealedRun, SealedRunRejection, signaturesPath };
