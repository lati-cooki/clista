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

test("report verify on a log with no reports is a vacuous pass", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clista-t2-empty-"));
  runCaptured(["init"], cwd);
  const result = runCaptured(["report", "verify"], cwd);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /reports found: {5}0/);
  assert.match(result.stdout, /nothing to diff \(vacuous pass\)/);
});
