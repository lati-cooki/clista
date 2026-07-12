// T1 deterministic variant (Mutual Reliance Slice 5): the maker/checker
// sealed run with scripted payloads. Pass criterion — the ONLY one that
// counts — is that the emitted thread passes existing chain verification.
// The agent variant of the same orchestration lives in
// scripts/t1-agent-run.mjs and is a runnable script, not a test.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { appendThroughGate, runSealedRun } = require("../src/harness/sealed-run");
const { verifyReport } = require("../src/report");
const { readEvents } = require("../src/events");

const SCRIPTED_ROLES = {
  maker: {
    proposal: "Adopt tabs over spaces in the toy repo",
    evidenceSource: "toy style survey",
    evidenceFinding: "3 of 4 toy files already use tabs",
    assumption: "the toy repo has no downstream style consumers",
    decisionSummary: "Tabs adopted for the toy repo",
    decisionRationale: "Majority of existing files already comply; checker's portability concern resolved by an editorconfig."
  },
  checker: {
    objection: "Tabs render inconsistently across the toy viewers",
    resolution: "Maker added a toy .editorconfig pinning tab width; rendering is consistent",
    reviewNotes: "Challenge answered; approving"
  }
};

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clista-t1-"));
}

test("T1 deterministic: the sealed run emits a thread that passes chain verification", () => {
  const cwd = tempCwd();
  const result = runSealedRun({
    cwd,
    threadTitle: "T1 deterministic sealed run",
    question: "tabs or spaces for the toy repo?",
    roles: SCRIPTED_ROLES
  });

  assert.equal(result.pass, true, JSON.stringify({ integrity: result.integrity.reasons, validation: result.validation.errors }, null, 2));
  assert.equal(result.integrity.valid, true);
  assert.equal(result.validation.valid, true);
  assert.deepEqual(result.rejections, []);
  assert.equal(result.appendedCount, 13);
  assert.ok(result.sealEventId, "run must end in a seal");

  // The seal is the final event, and the report layer verifies mechanically.
  const events = readEvents(cwd);
  assert.equal(events.at(-1).event_type, "SealedReport");
  const report = verifyReport(events);
  assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
  assert.equal(report.reportCount, 1);
});

test("distinct writer identities: maker and checker events carry their own actor_id", () => {
  const cwd = tempCwd();
  runSealedRun({
    cwd,
    threadTitle: "T1 identity check",
    question: "who wrote what?",
    roles: SCRIPTED_ROLES
  });
  const events = readEvents(cwd);
  const byType = (type) => events.filter((e) => e.event_type === type);
  assert.equal(byType("ObjectionRaised")[0].actor_id, "par_t1_checker");
  assert.equal(byType("ReviewSubmitted")[0].actor_id, "par_t1_checker");
  assert.equal(byType("DecisionMerged")[0].actor_id, "par_t1_maker");
  assert.equal(byType("SealedReport")[0].actor_id, "par_t1_maker");
});

test("the gate appends nothing on rejection", () => {
  const cwd = tempCwd();
  // No participants declared: a bare ThreadCreated citing an unknown
  // participant must be rejected, and the log must stay empty.
  const result = appendThroughGate(
    {
      type: "ThreadCreated",
      threadId: "thd_reject_test",
      actorId: "par_never_declared",
      payload: {
        thread: {
          id: "thd_reject_test", object: "thread", title: "reject", question: "?",
          status: "active", participantIds: ["par_never_declared"],
          createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z"
        }
      }
    },
    cwd
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.deepEqual(readEvents(cwd), [], "rejected event must not be appended");
});
