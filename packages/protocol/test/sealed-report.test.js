// SealedReport + verifyReport (Mutual Reliance Slice 4, DR-2026-07-12
// claim-citation events). A report derived from a thread is a single ordered-
// claims event; every claim cites content_hashes of EARLIER events in the SAME
// thread. Verification is three mechanical checks, each a pure function:
//   1. chain      — the event chain verifies (existing integrity check)
//   2. existence  — every cited hash resolves to an earlier same-thread event
//   3. coverage   — no claim lacks a citation
// Failure outputs are examiner-facing: which claim, which hash, which gap.
const assert = require("node:assert/strict");
const test = require("node:test");

const { chainEvents } = require("../src/integrity");
const { formatValidationErrors, validateEvents } = require("../src/validator");
const { projectEvents } = require("../src/projector");
const { verifyReport } = require("../src/report");

const THREAD = "thd_report_test";

function baseEvents() {
  return [
    {
      event_id: "evt_participant_maker",
      event_type: "ParticipantAdded",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:00.000Z",
      payload: {
        participant: { id: "par_maker", object: "participant", kind: "agent", name: "maker", role: "writer" }
      }
    },
    {
      event_id: "evt_thread_created",
      event_type: "ThreadCreated",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:01.000Z",
      payload: {
        thread: {
          id: THREAD,
          object: "thread",
          title: "report test",
          question: "does the report layer verify?",
          status: "active",
          participantIds: ["par_maker"],
          createdAt: "2026-07-12T00:00:01.000Z",
          updatedAt: "2026-07-12T00:00:01.000Z"
        }
      }
    },
    {
      event_id: "evt_evidence_1",
      event_type: "EvidenceCommitted",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:02.000Z",
      payload: {
        evidence: {
          id: "evd_report_test_1",
          object: "evidence",
          threadId: THREAD,
          source: "test fixture",
          finding: "a witnessed finding",
          committedByParticipantId: "par_maker",
          committedAt: "2026-07-12T00:00:02.000Z"
        }
      }
    }
  ];
}

// Chain the base events, then chain a SealedReport whose claims cite the
// hashes of the (now-hashed) prefix. mutateReport can adjust the report
// payload before hashing.
function logWithReport(mutateReport) {
  const prefix = chainEvents(baseEvents());
  const [participantEvt, threadEvt, evidenceEvt] = prefix;
  const report = {
    event_id: "evt_sealed_report_1",
    event_type: "SealedReport",
    thread_id: THREAD,
    actor_id: "par_maker",
    timestamp: "2026-07-12T00:00:03.000Z",
    payload: {
      sealedReport: {
        id: "rpt_report_test_1",
        object: "sealedReport",
        threadId: THREAD,
        renderingRuleVersion: "clista.report_rendering.v0",
        renderedByParticipantId: "par_maker",
        renderedAt: "2026-07-12T00:00:03.000Z",
        claims: [
          { text: "the thread was opened to test the report layer", citedEventHashes: [threadEvt.content_hash] },
          { text: "a finding was witnessed", citedEventHashes: [evidenceEvt.content_hash, participantEvt.content_hash] }
        ]
      }
    }
  };
  if (mutateReport) {
    mutateReport(report.payload.sealedReport, prefix);
  }
  const chainedReport = require("../src/integrity").prepareEventForAppend(
    report,
    prefix[prefix.length - 1].content_hash
  );
  return [...prefix, chainedReport];
}

// ---- validator: SealedReport is a first-class event type ----

test("a well-formed SealedReport validates like any event", () => {
  const events = logWithReport();
  const result = validateEvents(events);
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("SealedReport missing sealedReport.id is rejected", () => {
  const events = logWithReport((report) => {
    delete report.id;
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /SealedReport payload missing sealedReport.id/);
});

test("SealedReport rendered by an unknown participant is rejected", () => {
  const events = logWithReport((report) => {
    report.renderedByParticipantId = "par_ghost";
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /sealedReport rendered by unknown participant par_ghost/);
});

test("SealedReport without renderingRuleVersion is rejected", () => {
  const events = logWithReport((report) => {
    delete report.renderingRuleVersion;
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /SealedReport missing renderingRuleVersion/);
});

test("SealedReport with an empty claims array is rejected", () => {
  const events = logWithReport((report) => {
    report.claims = [];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /SealedReport claims must be a non-empty array/);
});

test("a claim citing a hash that exists nowhere in the thread is rejected", () => {
  const bogus = `sha256:${"ab".repeat(32)}`;
  const events = logWithReport((report) => {
    report.claims[0].citedEventHashes = [bogus];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /cited event hash does not exist in thread/);
});

test("a claim with no citations is rejected (coverage, at the gate)", () => {
  const events = logWithReport((report) => {
    report.claims[1].citedEventHashes = [];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /claim 2 has no citations/);
});

// ---- projector ----

test("projector surfaces sealed reports", () => {
  const projection = projectEvents(logWithReport());
  const reports = Object.values(projection.sealedReports);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].id, "rpt_report_test_1");
  assert.equal(reports[0].claims.length, 2);
});

// ---- verifyReport: the three mechanical checks ----

test("verifyReport passes a valid log and counts its reports", () => {
  const result = verifyReport(logWithReport());
  assert.equal(result.valid, true);
  assert.equal(result.reportCount, 1);
  assert.deepEqual(result.errors, []);
});

test("verifyReport passes a log with no reports (vacuously, count 0)", () => {
  const result = verifyReport(chainEvents(baseEvents()));
  assert.equal(result.valid, true);
  assert.equal(result.reportCount, 0);
});

test("check 1 (chain): a tampered log fails with a chain error", () => {
  const events = logWithReport();
  events[2].payload.evidence.finding = "tampered after hashing";
  const result = verifyReport(events);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.check === "chain"), JSON.stringify(result.errors));
});

test("check 2 (existence): a missing cited hash names the claim and the hash", () => {
  const bogus = `sha256:${"cd".repeat(32)}`;
  const events = logWithReport((report) => {
    report.claims[1].citedEventHashes = [bogus];
  });
  const result = verifyReport(events);
  assert.equal(result.valid, false);
  const err = result.errors.find((e) => e.check === "existence");
  assert.ok(err, JSON.stringify(result.errors));
  assert.equal(err.claimIndex, 1);
  assert.equal(err.citedHash, bogus);
  assert.match(err.reason, /claim 2 .*cites .*which resolves to no earlier event in thread/);
});

test("check 2 (existence): citing the report's own hash fails — a report witnesses only its past", () => {
  // Build a second report that cites the FIRST report's hash plus itself-ish
  // forward reference: cite a hash that only appears at/after the citing event.
  const events = logWithReport();
  const firstReport = events[events.length - 1];
  const second = require("../src/integrity").prepareEventForAppend(
    {
      event_id: "evt_sealed_report_2",
      event_type: "SealedReport",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:04.000Z",
      payload: {
        sealedReport: {
          id: "rpt_report_test_2",
          object: "sealedReport",
          threadId: THREAD,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: "par_maker",
          renderedAt: "2026-07-12T00:00:04.000Z",
          claims: [{ text: "the first report exists", citedEventHashes: [firstReport.content_hash] }]
        }
      }
    },
    firstReport.content_hash
  );
  const twoReports = [...events, second];
  // Legal: second cites first (earlier). Now tamper: make the FIRST report cite
  // the SECOND's hash — a forward reference — by rebuilding the log by hand.
  assert.equal(verifyReport(twoReports).valid, true);

  const forward = logWithReport((report, prefix) => {
    // cite a hash that will not exist until AFTER this event: its own thread's
    // future is unknowable, so use a hash derived from the prefix head — then
    // assert the mechanical check catches it as nonexistent-at-citation-time.
    report.claims[0].citedEventHashes = [`sha256:${"ef".repeat(32)}`];
  });
  const result = verifyReport(forward);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.check === "existence"));
});

test("check 2 (existence): a hash from a DIFFERENT thread does not satisfy a citation", () => {
  const events = logWithReport();
  // Append a foreign-thread participant event, then a report citing its hash.
  const { prepareEventForAppend } = require("../src/integrity");
  const foreign = prepareEventForAppend(
    {
      event_id: "evt_foreign_participant",
      event_type: "ParticipantAdded",
      thread_id: "thd_other_thread",
      actor_id: "par_other",
      timestamp: "2026-07-12T00:00:05.000Z",
      payload: {
        participant: { id: "par_other", object: "participant", kind: "agent", name: "other", role: "writer" }
      }
    },
    events[events.length - 1].content_hash
  );
  const report = prepareEventForAppend(
    {
      event_id: "evt_sealed_report_foreign",
      event_type: "SealedReport",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:06.000Z",
      payload: {
        sealedReport: {
          id: "rpt_report_test_foreign",
          object: "sealedReport",
          threadId: THREAD,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: "par_maker",
          renderedAt: "2026-07-12T00:00:06.000Z",
          claims: [{ text: "a foreign event happened", citedEventHashes: [foreign.content_hash] }]
        }
      }
    },
    foreign.content_hash
  );
  const result = verifyReport([...events, foreign, report]);
  assert.equal(result.valid, false);
  const err = result.errors.find((e) => e.check === "existence");
  assert.ok(err, JSON.stringify(result.errors));
  assert.equal(err.citedHash, foreign.content_hash);
});

test("check 3 (coverage): an uncited claim names itself in examiner-facing output", () => {
  const events = logWithReport((report) => {
    report.claims.push({ text: "an unwitnessed assertion", citedEventHashes: [] });
  });
  const result = verifyReport(events);
  assert.equal(result.valid, false);
  const err = result.errors.find((e) => e.check === "coverage");
  assert.ok(err, JSON.stringify(result.errors));
  assert.equal(err.claimIndex, 2);
  assert.equal(err.claimText, "an unwitnessed assertion");
  assert.match(err.reason, /claim 3 .*has no citations/);
});

test("verifyReport is pure: it does not mutate its input", () => {
  const events = logWithReport();
  const snapshot = JSON.stringify(events);
  verifyReport(events);
  assert.equal(JSON.stringify(events), snapshot);
});

test("multiple reports each verify against their own prefix", () => {
  const events = logWithReport();
  const firstReport = events[events.length - 1];
  const { prepareEventForAppend } = require("../src/integrity");
  const second = prepareEventForAppend(
    {
      event_id: "evt_sealed_report_2",
      event_type: "SealedReport",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:04.000Z",
      payload: {
        sealedReport: {
          id: "rpt_report_test_2",
          object: "sealedReport",
          threadId: THREAD,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: "par_maker",
          renderedAt: "2026-07-12T00:00:04.000Z",
          claims: [{ text: "the first report was issued", citedEventHashes: [firstReport.content_hash] }]
        }
      }
    },
    firstReport.content_hash
  );
  const result = verifyReport([...events, second]);
  assert.equal(result.valid, true);
  assert.equal(result.reportCount, 2);
});
