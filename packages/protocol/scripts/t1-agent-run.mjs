#!/usr/bin/env node
// T1 agent variant (Mutual Reliance Slice 5): the maker/checker sealed run
// with the roles played by LIVE model calls. Runnable script, not a test —
// the deterministic variant lives in test/sealed-run-harness.test.js.
//
//   node scripts/t1-agent-run.mjs [question]
//
// Requirements honored:
//   - single command, readable output
//   - writers touch NO key material: model calls go through the local
//     `claude` CLI's own session auth; this script holds no secrets
//   - the emitted thread is saved under runs/ as the artifact
//
// Pass criterion (T1): the emitted thread passes existing chain verification.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { runSealedRun } = require(path.join(root, "src/harness/sealed-run.js"));
const { verifyReport } = require(path.join(root, "src/report.js"));

const question = process.argv[2] || "Should the toy service pin its dependency versions?";

function claude(rolePrompt) {
  try {
    return execFileSync("claude", ["-p", rolePrompt], {
      encoding: "utf8",
      timeout: 180_000,
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    console.error("\nLive model call failed. This variant needs the `claude` CLI on PATH");
    console.error("(any logged-in Claude Code install works; no API key is read by this script).");
    console.error(`Underlying error: ${error.message}`);
    process.exit(2);
  }
}

function extractJson(text, fields) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`model reply contained no JSON object:\n${text}`);
  }
  const parsed = JSON.parse(match[0]);
  for (const field of fields) {
    if (typeof parsed[field] !== "string" || !parsed[field].trim()) {
      throw new Error(`model reply missing field "${field}":\n${match[0]}`);
    }
  }
  return parsed;
}

console.log(`T1 agent run — question: ${question}\n`);

console.log("1/4 maker: proposing…");
const maker1 = extractJson(
  claude(
    `You are the MAKER in a maker/checker toy decision exercise. The decision question is: "${question}". ` +
    `Reply with ONLY a JSON object: {"proposal": "<one-sentence proposal>", "evidenceSource": "<short source name>", ` +
    `"evidenceFinding": "<one concrete finding supporting the proposal>", "assumption": "<one assumption the proposal rests on>"}`
  ),
  ["proposal", "evidenceSource", "evidenceFinding", "assumption"]
);
console.log(`    proposal: ${maker1.proposal}`);

console.log("2/4 checker: challenging…");
const checker1 = extractJson(
  claude(
    `You are the CHECKER in a maker/checker toy decision exercise. The maker proposes: "${maker1.proposal}" ` +
    `(evidence: ${maker1.evidenceFinding}; assumption: ${maker1.assumption}). Challenge it honestly. ` +
    `Reply with ONLY a JSON object: {"objection": "<your strongest one-sentence objection>"}`
  ),
  ["objection"]
);
console.log(`    objection: ${checker1.objection}`);

console.log("3/4 maker: answering the challenge and deciding…");
const maker2 = extractJson(
  claude(
    `You are the MAKER. Your proposal: "${maker1.proposal}". The checker objects: "${checker1.objection}". ` +
    `Answer the objection concretely, then state the decision. Reply with ONLY a JSON object: ` +
    `{"answer": "<one-sentence concrete answer to the objection>", "decisionSummary": "<one-sentence decision>", ` +
    `"decisionRationale": "<one-sentence rationale referencing the challenge>"}`
  ),
  ["answer", "decisionSummary", "decisionRationale"]
);
console.log(`    answer: ${maker2.answer}`);

console.log("4/4 checker: resolving and reviewing…");
const checker2 = extractJson(
  claude(
    `You are the CHECKER. Your objection was: "${checker1.objection}". The maker answers: "${maker2.answer}". ` +
    `If the answer addresses it, resolve and approve. Reply with ONLY a JSON object: ` +
    `{"resolution": "<one-sentence resolution stating how the objection was addressed>", "reviewNotes": "<one-sentence review note>"}`
  ),
  ["resolution", "reviewNotes"]
);
console.log(`    resolution: ${checker2.resolution}\n`);

const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "clista-t1-agent-"));
const result = runSealedRun({
  cwd,
  threadTitle: "T1 agent sealed run",
  question,
  roles: {
    maker: {
      proposal: maker1.proposal,
      evidenceSource: maker1.evidenceSource,
      evidenceFinding: maker1.evidenceFinding,
      assumption: maker1.assumption,
      decisionSummary: maker2.decisionSummary,
      decisionRationale: maker2.decisionRationale
    },
    checker: {
      objection: checker1.objection,
      resolution: checker2.resolution,
      reviewNotes: checker2.reviewNotes
    }
  }
});

const report = verifyReport(result.events);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(root, "runs", `t1-agent-${stamp}`);
fs.mkdirSync(runDir, { recursive: true });
fs.copyFileSync(path.join(cwd, ".clista", "events.ndjson"), path.join(runDir, "events.ndjson"));
fs.writeFileSync(
  path.join(runDir, "result.json"),
  JSON.stringify(
    {
      question,
      threadId: result.threadId,
      pass: result.pass,
      chainValid: result.integrity.valid,
      validationValid: result.validation.valid,
      reportValid: report.valid,
      reportErrors: report.errors,
      rejections: result.rejections,
      appendedCount: result.appendedCount,
      roles: { maker1, checker1, maker2, checker2 }
    },
    null,
    2
  ) + "\n"
);

console.log(`thread:            ${result.threadId}`);
console.log(`events appended:   ${result.appendedCount}`);
console.log(`chain verifies:    ${result.integrity.valid}`);
console.log(`log validates:     ${result.validation.valid}`);
console.log(`report verifies:   ${report.valid} (${report.errors.length} errors)`);
console.log(`gate rejections:   ${result.rejections.length}`);
console.log(`artifacts:         ${path.relative(process.cwd(), runDir)}`);
console.log(`\nT1 ${result.pass ? "PASS" : "FAIL"} — emitted thread ${result.pass ? "passes" : "does NOT pass"} chain verification`);
process.exit(result.pass ? 0 : 1);
