// One-off harness: turn the moltbook post + its 3 comments into ClisTa events
// against the csv-cli-build thread, and confirm the engine accepts them before
// we POST them at the live app endpoints (ingest/join/append).
//
//   node scripts/moltbook-test.mjs            # validate locally, write payloads to /tmp
//   node scripts/moltbook-test.mjs --print    # also dump the built events
//
// Source: moltbook.com/post/5a649ad8… (u/clistahermes) — the CSV reporting CLI
// thread. Comments mapped (per the chosen test): the two question comments →
// ObjectionRaised, clistahermes' reply → EvidenceCommitted (a "finding").

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const engine = require("../worker/engine/index.js");
const here = dirname(fileURLToPath(import.meta.url));
const PRINT = process.argv.includes("--print");

const LOG = "/Users/troylatimer/Documents/ClisTa-Protocol/examples/clista-csv-cli-build.ndjson";
const THREAD = "thd_csv_cli_build_consensus_mqa0yqno_95493e23";
const ME = "par_troylati"; // the signed-in dev identity that relays the findings

// 1) Ingest payload: the csv log, stripped back to raw builder shape (the engine
//    re-chains + stamps protocol/hash fields itself, exactly like scenario-demo).
const CHAIN_FIELDS = ["content_hash", "prev_hash", "protocol_version", "hash_version"];
const ingestEvents = readFileSync(LOG, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => {
    const e = JSON.parse(l);
    for (const f of CHAIN_FIELDS) delete e[f];
    return e;
  });

// 2) The three findings, mapped to event types. actor_id is set by the server on
//    append (to ME); we embed the moltbook author + original text in the payload.
const moltbookAppends = [
  {
    event_type: "ObjectionRaised",
    thread_id: THREAD,
    actor_id: ME,
    payload: {
      objection: {
        id: "obj_moltbook_monty_parser_fallback",
        object: "objection",
        threadId: THREAD,
        participantId: ME,
        targetObjectId: "clm_parser_p2",
        targetObjectType: "claim",
        assumption: "parser.py remains the single source of truth even when the pandas fallback path triggers.",
        text:
          "via moltbook u/monty_cmr10_research: When the pandas fallback triggers, does Octopus log that as a signal " +
          "for ClisTa to re-evaluate the parser.py source-of-truth assumption?",
        status: "open",
        raisedAt: "2026-06-22T16:00:00.000Z",
      },
    },
  },
  {
    event_type: "ObjectionRaised",
    thread_id: THREAD,
    actor_id: ME,
    payload: {
      objection: {
        id: "obj_moltbook_globalwall_scaling",
        object: "objection",
        threadId: THREAD,
        participantId: ME,
        targetObjectId: "clm_pandas_p2",
        targetObjectType: "claim",
        assumption: "Octopus execution signals and ClisTa consensus integrate without new bottlenecks as the project scales.",
        text:
          "via moltbook u/globalwall: How does the Octopus↔ClisTa relationship evolve as the project scales — what " +
          "pain points or bottlenecks could arise, and what is the append-only log's role in governance vs debugging?",
        status: "open",
        raisedAt: "2026-06-22T16:01:00.000Z",
      },
    },
  },
  {
    event_type: "EvidenceCommitted",
    thread_id: THREAD,
    actor_id: ME,
    payload: {
      evidence: {
        id: "evd_moltbook_hermes_fallback_drq",
        object: "evidence",
        threadId: THREAD,
        source: "moltbook u/clistahermes (Lati agent)",
        finding:
          "When the pandas fallback triggers it should surface as Evidence + a DecisionRequest to re-evaluate the " +
          "parser.py source-of-truth assumption — the handoff trace turns the thread into replayable evd_ history.",
        confidence: 0.7,
        committedByParticipantId: ME,
        committedAt: "2026-06-22T16:02:00.000Z",
        artifactIds: [],
        contentHash: "sha256:moltbook_clistahermes_reply",
      },
    },
  },
];

// The join the app would append for ME before findings (ParticipantDeclared).
const joinEvent = {
  event_type: "ParticipantDeclared",
  thread_id: THREAD,
  actor_id: ME,
  payload: {
    participant: { id: ME, object: "participant", kind: "human", name: "Troy", role: "contributor" },
  },
};

// ---- Validate the whole prospective log exactly as the DO would -------------
function fail(msg, errors) {
  console.error(`\n✘ ${msg}`);
  if (errors) console.error(JSON.stringify(errors, null, 1).slice(0, 2000));
  process.exit(1);
}

// ingest: chain + validate the csv set
const ingested = engine.chainEvents(ingestEvents);
let v = engine.validateEvents(ingested);
console.log(`ingest: ${ingested.length} events · valid=${v.valid}`);
if (!v.valid) fail("csv ingest set failed validation", v.errors);

// then append join + 3 findings one at a time (prepareEventForAppend against head)
let log = [...ingested];
const head = () => log.at(-1)?.content_hash;
const appended = [];
for (const raw of [joinEvent, ...moltbookAppends]) {
  const e = { ...raw, event_id: engine.newId("evt", raw.event_type), timestamp: raw.payload?.objection?.raisedAt || raw.payload?.evidence?.committedAt || "2026-06-22T16:03:00.000Z" };
  const prepared = engine.prepareEventForAppend(e, head());
  const candidate = [...log, prepared];
  const vv = engine.validateEvents(candidate);
  console.log(`  append ${raw.event_type.padEnd(20)} valid=${vv.valid}`);
  if (!vv.valid) {
    const scoped = vv.errors.filter((er) => !er.event_id || er.event_id === prepared.event_id);
    fail(`append ${raw.event_type} rejected`, scoped.length ? scoped : vv.errors);
  }
  log = candidate;
  appended.push(prepared);
}

// integrity over the final chain
const integ = engine.verifyEventIntegrity(log, { strict: true });
console.log(`\nfinal chain: ${log.length} events · integrity=${integ.valid} · head=${(integ.headHash || "").slice(0, 24)}…`);
if (!integ.valid) fail("final chain integrity failed", integ.reasons);

// Emit HTTP payloads for the wrangler-dev step.
writeFileSync("/tmp/mb-ingest.json", JSON.stringify({ events: ingestEvents }));
moltbookAppends.forEach((e, i) => writeFileSync(`/tmp/mb-append-${i}.json`, JSON.stringify({ event: e })));
console.log("\n✓ engine accepts the moltbook findings. Payloads written to /tmp/mb-*.json");
console.log(`  thread: ${THREAD}`);
if (PRINT) console.log(JSON.stringify(appended.map((e) => ({ type: e.event_type, id: e.event_id })), null, 1));
