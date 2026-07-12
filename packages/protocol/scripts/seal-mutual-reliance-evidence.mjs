#!/usr/bin/env node
// Slice 8 — seal the Mutual Reliance evidence chain as a real ClisTa thread,
// using the new machinery (appendThroughGate + SealedReport). One-shot
// archival script; the emitted thread is the artifact ("the night the system
// caught itself") and lives under runs/evidence-seal-2026-07-12/.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { appendThroughGate } = require(path.join(root, "src/harness/sealed-run.js"));
const { readEvents, newId } = require(path.join(root, "src/events.js"));
const { verifyEventIntegrity } = require(path.join(root, "src/integrity.js"));
const { validateEvents } = require(path.join(root, "src/validator.js"));
const { verifyReport } = require(path.join(root, "src/report.js"));

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clista-seal-"));
const threadId = newId("thd", "mutual_reliance_evidence");
const writerId = "par_claude_fable5";
const ownerId = "par_troy_builds";
const at = () => new Date().toISOString();

const rejections = [];
function gate(spec) {
  const result = appendThroughGate(spec, cwd);
  if (!result.valid) {
    rejections.push({ type: spec.type, errors: result.errors });
    throw new Error(`gate rejected ${spec.type}: ${JSON.stringify(result.errors, null, 2)}`);
  }
  return result.event;
}

// ---- participants + thread ----
gate({
  type: "ParticipantAdded", threadId, actorId: writerId,
  payload: { participant: { id: writerId, object: "participant", kind: "agent", name: "Claude Fable 5 (supervised session writer)", role: "archivist" } }
});
gate({
  type: "ParticipantAdded", threadId, actorId: writerId,
  payload: { participant: { id: ownerId, object: "participant", kind: "human", name: "troy_builds", role: "decision owner" } }
});
const threadEvt = gate({
  type: "ThreadCreated", threadId, actorId: writerId,
  payload: {
    thread: {
      id: threadId, object: "thread",
      title: "The night the system caught itself — Mutual Reliance evidence chain",
      question: "What is the witnessed evidence base for the Mutual Reliance architecture (2026-07-10 probe through 2026-07-12 implementation)?",
      status: "active", participantIds: [writerId, ownerId],
      createdAt: at(), updatedAt: at()
    }
  }
});

// ---- evidence: each item cites its source by content hash ----
const E = [];
function evidence(source, finding, contentHash) {
  const id = newId("evd", "mre");
  const evt = gate({
    type: "EvidenceCommitted", threadId, actorId: writerId,
    payload: {
      evidence: {
        id, object: "evidence", threadId, source, finding,
        contentHash, committedByParticipantId: writerId, committedAt: at()
      }
    }
  });
  E.push({ id, evt, finding });
  return evt;
}

const SWARM = "lati-cooki/clista-octopus-swarm@87931059dc2e714127503422ea4867099fae6079";
const MONO = "lati-cooki/clista";

evidence(
  `${SWARM} DR-hive-mind-cache-integrity.md — Phase 1 probe (verbatim prompt + outcome)`,
  "Phase 1 (seed), exec 74890807-cccb-4a9f-b4ac-d172b5ff506b, 2026-07-11 06:25 UTC: bank PD-model revalidation question computed fresh (audit + hive-mind writes ~1.4s apart); conclusion 'annual-cycle revalidation sufficient' — defensible on stated facts — archived to clista_hive_mind.",
  "sha256:f0797d0c53242d69129fa1087a2285782d32db73ef25580bd1434ac579fae1fe"
);
evidence(
  `${SWARM} DR-hive-mind-cache-integrity.md — Phase 2 probe (material change)`,
  "Phase 2: identical prompt PLUS stated recession and doubled realized defaults. System logged 'Hive Mind HIT! 0.0 Compute Cost' and served the Phase 1 answer verbatim, including rationale claiming 'no compelling evidence of performance degradation' — contradicted by the doubled default rate in the very prompt it answered. Zero arms spawned.",
  "sha256:f0797d0c53242d69129fa1087a2285782d32db73ef25580bd1434ac579fae1fe"
);
evidence(
  `${SWARM} DR-hive-mind-cache-integrity.md — Phase 3 probe (cosmetic change)`,
  "Phase 3: cosmetic edits only (renamed bank, 8→2 months). HIT was arguably appropriate, but the served rationale asserted '8 months ago' and 'annual revalidation only 4 months away' — both false for the query answered. Conclusion-reuse and rationale-transplant defects falsified independently.",
  "sha256:f0797d0c53242d69129fa1087a2285782d32db73ef25580bd1434ac579fae1fe"
);
evidence(
  `${SWARM} DR-hive-mind-cache-integrity.md — Slice 1 forensics (silent recall)`,
  "Read-only Firestore forensics: precedent contamination CLEAN (no new hive-mind entries from the recalls), but Phases 2 and 3 left NO server-side record whatsoever — the recall path returns before commit_audit_record. Two production decisions exist only as pastes in a chat transcript. Silence as a defect class, distinct from corruption.",
  "sha256:f0797d0c53242d69129fa1087a2285782d32db73ef25580bd1434ac579fae1fe"
);
evidence(
  `${MONO}@c56b406 docs/new/mutual-reliance-proposal.md`,
  "The Mutual Reliance Proposal: trust relocates from producers of work to verification of records; three commitments (no unwitnessed work; precedent as citation, never ventriloquism; reports follow the protocol too); T1–T4 falsifiers with predictions sealed 2026-07-11.",
  "sha256:394fc4195ff891d8cdadc9f0452e46dbb6cb5e1b3c03b7758d89be98e00b48d2"
);
evidence(
  `${MONO}@d2a629c docs/decision-records/DR-2026-07-12-claim-citation-events.md`,
  "DR Slice 1 (adopted): SealedReport — a report is a single ordered-claims event, every claim citing content_hashes of earlier same-thread events; verification is three mechanical pure-function checks (chain, existence, coverage). Option A (CrossThreadEvidence inward) rejected: coverage inexpressible, circular self-witnessing.",
  "sha256:6b2786cd1837b325c3784b3ed2b3e71f0d37a693c2e8e0f346a8c25ce3dc7cc7"
);
evidence(
  `${MONO}@ed5f92d docs/decision-records/DR-2026-07-12-silent-action-prohibition.md`,
  "DR Slice 2 (adopted): any output-shaping action MUST emit a typed event at action time — recall/reuse, arbitration, gate rejections, external ingestion. Records live, never reconstructed. Silence is a first-class defect, severity-distinct from (above) corruption. The sidecar gate's own silent rejections recorded as a known nonconformance.",
  "sha256:0fdce1c73b17b3f91da66ded530b1a3a4d3a5fa6c30434e163911efd87d5d2c7"
);
evidence(
  `${MONO}@ecce00d docs/decision-records/DR-2026-07-12-precedent-as-citation.md`,
  "DR Slice 3 (adopted): PrecedentReference — holdings travel as tagged citations (source thread/event hash, live+source context hashes, precedent date, regrounding mode); the shape has no rationale field by design. Cache keys are hashes of declared decision-relevant context. Fail open to fresh computation.",
  "sha256:6889f44ef2d99d4b6fb74035966a4d1908d36c8170782ffb4f1940a0907a15da"
);
evidence(
  `${MONO}@0cd62dd..0260327 T1 agent run artifact (runs/t1-agent-2026-07-12T01-19-55-836Z/events.ndjson)`,
  "T1 agent variant executed live 2026-07-12: thread thd_sealed_run_mrh3w4h9_d5d01472, 13 events, maker/checker under distinct writer identities through the gate, zero rejections; chain verifies, log validates, report verifies. Prediction 'passes within two attempts' CONFIRMED on attempt one.",
  "sha256:93bb5c1cc3025b4624c8b2734196be95410c345b57ffd105b4d0ffc3bd8da272"
);
evidence(
  `${MONO}@0260327 docs/decision-records/FINDINGS-T1-T2.md`,
  "T2 outcomes recorded against sealed predictions: deterministic diff catches a smuggled uncited claim the chain cannot see; agent variant prediction MISSED — a live model, forced into claims-with-citations, produced a fully-witnessed 8-claim report on attempt one. The miss is recorded plainly: forced citation is the cure and is easily satisfiable; unforced-prose diffing moves to probe-style T3/T4.",
  "sha256:7600a0f751f83147e2f53665bfefe432396914de68e4b1de6e812ab1be40f237"
);

// ---- the seal: a SealedReport whose claims cite the evidence events ----
const cite = (...idx) => idx.map((i) => E[i].evt.content_hash);
const reportEvt = gate({
  type: "SealedReport", threadId, actorId: writerId,
  payload: {
    sealedReport: {
      id: newId("rpt", "mre"), object: "sealedReport", threadId,
      renderingRuleVersion: "clista.report_rendering.v0",
      renderedByParticipantId: writerId, renderedAt: at(),
      claims: [
        { text: "On 2026-07-10/11 a three-phase probe of the clista-octopus-swarm Hive Mind cache demonstrated ventriloquism: a pre-recession precedent served into a stated-recession query with its original rationale intact, and a cosmetic-change query answered with factually false transplanted rationale.", citedEventHashes: cite(0, 1, 2) },
        { text: "Forensics established a defect class worse than corruption: the recall path wrote no server-side record at all — two production decisions are witnessed only by a chat transcript.", citedEventHashes: cite(3) },
        { text: "The Mutual Reliance proposal answered with an architecture: relocate trust from producers of work to verification of records, via three protocol-level commitments.", citedEventHashes: cite(4) },
        { text: "The three commitments were adopted as decision records: claim-citation report events (SealedReport), the silent-action prohibition, and precedent-as-citation semantics (PrecedentReference).", citedEventHashes: cite(5, 6, 7) },
        { text: "The report layer is now implemented and mechanically verifiable: SealedReport is a first-class event type and verifyReport runs the three checks (chain, existence, coverage) as a pure function, exposed as `clista report verify`.", citedEventHashes: cite(5, 8, 9) },
        { text: "T1 — the single-prompt sealed run with live model maker/checker roles — passed chain verification on attempt one, confirming the sealed prediction.", citedEventHashes: cite(8) },
        { text: "T2's sealed prediction missed: under forced claims-with-citations structure a live model produced a fully-witnessed report immediately; the miss is itself recorded as evidence, and unforced-prose diffing is left, on record, to probe-style follow-ups.", citedEventHashes: cite(9) },
        { text: "This thread is itself the artifact it describes: an append-only, hash-chained record whose final event commits to every event it cites — verifiable by anyone with `clista report verify`, trusting no one who produced it.", citedEventHashes: [threadEvt.content_hash, ...cite(4, 5)] }
      ]
    }
  }
});

// ---- verify + persist ----
const events = readEvents(cwd);
const integrity = verifyEventIntegrity(events);
const validation = validateEvents(events);
const report = verifyReport(events);

const outDir = path.join(root, "runs", "evidence-seal-2026-07-12");
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(cwd, ".clista", "events.ndjson"), path.join(outDir, "events.ndjson"));
fs.writeFileSync(
  path.join(outDir, "verification.json"),
  JSON.stringify({ threadId, sealEventId: reportEvt.event_id, sealHash: reportEvt.content_hash, integrity, validation: { valid: validation.valid, errors: validation.errors }, report, rejections }, null, 2) + "\n"
);

console.log(`thread:          ${threadId}`);
console.log(`events:          ${events.length}`);
console.log(`seal event:      ${reportEvt.event_id}`);
console.log(`seal hash:       ${reportEvt.content_hash}`);
console.log(`chain verifies:  ${integrity.valid} (head ${integrity.headHash})`);
console.log(`log validates:   ${validation.valid}`);
console.log(`report verifies: ${report.valid} (${report.reportCount} report, ${report.errors.length} errors)`);
console.log(`artifact:        ${path.relative(process.cwd(), outDir)}/events.ndjson`);
process.exit(integrity.valid && validation.valid && report.valid ? 0 : 1);
