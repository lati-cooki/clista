// T2 — the ventriloquism diff (Mutual Reliance Slice 6). Given a log
// containing SealedReport events, extract every claim and verify it against
// the union of witnessed events: chain verifies, every cited hash exists
// earlier in the report's own thread, no claim lacks a citation. Output is
// the list of unwitnessed claims — an empty list is the pass.
//
// The check itself is src/report.js verifyReport (pure engine function);
// this wrapper does file IO, option parsing, exit-code mapping, and the
// human-readable rendering — it is run live in front of skeptical humans,
// so the default output is prose, not JSON (--json for machines).
const { verifyReport } = require("../report");
const { booleanOption, print, readEventsForOptions, writeOut } = require("./shared");

function reportVerify(options, cwd) {
  const events = readEventsForOptions(options, cwd);
  const result = verifyReport(events);

  if (booleanOption(options.json, false)) {
    print(result);
    if (!result.valid) {
      process.exitCode = 1;
    }
    return;
  }

  const lines = [];
  lines.push(`events examined:   ${events.length}`);
  lines.push(`reports found:     ${result.reportCount}`);

  const chainErrors = result.errors.filter((e) => e.check === "chain");
  const structureErrors = result.errors.filter((e) => e.check === "structure");
  const unwitnessed = result.errors.filter((e) => e.check === "existence" || e.check === "coverage");

  lines.push(`chain:             ${chainErrors.length === 0 ? "VERIFIES" : `BROKEN (${chainErrors.length} reasons)`}`);
  for (const err of chainErrors) {
    lines.push(`  - ${err.reason}`);
  }
  for (const err of structureErrors) {
    lines.push(`  - malformed report: ${err.reason}`);
  }

  lines.push(`unwitnessed claims: ${unwitnessed.length}`);
  for (const err of unwitnessed) {
    lines.push(`  - ${err.reason}`);
  }

  if (result.reportCount === 0) {
    lines.push("");
    lines.push("no SealedReport events in this log — nothing to diff (vacuous pass)");
  } else if (result.valid) {
    lines.push("");
    lines.push("PASS — every claim in every report cites a witnessed event");
  } else {
    lines.push("");
    lines.push("FAIL — the claims listed above are not witnessed by the log they describe");
  }
  writeOut(`${lines.join("\n")}\n`);

  if (!result.valid) {
    process.exitCode = 1;
  }
}

module.exports = { reportVerify };
