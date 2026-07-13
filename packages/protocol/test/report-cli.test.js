// T2 CLI — `clista report verify`, the ventriloquism diff (Slice 6). The
// engine check is verifyReport; this locks the CLI wrapper: human-readable
// output (it runs live in front of skeptical humans), --json for machines,
// exit code 1 whenever any claim is unwitnessed.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { runCaptured } = require("../src/cli.js");
const { runSealedRun } = require("../src/harness/sealed-run");
const { readEvents } = require("../src/events");
const { prepareEventForAppend, serializeEventsNdjson } = require("../src/integrity");

const ROLES = {
  maker: {
    proposal: "Pin the toy service's dependencies",
    evidenceSource: "toy incident log",
    evidenceFinding: "the last toy outage came from an unpinned transitive dep",
    assumption: "the toy service has a lockfile-aware installer",
    decisionSummary: "Dependencies pinned",
    decisionRationale: "Outage evidence stands; checker's staleness concern handled by a renovate schedule."
  },
  checker: {
    objection: "Pinning invites dependency staleness",
    resolution: "Maker added a scheduled update job; staleness is bounded",
    reviewNotes: "Approving with the schedule in place"
  }
};

function sealedRunCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clista-t2-"));
  const result = runSealedRun({
    cwd,
    threadTitle: "T2 fixture run",
    question: "pin dependencies?",
    roles: ROLES
  });
  assert.equal(result.pass, true, "fixture sealed run must pass");
  return cwd;
}

test("report verify passes a sealed run and says so in prose", () => {
  const cwd = sealedRunCwd();
  const result = runCaptured(["report", "verify"], cwd);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /reports found: {5}1/);
  assert.match(result.stdout, /unwitnessed claims: 0/);
  assert.match(result.stdout, /PASS — every claim in every report cites a witnessed event/);
});

test("report verify lists unwitnessed claims and exits 1", () => {
  const cwd = sealedRunCwd();
  // Tamper at the report layer: rebuild the log with one extra uncited claim,
  // re-chaining so the CHAIN stays valid — the report layer alone must fail.
  const events = readEvents(cwd);
  const report = events.at(-1);
  report.payload.sealedReport.claims.push({
    text: "the checker never objected",
    citedEventHashes: []
  });
  const rechained = [];
  let previousHash;
  for (const event of events) {
    const prepared = prepareEventForAppend(event, previousHash);
    previousHash = prepared.content_hash;
    rechained.push(prepared);
  }
  const tamperedPath = path.join(cwd, "tampered.ndjson");
  fs.writeFileSync(tamperedPath, serializeEventsNdjson(rechained));

  const result = runCaptured(["report", "verify", "--events", tamperedPath], cwd);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /chain: {13}VERIFIES/);
  assert.match(result.stdout, /unwitnessed claims: 1/);
  assert.match(result.stdout, /"the checker never objected".*has no citations/);
  assert.match(result.stdout, /FAIL — the claims listed above are not witnessed/);
});

test("report verify --json returns the raw verifyReport result", () => {
  const cwd = sealedRunCwd();
  const result = runCaptured(["report", "verify", "--json", "true"], cwd);
  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.reportCount, 1);
  assert.deepEqual(parsed.errors, []);
});

// ---- T2b: the curation bucket (DR-2026-07-12-curation-check) ----
//
// Rebuild the sealed-run log with ONE extra ObjectionRaised inserted just
// before the seal, re-chaining so the chain stays valid. The harness report
// cites the run's own objection and resolution, so this inserted event is
// the only dissent the report does not cite — cited/disclosed/silent is then
// entirely up to the fixture.
function rechainWithExtraObjection(cwd, mutateReport) {
  const events = readEvents(cwd);
  const report = events.at(-1);
  assert.equal(report.event_type, "SealedReport");
  const objection = {
    event_id: "evt_extra_objection",
    event_type: "ObjectionRaised",
    thread_id: report.thread_id,
    actor_id: "par_t1_checker",
    timestamp: report.timestamp,
    payload: {
      objection: {
        id: "obj_extra_uncited",
        object: "objection",
        threadId: report.thread_id,
        participantId: "par_t1_checker",
        status: "open",
        blocking: false,
        statement: "a second objection the report never acknowledges",
        raisedAt: report.timestamp
      }
    }
  };
  const sequence = [...events.slice(0, -1), objection, report];
  const rechained = [];
  let previousHash;
  for (const event of sequence) {
    if (event === report && mutateReport) {
      // By now the inserted objection is chained; hand its hash to the fixture.
      const chainedObjection = rechained.find((e) => e.event_id === "evt_extra_objection");
      mutateReport(report.payload.sealedReport, chainedObjection);
    }
    const prepared = prepareEventForAppend(event, previousHash);
    previousHash = prepared.content_hash;
    rechained.push(prepared);
  }
  const rechainedPath = path.join(cwd, "curation.ndjson");
  fs.writeFileSync(rechainedPath, serializeEventsNdjson(rechained));
  return rechainedPath;
}

test("curation: a clean sealed run passes with zero silenced dissent", () => {
  const cwd = sealedRunCwd();
  const result = runCaptured(["report", "verify"], cwd);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /silenced dissent: {2}0/);
  assert.match(
    result.stdout,
    /PASS — every claim in every report cites a witnessed event; no dissent-bearing event silently omitted/
  );
});

test("curation: uncited dissent disclosed in omitted_dissent with a reason passes", () => {
  const cwd = sealedRunCwd();
  const eventsPath = rechainWithExtraObjection(cwd, (sealedReport, chainedObjection) => {
    sealedReport.omitted_dissent = [
      { eventHash: chainedObjection.content_hash, reason: "objection withdrawn out of band; outside report scope" }
    ];
  });
  const result = runCaptured(["report", "verify", "--events", eventsPath], cwd);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /chain: {13}VERIFIES/);
  assert.match(result.stdout, /silenced dissent: {2}0/);
});

test("curation: silently omitted dissent fails, naming index, type, and hash, and exits 1", () => {
  const cwd = sealedRunCwd();
  const eventsPath = rechainWithExtraObjection(cwd);
  const result = runCaptured(["report", "verify", "--events", eventsPath], cwd);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /chain: {13}VERIFIES/);
  assert.match(result.stdout, /unwitnessed claims: 0/);
  assert.match(result.stdout, /silenced dissent: {2}1/);
  assert.match(result.stdout, /dissent-bearing event evt_extra_objection at index \d+ \(ObjectionRaised, sha256:/);
  assert.match(result.stdout, /neither cited by any claim nor disclosed in omitted_dissent/);
  assert.match(result.stdout, /FAIL — the dissent-bearing events listed above were silently omitted from a report/);
});

test("curation: an omitted_dissent entry with an empty reason does not satisfy the check", () => {
  const cwd = sealedRunCwd();
  const eventsPath = rechainWithExtraObjection(cwd, (sealedReport, chainedObjection) => {
    sealedReport.omitted_dissent = [{ eventHash: chainedObjection.content_hash, reason: "" }];
  });
  const result = runCaptured(["report", "verify", "--events", eventsPath], cwd);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /silenced dissent: {2}1/);
});

test("report verify on a log with no reports is a vacuous pass", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clista-t2-empty-"));
  runCaptured(["init"], cwd);
  const result = runCaptured(["report", "verify"], cwd);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /reports found: {5}0/);
  assert.match(result.stdout, /nothing to diff \(vacuous pass\)/);
});
