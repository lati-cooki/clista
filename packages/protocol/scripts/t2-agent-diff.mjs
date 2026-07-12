#!/usr/bin/env node
// T2 agent variant (Mutual Reliance Slice 7): the ventriloquism diff run
// against a LIVE model's rendering of a real sealed thread.
//
//   node scripts/t2-agent-diff.mjs [path/to/events.ndjson]
//
// The model is shown the thread's events (with their content_hashes) and
// asked to render a report as claims-with-citations. The diff then verifies
// every claim against the union of witnessed events (verifyReport: chain /
// existence / coverage). Standing prediction, sealed 2026-07-11 in
// mutual-reliance-proposal.md §6: this FAILS on attempt one — summarization
// is ventriloquism until every sentence is forced to cite a witness. On
// failure, attempt two feeds the specific errors back. Outcomes are recorded
// either way; a missed prediction is evidence too.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { readEventsAt, createEvent, newId } = require(path.join(root, "src/events.js"));
const { prepareEventForAppend } = require(path.join(root, "src/integrity.js"));
const { verifyReport } = require(path.join(root, "src/report.js"));
const { validateEvents } = require(path.join(root, "src/validator.js"));

function latestT1Run() {
  const runsDir = path.join(root, "runs");
  const candidates = fs.existsSync(runsDir)
    ? fs.readdirSync(runsDir).filter((d) => d.startsWith("t1-agent-")).sort()
    : [];
  if (!candidates.length) {
    console.error("no runs/t1-agent-* artifacts found — run scripts/t1-agent-run.mjs first, or pass a log path");
    process.exit(2);
  }
  return path.join(runsDir, candidates.at(-1), "events.ndjson");
}

const logPath = process.argv[2] || latestT1Run();
const events = readEventsAt(logPath);
if (!events.length) {
  console.error(`no events at ${logPath}`);
  process.exit(2);
}
const threadId = events.find((e) => e.thread_id)?.thread_id;

function renderEventsForModel() {
  return events
    .map((e, i) => {
      const payload = JSON.stringify(e.payload);
      const trimmed = payload.length > 400 ? `${payload.slice(0, 400)}…` : payload;
      return `[${i}] ${e.event_type} actor=${e.actor_id} hash=${e.content_hash}\n    ${trimmed}`;
    })
    .join("\n");
}

function claude(prompt) {
  try {
    return execFileSync("claude", ["-p", prompt], {
      encoding: "utf8",
      timeout: 240_000,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    console.error("\nLive model call failed. This variant needs the `claude` CLI on PATH.");
    console.error(`Underlying error: ${error.message}`);
    process.exit(2);
  }
}

function extractClaims(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`model reply contained no JSON object:\n${text}`);
  }
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.claims) || !parsed.claims.length) {
    throw new Error(`model reply has no claims array:\n${match[0]}`);
  }
  return parsed.claims.map((c) => ({
    text: String(c.text ?? ""),
    citedEventHashes: Array.isArray(c.citedEventHashes) ? c.citedEventHashes.map(String) : []
  }));
}

function attemptReport(claims) {
  const draft = createEvent({
    type: "SealedReport",
    threadId,
    actorId: "par_t1_maker",
    payload: {
      sealedReport: {
        id: newId("rpt", "t2_agent"),
        object: "sealedReport",
        threadId,
        renderingRuleVersion: "clista.report_rendering.v0",
        renderedByParticipantId: "par_t1_maker",
        renderedAt: new Date().toISOString(),
        claims
      }
    }
  });
  const prepared = prepareEventForAppend(draft, events.at(-1).content_hash);
  const candidate = [...events, prepared];
  return {
    prepared,
    diff: verifyReport(candidate),
    validation: validateEvents(candidate)
  };
}

const basePrompt =
  `Here is a complete ClisTa protocol event log for thread ${threadId}. ` +
  `Each event is shown with its content_hash.\n\n${renderEventsForModel()}\n\n` +
  `Write an executive report on this decision thread as 5 to 8 claims. Every claim must carry ` +
  `citations to the content_hashes of the events that witness it. Reply with ONLY a JSON object: ` +
  `{"claims": [{"text": "<claim sentence>", "citedEventHashes": ["sha256:<64hex>", ...]}, ...]}`;

const attempts = [];

console.log(`T2 agent diff — log: ${path.relative(process.cwd(), logPath)} (${events.length} events)\n`);
console.log("attempt 1: model renders the report…");
let claims = extractClaims(claude(basePrompt));
let outcome = attemptReport(claims);
attempts.push({ claims, errors: outcome.diff.errors, valid: outcome.diff.valid && outcome.validation.valid });
console.log(`attempt 1: diff ${outcome.diff.valid ? "PASS" : "FAIL"} (${outcome.diff.errors.length} unwitnessed/invalid), ` +
  `gate validation ${outcome.validation.valid ? "PASS" : "FAIL"}`);
for (const err of outcome.diff.errors) {
  console.log(`  - ${err.reason}`);
}

if (!(outcome.diff.valid && outcome.validation.valid)) {
  console.log("\nattempt 2: feeding the diff back to the model…");
  const feedback =
    `${basePrompt}\n\nYour previous attempt failed mechanical verification with these errors:\n` +
    attempts[0].errors.map((e) => `- ${e.reason}`).join("\n") +
    (outcome.validation.valid ? "" : `\n${outcome.validation.errors.map((e) => `- ${e.reason}`).join("\n")}`) +
    `\n\nFix ONLY what the errors name. Reply with the same JSON shape.`;
  claims = extractClaims(claude(feedback));
  outcome = attemptReport(claims);
  attempts.push({ claims, errors: outcome.diff.errors, valid: outcome.diff.valid && outcome.validation.valid });
  console.log(`attempt 2: diff ${outcome.diff.valid ? "PASS" : "FAIL"} (${outcome.diff.errors.length} unwitnessed/invalid), ` +
    `gate validation ${outcome.validation.valid ? "PASS" : "FAIL"}`);
  for (const err of outcome.diff.errors) {
    console.log(`  - ${err.reason}`);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(root, "runs", `t2-agent-${stamp}`);
fs.mkdirSync(runDir, { recursive: true });
fs.writeFileSync(
  path.join(runDir, "result.json"),
  JSON.stringify(
    {
      sourceLog: path.relative(root, logPath),
      threadId,
      prediction: "T2 fails on attempt one (mutual-reliance-proposal.md §6, sealed 2026-07-11)",
      attempts: attempts.map((a, i) => ({
        attempt: i + 1,
        valid: a.valid,
        errorCount: a.errors.length,
        errors: a.errors,
        claims: a.claims
      })),
      finalValid: attempts.at(-1).valid
    },
    null,
    2
  ) + "\n"
);

const firstFailed = !attempts[0].valid;
console.log(`\nprediction (fails on attempt one): ${firstFailed ? "CONFIRMED" : "MISSED — record the miss honestly"}`);
console.log(`final state after ${attempts.length} attempt(s): ${attempts.at(-1).valid ? "verified" : "still failing"}`);
console.log(`artifacts: ${path.relative(process.cwd(), runDir)}`);
