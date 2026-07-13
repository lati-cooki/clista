// T2b — the curation check (Phase 5 Wave 2 / Slice 4,
// DR-2026-07-12-curation-check). Chain verification proves the log; coverage
// proves every claim cites a witness. Neither catches CURATION failure — a
// report whose claims are all cited but which silently omits the thread's
// dissent. The rule locked here: every dissent-bearing event that precedes a
// SealedReport in its thread must be cited by some claim OR disclosed in the
// report's omitted_dissent[] block with a non-empty reason. Silent omission
// fails. Mechanical set-comparison only — no prose judgment.
//
// All fixtures in this file are SYNTHETIC (prediction-protocol order
// discipline: the check is built and locked against synthetic threads before
// its first untuned run against any real artifact).
const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DISSENT_BEARING_TYPES,
  DISSENT_BEARING_TYPE_SET,
  EVENT_TYPES,
  EVENT_TYPE_SET
} = require("../src/event-types");
const { chainEvents, prepareEventForAppend } = require("../src/integrity");
const { formatValidationErrors, validateEvents } = require("../src/validator");
const { projectEvents } = require("../src/projector");
const { verifyReport } = require("../src/report");

const THREAD = "thd_curation_test";

// ---- DISSENT_BEARING_TYPES: the registry-backed dissent vocabulary ----

test("every dissent-bearing type is a registered event type", () => {
  for (const type of DISSENT_BEARING_TYPES) {
    assert.ok(EVENT_TYPE_SET.has(type), `${type} is not in the event-type registry`);
  }
});

test("dissent-bearing list is sorted, unique, and frozen (explicit enumeration, no runtime wildcards)", () => {
  assert.ok(Object.isFrozen(DISSENT_BEARING_TYPES));
  const sorted = [...DISSENT_BEARING_TYPES].sort();
  assert.deepEqual([...DISSENT_BEARING_TYPES], sorted, "DISSENT_BEARING_TYPES must be sorted");
  assert.equal(new Set(DISSENT_BEARING_TYPES).size, DISSENT_BEARING_TYPES.length, "DISSENT_BEARING_TYPES must be unique");
  assert.equal(DISSENT_BEARING_TYPE_SET.size, DISSENT_BEARING_TYPES.length);
  for (const type of DISSENT_BEARING_TYPES) {
    assert.ok(DISSENT_BEARING_TYPE_SET.has(type));
  }
});

test("the explicitly named dissent carriers are all present", () => {
  const named = [
    "ObjectionRaised",
    "ObjectionResolved",
    "PositionTaken",
    "MinorityReportFiled",
    "ReviewDisputed",
    "LearningDisputed",
    "OutcomeDisputed",
    "ContributionAttributionDisputed",
    "NegotiationTermsRejected",
    "NegotiationDifferenceRecorded",
    "GateRejectionRecorded"
  ];
  for (const type of named) {
    assert.ok(DISSENT_BEARING_TYPE_SET.has(type), `${type} missing from DISSENT_BEARING_TYPES`);
  }
});

test("every registry *FailureRecorded and *ViolationRecorded type is enumerated (suffix sweep is test-time only)", () => {
  // The map itself never wildcard-matches at runtime; this test does the
  // suffix sweep once, so a NEW failure/violation type added to the registry
  // must be deliberately classified here or this fails loudly.
  const suffixed = EVENT_TYPES.filter(
    (t) => t.endsWith("FailureRecorded") || t.endsWith("ViolationRecorded")
  );
  assert.ok(suffixed.length >= 9, `expected at least 9 suffix types, found ${suffixed.length}`);
  for (const type of suffixed) {
    assert.ok(DISSENT_BEARING_TYPE_SET.has(type), `${type} missing from DISSENT_BEARING_TYPES`);
  }
});

test("consensus-bearing types are not classified as dissent", () => {
  for (const type of ["SealedReport", "ThreadCreated", "ReviewSubmitted", "DecisionMerged", "NegotiationTermsAccepted"]) {
    assert.ok(!DISSENT_BEARING_TYPE_SET.has(type), `${type} must not be dissent-bearing`);
  }
});

// ---- fixtures ----

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
      event_id: "evt_participant_checker",
      event_type: "ParticipantAdded",
      thread_id: THREAD,
      actor_id: "par_checker",
      timestamp: "2026-07-12T00:00:00.500Z",
      payload: {
        participant: { id: "par_checker", object: "participant", kind: "agent", name: "checker", role: "checker" }
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
          title: "curation test",
          question: "does the report disclose its dissent?",
          status: "active",
          participantIds: ["par_maker", "par_checker"],
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
          id: "evd_curation_test_1",
          object: "evidence",
          threadId: THREAD,
          source: "test fixture",
          finding: "a witnessed finding",
          committedByParticipantId: "par_maker",
          committedAt: "2026-07-12T00:00:02.000Z"
        }
      }
    },
    {
      event_id: "evt_objection_1",
      event_type: "ObjectionRaised",
      thread_id: THREAD,
      actor_id: "par_checker",
      timestamp: "2026-07-12T00:00:03.000Z",
      payload: {
        objection: {
          id: "obj_curation_test_1",
          object: "objection",
          threadId: THREAD,
          participantId: "par_checker",
          status: "open",
          blocking: false,
          targetObjectType: "evidence",
          targetObjectId: "evd_curation_test_1",
          statement: "the finding overstates what the source shows",
          raisedAt: "2026-07-12T00:00:03.000Z"
        }
      }
    }
  ];
}

// Chain the base events, then chain a SealedReport on top. By default the
// report CITES the objection (curation satisfied by citation); mutateReport
// can reshape claims / omitted_dissent before hashing.
function logWithReport(mutateReport) {
  const prefix = chainEvents(baseEvents());
  const [, , threadEvt, evidenceEvt, objectionEvt] = prefix;
  const report = {
    event_id: "evt_sealed_report_1",
    event_type: "SealedReport",
    thread_id: THREAD,
    actor_id: "par_maker",
    timestamp: "2026-07-12T00:00:04.000Z",
    payload: {
      sealedReport: {
        id: "rpt_curation_test_1",
        object: "sealedReport",
        threadId: THREAD,
        renderingRuleVersion: "clista.report_rendering.v0",
        renderedByParticipantId: "par_maker",
        renderedAt: "2026-07-12T00:00:04.000Z",
        claims: [
          { text: "the thread was opened to test curation", citedEventHashes: [threadEvt.content_hash] },
          { text: "a finding was witnessed", citedEventHashes: [evidenceEvt.content_hash] },
          { text: "the checker objected to the finding", citedEventHashes: [objectionEvt.content_hash] }
        ]
      }
    }
  };
  if (mutateReport) {
    mutateReport(report.payload.sealedReport, prefix);
  }
  const chainedReport = prepareEventForAppend(report, prefix[prefix.length - 1].content_hash);
  return [...prefix, chainedReport];
}

// The silent-omission variant: the report's claims never cite the objection
// and nothing discloses it.
function silentOmissionMutation(report) {
  report.claims = report.claims.slice(0, 2);
}

// ---- verifyReport check 4: curation ----

test("curation passes when every dissent-bearing event is claim-cited", () => {
  const result = verifyReport(logWithReport());
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(result.errors, []);
});

test("curation passes when uncited dissent is disclosed in omitted_dissent with a reason", () => {
  const events = logWithReport((report, prefix) => {
    silentOmissionMutation(report);
    report.omitted_dissent = [
      { eventHash: prefix[4].content_hash, reason: "objection withdrawn orally; out of report scope" }
    ];
  });
  const result = verifyReport(events);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("curation fails on silent omission, naming the event's index, type, and hash", () => {
  const events = logWithReport(silentOmissionMutation);
  const result = verifyReport(events);
  assert.equal(result.valid, false);
  const err = result.errors.find((e) => e.check === "curation");
  assert.ok(err, JSON.stringify(result.errors));
  assert.equal(err.eventId, "evt_objection_1");
  assert.equal(err.eventIndex, 4);
  assert.equal(err.eventType, "ObjectionRaised");
  assert.equal(err.eventHash, events[4].content_hash);
  assert.equal(err.reportId, "rpt_curation_test_1");
  assert.match(err.reason, /dissent-bearing event evt_objection_1 at index 4 \(ObjectionRaised, sha256:/);
  assert.match(err.reason, /neither cited by any claim nor disclosed in omitted_dissent/);
});

test("an omitted_dissent entry with an empty reason does not satisfy curation", () => {
  const events = logWithReport((report, prefix) => {
    silentOmissionMutation(report);
    report.omitted_dissent = [{ eventHash: prefix[4].content_hash, reason: "" }];
  });
  const result = verifyReport(events);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.check === "curation"), JSON.stringify(result.errors));
});

test("an omitted_dissent entry whose reason is whitespace or a non-string does not satisfy curation", () => {
  for (const reason of ["   ", 42, null]) {
    const events = logWithReport((report, prefix) => {
      silentOmissionMutation(report);
      report.omitted_dissent = [{ eventHash: prefix[4].content_hash, reason }];
    });
    const result = verifyReport(events);
    assert.equal(result.valid, false, `reason ${JSON.stringify(reason)} must not satisfy curation`);
  }
});

test("a report with no dissent-bearing events and no omitted_dissent passes (backward compatible)", () => {
  const prefix = chainEvents(baseEvents().slice(0, 4)); // no objection
  const [, , threadEvt, evidenceEvt] = prefix;
  const report = prepareEventForAppend(
    {
      event_id: "evt_sealed_report_no_dissent",
      event_type: "SealedReport",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:04.000Z",
      payload: {
        sealedReport: {
          id: "rpt_curation_no_dissent",
          object: "sealedReport",
          threadId: THREAD,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: "par_maker",
          renderedAt: "2026-07-12T00:00:04.000Z",
          claims: [
            { text: "the thread was opened", citedEventHashes: [threadEvt.content_hash] },
            { text: "a finding was witnessed", citedEventHashes: [evidenceEvt.content_hash] }
          ]
        }
      }
    },
    prefix[prefix.length - 1].content_hash
  );
  const result = verifyReport([...prefix, report]);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("dissent appended AFTER a report does not bind that report (strict past only)", () => {
  const events = logWithReport();
  const late = prepareEventForAppend(
    {
      event_id: "evt_objection_late",
      event_type: "ObjectionRaised",
      thread_id: THREAD,
      actor_id: "par_checker",
      timestamp: "2026-07-12T00:00:05.000Z",
      payload: {
        objection: {
          id: "obj_curation_test_late",
          object: "objection",
          threadId: THREAD,
          participantId: "par_checker",
          status: "open",
          blocking: false,
          targetObjectType: "evidence",
          targetObjectId: "evd_curation_test_1",
          statement: "a later objection the earlier report cannot know about",
          raisedAt: "2026-07-12T00:00:05.000Z"
        }
      }
    },
    events[events.length - 1].content_hash
  );
  const result = verifyReport([...events, late]);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("each report answers for its own prefix: a second report must handle dissent the first predates", () => {
  const events = logWithReport();
  const late = prepareEventForAppend(
    {
      event_id: "evt_objection_late",
      event_type: "ObjectionRaised",
      thread_id: THREAD,
      actor_id: "par_checker",
      timestamp: "2026-07-12T00:00:05.000Z",
      payload: {
        objection: {
          id: "obj_curation_test_late",
          object: "objection",
          threadId: THREAD,
          participantId: "par_checker",
          status: "open",
          blocking: false,
          targetObjectType: "evidence",
          targetObjectId: "evd_curation_test_1",
          statement: "an objection between the two reports",
          raisedAt: "2026-07-12T00:00:05.000Z"
        }
      }
    },
    events[events.length - 1].content_hash
  );
  const second = prepareEventForAppend(
    {
      event_id: "evt_sealed_report_2",
      event_type: "SealedReport",
      thread_id: THREAD,
      actor_id: "par_maker",
      timestamp: "2026-07-12T00:00:06.000Z",
      payload: {
        sealedReport: {
          id: "rpt_curation_test_2",
          object: "sealedReport",
          threadId: THREAD,
          renderingRuleVersion: "clista.report_rendering.v0",
          renderedByParticipantId: "par_maker",
          renderedAt: "2026-07-12T00:00:06.000Z",
          // Cites the first objection but stays silent about the late one.
          claims: [{ text: "the checker objected", citedEventHashes: [events[4].content_hash] }]
        }
      }
    },
    late.content_hash
  );
  const result = verifyReport([...events, late, second]);
  assert.equal(result.valid, false);
  const errs = result.errors.filter((e) => e.check === "curation");
  assert.equal(errs.length, 1, JSON.stringify(result.errors));
  assert.equal(errs[0].reportId, "rpt_curation_test_2");
  assert.equal(errs[0].eventId, "evt_objection_late");
});

test("dissent in a DIFFERENT thread does not bind this thread's report", () => {
  const events = logWithReport();
  // Rebuild with a foreign-thread objection inserted before the report.
  const prefix = events.slice(0, 5);
  const foreign = prepareEventForAppend(
    {
      event_id: "evt_objection_foreign",
      event_type: "ObjectionRaised",
      thread_id: "thd_other_thread",
      actor_id: "par_other",
      timestamp: "2026-07-12T00:00:03.500Z",
      payload: {
        objection: {
          id: "obj_foreign_1",
          object: "objection",
          threadId: "thd_other_thread",
          participantId: "par_other",
          status: "open",
          blocking: false,
          statement: "an objection in another thread entirely",
          raisedAt: "2026-07-12T00:00:03.500Z"
        }
      }
    },
    prefix[prefix.length - 1].content_hash
  );
  const report = prepareEventForAppend(
    { ...JSON.parse(JSON.stringify(events[5])) },
    foreign.content_hash
  );
  const result = verifyReport([...prefix, foreign, report]);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("verifyReport with curation is pure: it does not mutate its input", () => {
  const events = logWithReport(silentOmissionMutation);
  const snapshot = JSON.stringify(events);
  verifyReport(events);
  assert.equal(JSON.stringify(events), snapshot);
});

// ---- validator: omitted_dissent[] payload schema (coordinated edits) ----

test("a SealedReport with well-formed omitted_dissent validates", () => {
  const events = logWithReport((report, prefix) => {
    silentOmissionMutation(report);
    report.omitted_dissent = [
      { eventHash: prefix[4].content_hash, reason: "objection out of report scope; recorded here" }
    ];
  });
  const result = validateEvents(events);
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("validator rejects omitted_dissent that is not an array", () => {
  const events = logWithReport((report, prefix) => {
    report.omitted_dissent = { eventHash: prefix[4].content_hash, reason: "not a list" };
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /omitted_dissent must be an array/);
});

test("validator rejects an omitted_dissent entry with a malformed eventHash", () => {
  const events = logWithReport((report) => {
    report.omitted_dissent = [{ eventHash: "not-a-hash", reason: "malformed" }];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /omitted_dissent entry 1 eventHash is not a sha256 hash/);
});

test("validator rejects an omitted_dissent entry whose hash resolves to no earlier event in the thread", () => {
  const bogus = `sha256:${"ab".repeat(32)}`;
  const events = logWithReport((report) => {
    report.omitted_dissent = [{ eventHash: bogus, reason: "phantom disclosure" }];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /omitted_dissent entry 1 eventHash does not exist in thread/);
});

test("validator rejects an omitted_dissent entry without a non-empty reason", () => {
  const events = logWithReport((report, prefix) => {
    report.omitted_dissent = [{ eventHash: prefix[4].content_hash, reason: "  " }];
  });
  const result = validateEvents(events);
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /omitted_dissent entry 1 missing reason/);
});

// ---- projector: omitted_dissent rides the sealedReport projection ----

test("projector surfaces omitted_dissent on the sealed report", () => {
  const events = logWithReport((report, prefix) => {
    silentOmissionMutation(report);
    report.omitted_dissent = [
      { eventHash: prefix[4].content_hash, reason: "objection out of report scope; recorded here" }
    ];
  });
  const projection = projectEvents(events);
  const reports = Object.values(projection.sealedReports);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].omitted_dissent.length, 1);
  assert.equal(reports[0].omitted_dissent[0].reason, "objection out of report scope; recorded here");
});
