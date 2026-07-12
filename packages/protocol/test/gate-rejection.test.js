// GateRejectionRecorded — closes the known nonconformance recorded in
// DR-2026-07-12-silent-action-prohibition: a gate that refuses an append has
// shaped the output (the record that isn't there), so the refusal itself must
// be witnessed by a typed event at action time. The rejected candidate is
// committed to by content hash, never embedded — the log witnesses THAT a
// specific append was refused and WHY, without carrying an invalid payload.
//
// Deliberate behavior change to the sidecar gate: `decision propose` used to
// append NOTHING on rejection ("appends nothing and tells you why"). It now
// appends exactly one GateRejectionRecorded witness — unless the witness
// itself cannot validate (empty log, unknown writer, already-broken log),
// in which case the gate still appends nothing and says the rejection went
// unwitnessed. That residual boundary is documented, not hidden.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { chainEvents } = require("../src/integrity");
const { formatValidationErrors, validateEvents } = require("../src/validator");
const { projectEvents } = require("../src/projector");
const { runCaptured } = require("../src/cli.js");
const { appendThroughGate } = require("../src/harness/sealed-run");
const { readEvents } = require("../src/events");

const THREAD = "thd_gate_rejection_test";

function baseEvents() {
  return [
    {
      event_id: "evt_participant_writer",
      event_type: "ParticipantAdded",
      thread_id: THREAD,
      actor_id: "par_writer",
      timestamp: "2026-07-12T00:00:00.000Z",
      payload: {
        participant: { id: "par_writer", object: "participant", kind: "agent", name: "writer", role: "writer" }
      }
    },
    {
      event_id: "evt_thread_created",
      event_type: "ThreadCreated",
      thread_id: THREAD,
      actor_id: "par_writer",
      timestamp: "2026-07-12T00:00:01.000Z",
      payload: {
        thread: {
          id: THREAD, object: "thread", title: "gate rejection test",
          question: "is the refusal witnessed?", status: "active",
          participantIds: ["par_writer"],
          createdAt: "2026-07-12T00:00:01.000Z", updatedAt: "2026-07-12T00:00:01.000Z"
        }
      }
    }
  ];
}

function rejectionPayload(overrides = {}, removals = []) {
  const payload = {
    gateRejection: {
      id: "grj_test_1",
      object: "gateRejection",
      threadId: THREAD,
      gate: "decision_propose",
      candidateEventType: "DecisionRequestOpened",
      candidateContentHash: `sha256:${"ab".repeat(32)}`,
      reasons: [{ reason: "evidence reference does not exist: evd_bogus" }],
      rejectedByParticipantId: "par_writer",
      rejectedAt: "2026-07-12T00:00:02.000Z",
      ...overrides
    }
  };
  for (const key of removals) {
    delete payload.gateRejection[key];
  }
  return payload;
}

function logWithRejection(overrides = {}, removals = []) {
  return chainEvents([
    ...baseEvents(),
    {
      event_id: "evt_gate_rejection_1",
      event_type: "GateRejectionRecorded",
      thread_id: THREAD,
      actor_id: "par_writer",
      timestamp: "2026-07-12T00:00:02.000Z",
      payload: rejectionPayload(overrides, removals)
    }
  ]);
}

// ---- validator ----

test("a well-formed GateRejectionRecorded validates", () => {
  const result = validateEvents(logWithRejection());
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("candidateContentHash is optional (structural rejections never prepare a candidate)", () => {
  const result = validateEvents(logWithRejection({}, ["candidateContentHash"]));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

for (const field of ["gate", "candidateEventType", "rejectedAt"]) {
  test(`GateRejectionRecorded missing ${field} is rejected`, () => {
    const result = validateEvents(logWithRejection({}, [field]));
    assert.equal(result.valid, false);
    assert.match(formatValidationErrors(result.errors), new RegExp(`GateRejectionRecorded missing ${field}`));
  });
}

test("an unknown candidateEventType is rejected", () => {
  const result = validateEvents(logWithRejection({ candidateEventType: "MadeUpEvent" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /GateRejectionRecorded unknown candidateEventType MadeUpEvent/);
});

test("a malformed candidateContentHash is rejected", () => {
  const result = validateEvents(logWithRejection({ candidateContentHash: "not-a-hash" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /GateRejectionRecorded candidateContentHash is not a sha256 hash/);
});

test("empty reasons are rejected — a witnessed refusal must say why", () => {
  const result = validateEvents(logWithRejection({ reasons: [] }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /GateRejectionRecorded reasons must be a non-empty array/);
});

test("a reason without text is rejected", () => {
  const result = validateEvents(logWithRejection({ reasons: [{ reason: "" }] }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /GateRejectionRecorded reason 1 missing text/);
});

test("rejection recorded by an unknown participant is rejected", () => {
  const result = validateEvents(logWithRejection({ rejectedByParticipantId: "par_ghost" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /gateRejection recorded by unknown participant par_ghost/);
});

// ---- projector ----

test("projector surfaces gate rejections", () => {
  const projection = projectEvents(logWithRejection());
  const rejections = Object.values(projection.gateRejections);
  assert.equal(rejections.length, 1);
  assert.equal(rejections[0].id, "grj_test_1");
  assert.equal(rejections[0].candidateEventType, "DecisionRequestOpened");
});

// ---- the sidecar gate now witnesses its refusals ----

function freshStore() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clista-gate-rejection-"));
}

function run(cwd, argv) {
  return JSON.parse(runCaptured(argv, cwd).stdout);
}

function eventsOf(cwd) {
  return readEvents(cwd);
}

test("decision propose: an existential rejection appends exactly one GateRejectionRecorded witness", () => {
  const cwd = freshStore();
  const thread = run(cwd, ["thread", "create", "--title", "t", "--question", "q?"]);
  const threadId = thread.thread.id;
  const before = eventsOf(cwd).length;

  const result = run(cwd, [
    "decision", "propose",
    "--thread", threadId,
    "--proposal", "Ship it",
    "--evidence", "evd_totally_made_up_ffffffff",
    "--assumptions", "asm_also_made_up_ffffffff"
  ]);

  assert.equal(result.valid, false);
  assert.ok(result.rejectionEvent, "the refusal must be witnessed");
  assert.equal(result.rejectionEvent.event_type, "GateRejectionRecorded");

  const events = eventsOf(cwd);
  assert.equal(events.length, before + 2, "participant declaration + exactly one rejection witness");
  const witness = events.at(-1);
  assert.equal(witness.event_type, "GateRejectionRecorded");
  assert.equal(witness.payload.gateRejection.gate, "decision_propose");
  assert.equal(witness.payload.gateRejection.candidateEventType, "DecisionRequestOpened");
  assert.match(witness.payload.gateRejection.candidateContentHash, /^sha256:[a-f0-9]{64}$/);
  assert.ok(witness.payload.gateRejection.reasons.some((r) => r.reason.includes("does not exist")));

  // The DecisionRequestOpened itself was NOT appended, and the log stays valid.
  assert.ok(!events.some((e) => e.event_type === "DecisionRequestOpened"));
  assert.equal(run(cwd, ["validate"]).valid, true);
});

test("decision propose: a structural rejection is witnessed too (no candidate hash)", () => {
  const cwd = freshStore();
  const thread = run(cwd, ["thread", "create", "--title", "t", "--question", "q?"]);
  const threadId = thread.thread.id;

  const result = run(cwd, ["decision", "propose", "--thread", threadId, "--proposal", "Ship it with nothing"]);

  assert.equal(result.valid, false);
  assert.ok(result.rejectionEvent, "structural refusals must be witnessed too");
  const witness = eventsOf(cwd).at(-1);
  assert.equal(witness.event_type, "GateRejectionRecorded");
  assert.equal(witness.payload.gateRejection.candidateContentHash, undefined);
  assert.equal(witness.payload.gateRejection.reasons.length, 2);
  assert.equal(run(cwd, ["validate"]).valid, true);
});

test("decision propose: an already-broken log stays unwitnessed — the gate refuses to build on corruption", () => {
  const cwd = freshStore();
  const thread = run(cwd, ["thread", "create", "--title", "t", "--question", "q?"]);
  const threadId = thread.thread.id;
  run(cwd, [
    "objection", "raise",
    "--thread", threadId,
    "--participant", "Reviewer",
    "--target", "clm_never_created",
    "--target-type", "claim",
    "--text", "bogus target"
  ]);
  assert.equal(run(cwd, ["validate"]).valid, false, "setup: log must already be broken");
  const before = eventsOf(cwd).length;

  const result = run(cwd, [
    "decision", "propose",
    "--thread", threadId,
    "--actor", "Reviewer",
    "--proposal", "Ship it",
    "--evidence", "evd_x",
    "--assumptions", "asm_x"
  ]);

  assert.equal(result.valid, false);
  assert.match(result.note, /already invalid/);
  assert.equal(result.rejectionWitnessed, false);
  assert.equal(eventsOf(cwd).length, before, "nothing appends on top of a broken log");
});

test("harness gate: a rejection with an established thread context is witnessed", () => {
  const cwd = freshStore();
  run(cwd, ["thread", "create", "--title", "t", "--question", "q?"]);
  const threadId = eventsOf(cwd).find((e) => e.event_type === "ThreadCreated").payload.thread.id;
  const actorId = eventsOf(cwd).find((e) => e.event_type === "ParticipantAdded").payload.participant.id;
  const before = eventsOf(cwd).length;

  const result = appendThroughGate(
    {
      type: "EvidenceCommitted",
      threadId,
      actorId,
      payload: {
        evidence: {
          id: "evd_gate_witness", object: "evidence", threadId,
          source: "s", finding: "f",
          committedByParticipantId: "par_never_declared",
          committedAt: "2026-07-12T00:00:03.000Z"
        }
      }
    },
    cwd
  );

  assert.equal(result.valid, false);
  assert.ok(result.rejectionEvent, "harness gate must witness its refusals");
  assert.equal(eventsOf(cwd).length, before + 1);
  assert.equal(eventsOf(cwd).at(-1).event_type, "GateRejectionRecorded");
  assert.equal(run(cwd, ["validate"]).valid, true);
});

test("harness gate: an unwitnessable rejection (empty log) still appends nothing, and says so", () => {
  const cwd = freshStore();
  const result = appendThroughGate(
    {
      type: "ThreadCreated",
      threadId: "thd_reject_empty",
      actorId: "par_never_declared",
      payload: {
        thread: {
          id: "thd_reject_empty", object: "thread", title: "reject", question: "?",
          status: "active", participantIds: ["par_never_declared"],
          createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z"
        }
      }
    },
    cwd
  );
  assert.equal(result.valid, false);
  assert.equal(result.rejectionEvent, null, "no valid writer identity exists yet — the witness cannot validate");
  assert.deepEqual(readEvents(cwd), [], "an unwitnessable rejection must not corrupt the log to witness itself");
});
