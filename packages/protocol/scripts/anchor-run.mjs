#!/usr/bin/env node
// anchor-run.mjs — post-hoc anchoring of a sealed run into ThreadHub
// (Phase 5 Slice 2; DR-phase5-topology rules 4.2/4.3 and 5.1).
//
//   node scripts/anchor-run.mjs --run-dir <dir> --keys <keysDir> \
//     --hub <url> [--slug <existing-thread>] [--title <t>] [--question <q>]
//
// What this does — and, more importantly, what it claims:
//
//   * Every run event is wrapped VERBATIM as the payload of a signed
//     threadhub.record.v0 envelope and submitted to
//     POST /t/:thread/records/signed (envelope spec:
//     packages/threadhub/adapters/octopus.js send(); verify path:
//     src/hub.js appendSigned()).
//
//   * TWO-TIMESTAMP HONESTY: the envelope's recorded_at is the ANCHOR time
//     (when this script ran); the payload's inner ts (gate.py runs) or
//     timestamp (ClisTa runs) stays the REASONING-TIME claim, untouched.
//     That distinction IS the honest post-hoc statement: the anchor proves
//     the events existed no later than anchoring (a weak external
//     timestamp, DR 4.2), and never pretends the hub witnessed them live.
//     Anchoring is testimony about the past — new keys never launder old
//     provenance, and this script NEVER rewrites thread.jsonl (or any run
//     artifact): it only reads the run dir.
//
//   * Writers are non-custodial (DR 5.1): each distinct writer in the run is
//     registered via POST /identities { display_name, kind, public_key } —
//     public key only; the <writer>.pem stays local and signs client-side.
//     The signature preimage is the raw 32 bytes of the envelope's
//     record_hash hex (see scripts/run-keys.mjs for the derived spec).
//
//   * Thread creation: a non-custodial identity cannot create a thread (the
//     genesis record is hub-signed, hub.js createThread -> append requires a
//     custodial key). So when no --slug names an existing thread, this
//     script mints one DISCLOSED custodial courier identity used only for
//     POST /threads; every anchored record is signed by the run's own
//     writer keys, never the courier's.
//
// Zero-dep: node:crypto/fs/path only; crypto + canonicalization come from
// the reimplemented spec in ./run-keys.mjs (never imported from ThreadHub).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentAddress, signHashHex, readPublicKeyHex } from "./run-keys.mjs";

const RECORD_SCHEMA = "threadhub.record.v0";

// Load a run's events: gate.py runs keep thread.jsonl in the run dir;
// harness runs keep events.ndjson (at the run dir root or under .clista/).
export function loadRunEvents(runDir) {
  const candidates = [
    { file: path.join(runDir, "thread.jsonl"), format: "gate" },
    { file: path.join(runDir, "events.ndjson"), format: "clista" },
    { file: path.join(runDir, ".clista", "events.ndjson"), format: "clista" }
  ];
  for (const { file, format } of candidates) {
    if (fs.existsSync(file)) {
      const events = fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
      if (!events.length) throw new Error(`${file} contains no events`);
      return { file, format, events };
    }
  }
  throw new Error(`no thread.jsonl or events.ndjson found under ${runDir}`);
}

export function writerOf(event, format) {
  const writer = format === "gate" ? event.writer : event.actor_id;
  if (!writer) throw new Error(`event has no ${format === "gate" ? "writer" : "actor_id"}: ${JSON.stringify(event).slice(0, 120)}`);
  return writer;
}

// Envelope exactly per adapters/octopus.js send(). recorded_at is the anchor
// time; the reasoning-time claim lives inside payload (ts/timestamp).
export function buildEnvelope({ threadId, seq, prev, author, authorKeyHex, recordedAt, kind, payload }) {
  return {
    hub: RECORD_SCHEMA,
    thread: threadId,
    seq,
    prev,
    author,
    author_key: authorKeyHex,
    recorded_at: recordedAt,
    kind,
    payload
  };
}

async function request(fetchImpl, url, options) {
  const res = await fetchImpl(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`${options?.method || "GET"} ${url}: ${res.status} ${body.error ?? ""}`);
  }
  return res.json();
}

export async function anchorRun({
  runDir,
  keysDir,
  hubUrl,
  slug,
  title,
  question,
  fetchImpl = fetch,
  now = () => new Date().toISOString()
}) {
  const base = hubUrl.replace(/\/$/, "");
  const { file, format, events } = loadRunEvents(runDir);

  // Fail fast, BEFORE any hub write: every distinct writer needs its key
  // files. A partial anchor would be worse than none.
  const writers = [...new Set(events.map((e) => writerOf(e, format)))];
  const keys = {};
  for (const writer of writers) {
    const pemPath = path.join(keysDir, `${writer}.pem`);
    const pubPath = path.join(keysDir, `${writer}.pub`);
    if (!fs.existsSync(pemPath) || !fs.existsSync(pubPath)) {
      throw new Error(`missing key files for writer "${writer}" (${pemPath} / ${pubPath})`);
    }
    keys[writer] = {
      privateKeyPem: fs.readFileSync(pemPath, "utf8"),
      publicKeyHex: readPublicKeyHex(pubPath)
    };
  }

  const post = (p, body) => request(fetchImpl, base + p, { method: "POST", body: JSON.stringify(body) });
  const get = (p) => request(fetchImpl, base + p);

  // Register each writer non-custodially: public key only.
  const identities = {};
  for (const writer of writers) {
    identities[writer] = await post("/identities", {
      display_name: writer,
      kind: "agent",
      public_key: keys[writer].publicKeyHex
    });
  }

  // Target thread: an existing one when --slug is given; otherwise create it
  // through a disclosed custodial courier (see header comment).
  let threadKey;
  if (slug) {
    threadKey = slug;
  } else {
    const courier = await post("/identities", {
      display_name: "anchor-run courier (custodial, thread genesis only)",
      kind: "orchestrator"
    });
    const created = await post("/threads", {
      title: title ?? `anchored run ${path.basename(runDir)}`,
      question: question ?? null,
      author: courier.id
    });
    threadKey = created.id;
  }

  const anchoredAt = now();
  const records = [];
  for (const event of events) {
    const writer = writerOf(event, format);
    // Chain position from the hub's verify view; the hub re-checks on
    // submit, so a race means a clean stale-position rejection, not a fork.
    const head = await get(`/t/${encodeURIComponent(threadKey)}/verify`);
    const envelope = buildEnvelope({
      threadId: head.thread,
      seq: head.records,
      prev: head.head,
      author: identities[writer].id,
      authorKeyHex: keys[writer].publicKeyHex,
      recordedAt: anchoredAt, // anchor time — NOT the reasoning time
      kind: format === "gate" ? "run.event" : "clista.event",
      payload: event // verbatim; inner ts/timestamp stays the reasoning-time claim
    });
    const recordHash = contentAddress(envelope);
    const signature = signHashHex(recordHash.slice(7), keys[writer].privateKeyPem);
    const accepted = await post(`/t/${encodeURIComponent(threadKey)}/records/signed`, { envelope, signature });
    records.push({
      seq: accepted.seq,
      record_hash: accepted.record_hash,
      writer,
      reasoning_ts: event.ts ?? event.timestamp ?? null,
      recorded_at: anchoredAt
    });
  }

  const verify = await get(`/t/${encodeURIComponent(threadKey)}/verify`);
  return {
    schema: "clista.anchor_receipt.v0",
    runDir,
    eventsFile: file,
    format,
    hub: base,
    thread: verify.thread,
    anchoredAt,
    writers: writers.map((w) => ({ writer: w, identity: identities[w].id, public_key: keys[w].publicKeyHex })),
    records,
    head: verify.head,
    valid: verify.valid,
    // DR 4.2/4.3: what this receipt does and does not prove.
    proves: "weak external timestamp: these events existed no later than anchoredAt",
    doesNotProve: "notarization or live witnessing; inner ts values are the writers' reasoning-time claims"
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`unexpected argument ${arg}`);
    const name = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined) throw new Error(`missing value for --${name}`);
    args[name] = value;
    i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args["run-dir"];
  const keysDir = args.keys;
  const hubUrl = args.hub;
  if (!runDir || !keysDir || !hubUrl) {
    throw new Error("usage: anchor-run.mjs --run-dir <dir> --keys <keysDir> --hub <url> [--slug <thread>] [--title <t>] [--question <q>]");
  }
  const receipt = await anchorRun({
    runDir, keysDir, hubUrl,
    slug: args.slug, title: args.title, question: args.question
  });
  process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`anchor-run: ${error.message}`);
    process.exit(1);
  });
}
