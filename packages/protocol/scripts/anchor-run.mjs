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
//   * RE-RUNS CONVERGE — anchors are permanent testimony, so anchoring the
//     same run twice must never duplicate anything:
//       - Identity reuse: the hub exposes no identity lookup route
//         (packages/threadhub/src/server.js has only POST /identities), so
//         the first registration persists keys/<writer>.identity.json
//         ({id, public_key, ...}) beside the key files and re-runs reuse
//         it. A receipt whose public_key no longer matches the .pub is a
//         hard error — a stale identity never wears a new key's mask.
//       - Resume/skip: before appending, the target thread's existing
//         records are fetched (GET /t/:key.json) and the already-anchored
//         prefix is verified 1:1, IN ORDER, against the run's events by
//         payload content address; verified events are skipped. Any
//         mismatch in the overlap is a hard error naming the divergent
//         seq — never a silent re-append.
//       - Receipt: anchor-receipt.json is written into the run directory
//         incrementally (after every landed record) and on failure, so a
//         partial anchor is always legible ({landed, total, completed,
//         error?}) and the next run resumes from it (it also pins the
//         target thread). The receipt is run-local anchoring metadata —
//         thread.jsonl / events.ndjson are never touched.
//
// Zero-dep: node:crypto/fs/path only; crypto + canonicalization come from
// the reimplemented spec in ./run-keys.mjs (never imported from ThreadHub).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentAddress, signHashHex, readPublicKeyHex } from "./run-keys.mjs";

const RECORD_SCHEMA = "threadhub.record.v0";

// --- anchors/ANCHORS.md (DR-phase5-topology 4.1–4.3) --------------------
// Anchors live in the emitting repo; the header states the weak claim (4.2)
// and disclaims the strong one (4.3). This exact text is also the committed
// file's header — the test suite holds them identical.
export const ANCHORS_HEADER = `# Run anchors — clista-protocol

DR-phase5-topology 4.1–4.3. A row here claims a weak external timestamp:
the anchored head hash existed no later than the push of the commit that
added the row, witnessed by the hosting provider's git history. It claims
nothing stronger — this is not notarization, no trusted timestamp authority
stands behind these rows, a host or a force-push can rewrite history, and
rows are appended, never edited.

| anchored_at (ISO, UTC) | run | head hash | reportHash | hub thread (slug or —) | note |
| --- | --- | --- | --- | --- | --- |
`;

// Append one row (creating the file with the header if missing). Append-only:
// existing bytes are never rewritten. Convergent: a head already on file is
// never anchored twice — re-runs add no duplicate testimony.
export function appendAnchorRow(anchorsFile, { anchoredAt, run, head, reportHash, thread, note }) {
  const cell = (v) => String(v ?? "—").replace(/\|/g, "\\|").replace(/\s*\r?\n\s*/g, " ").trim() || "—";
  let existing;
  if (fs.existsSync(anchorsFile)) {
    existing = fs.readFileSync(anchorsFile, "utf8");
  } else {
    fs.mkdirSync(path.dirname(anchorsFile), { recursive: true });
    fs.writeFileSync(anchorsFile, ANCHORS_HEADER);
    existing = ANCHORS_HEADER;
  }
  if (head && existing.includes(head)) return false; // already on file — converge, don't duplicate
  fs.appendFileSync(anchorsFile, `| ${[anchoredAt, run, head, reportHash, thread, note].map(cell).join(" | ")} |\n`);
  return true;
}

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
  now = () => new Date().toISOString(),
  anchorsFile // when set, a COMPLETED anchor appends a row (main() passes anchors/ANCHORS.md)
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

  // Register each writer non-custodially: public key only. First
  // registration persists keys/<writer>.identity.json; re-runs reuse it —
  // the hub has no identity lookup route, so the local receipt is the only
  // way a re-run can converge instead of minting duplicates.
  const identities = {};
  for (const writer of writers) {
    const identityFile = path.join(keysDir, `${writer}.identity.json`);
    if (fs.existsSync(identityFile)) {
      const saved = JSON.parse(fs.readFileSync(identityFile, "utf8"));
      if (saved.public_key !== keys[writer].publicKeyHex) {
        throw new Error(
          `${identityFile} was minted for a different public key than ${writer}.pub — ` +
          "refusing to reuse a stale identity (regenerate or remove the receipt deliberately)"
        );
      }
      identities[writer] = saved;
      continue;
    }
    const minted = await post("/identities", {
      display_name: writer,
      kind: "agent",
      public_key: keys[writer].publicKeyHex
    });
    const receipt = {
      id: minted.id,
      public_key: keys[writer].publicKeyHex,
      display_name: writer,
      hub: base,
      minted_at: now()
    };
    fs.writeFileSync(identityFile, JSON.stringify(receipt, null, 2) + "\n");
    identities[writer] = receipt;
  }

  // Target thread, in priority order: explicit --slug; the thread a prior
  // (possibly partial) anchor of this run already landed on; else a new
  // thread created through a disclosed custodial courier (header comment).
  const receiptPath = path.join(runDir, "anchor-receipt.json");
  const priorReceipt = fs.existsSync(receiptPath)
    ? JSON.parse(fs.readFileSync(receiptPath, "utf8"))
    : null;
  let threadKey;
  if (slug) {
    threadKey = slug;
  } else if (priorReceipt?.thread) {
    if (priorReceipt.hub && priorReceipt.hub !== base) {
      throw new Error(`anchor-receipt.json points at ${priorReceipt.hub}, not ${base} — refusing to fork the anchor across hubs`);
    }
    threadKey = priorReceipt.thread;
  } else {
    const courier = await post("/identities", {
      display_name: "anchor-run courier (custodial, thread genesis only)",
      // hub CHECK constraint allows only human|agent|org — the courier is an
      // automated agent; its courier-only role lives in the display_name.
      kind: "agent"
    });
    const created = await post("/threads", {
      title: title ?? `anchored run ${path.basename(runDir)}`,
      question: question ?? null,
      author: courier.id
    });
    threadKey = created.id;
  }

  // Hub CHECK allows genesis|clista.event|attestation|note. Gate-format
  // events are NOT ClisTa-grammar events (the T2b baseline finding turns on
  // exactly that), so they anchor as the generic 'note' kind — the payload
  // carries the gate event verbatim; the label never overclaims grammar.
  const runKind = format === "gate" ? "note" : "clista.event";
  const anchoredAt = now();

  // Resume/skip: whatever this run already anchored must correspond 1:1, in
  // order, to the run's events — matched by payload content address. A
  // divergent overlap is a hard error: anchors are permanent testimony, and
  // silently re-appending would fork it.
  const existing = await get(`/t/${encodeURIComponent(threadKey)}.json`);
  const anchoredPrefix = existing.filter((env) => env.kind === runKind);
  if (anchoredPrefix.length > events.length) {
    throw new Error(
      `thread ${threadKey} already holds ${anchoredPrefix.length} ${runKind} records ` +
      `but the run has only ${events.length} events — wrong thread?`
    );
  }
  const records = anchoredPrefix.map((env, i) => {
    if (contentAddress(env.payload) !== contentAddress(events[i])) {
      throw new Error(
        `anchored record at thread seq ${env.seq} diverges from run event ${i} ` +
        "(payload content addresses differ) — refusing to re-append over a divergent overlap"
      );
    }
    return {
      seq: env.seq,
      record_hash: contentAddress(env),
      writer: writerOf(events[i], format),
      reasoning_ts: events[i].ts ?? events[i].timestamp ?? null,
      recorded_at: env.recorded_at,
      resumed: true
    };
  });

  // The receipt makes the anchor legible at every moment: rewritten after
  // each landed record and on failure, so a partial anchor names exactly
  // what landed and the next run resumes instead of duplicating.
  const writeReceipt = (extra = {}) => {
    const receipt = {
      schema: "clista.anchor_receipt.v0",
      runDir,
      eventsFile: file,
      format,
      hub: base,
      thread: threadKey,
      anchoredAt,
      writers: writers.map((w) => ({ writer: w, identity: identities[w].id, public_key: keys[w].publicKeyHex })),
      total: events.length,
      landed: records.length,
      completed: records.length === events.length,
      records,
      // DR 4.2/4.3: what this receipt does and does not prove.
      proves: "weak external timestamp: these events existed no later than anchoredAt",
      doesNotProve: "notarization or live witnessing; inner ts values are the writers' reasoning-time claims",
      ...extra
    };
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
    return receipt;
  };

  try {
    for (const event of events.slice(records.length)) {
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
        kind: runKind,
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
      threadKey = head.thread; // pin the id for the receipt
      writeReceipt();
    }
  } catch (error) {
    writeReceipt({ error: error.message });
    throw error;
  }

  const verify = await get(`/t/${encodeURIComponent(threadKey)}/verify`);
  threadKey = verify.thread;
  const receipt = writeReceipt({ head: verify.head, valid: verify.valid, slug: verify.slug });

  // Final step: a COMPLETED anchor earns a row in anchors/ANCHORS.md (DR 4.1
  // — anchors live in the emitting repo). NOTE: this script never
  // git-commits. Unlike the studio's server-side anchor hook, protocol runs
  // are orchestrated manually this phase, so the anchor commit — the event
  // that actually starts the weak external timestamp (DR 4.2) — happens at
  // the controller's merge/execution time.
  if (anchorsFile && receipt.completed) {
    const resultFile = path.join(runDir, "result.json");
    const result = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
    appendAnchorRow(anchorsFile, {
      anchoredAt: now(),
      run: path.basename(runDir),
      head: receipt.head,
      reportHash: result?.reportHash ?? "—",
      thread: verify.slug ?? threadKey,
      note: "anchored via /records/signed, keyed writers"
    });
  }
  return receipt;
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
    throw new Error("usage: anchor-run.mjs --run-dir <dir> --keys <keysDir> --hub <url> [--slug <thread>] [--title <t>] [--question <q>] [--anchors <ANCHORS.md>]");
  }
  const receipt = await anchorRun({
    runDir, keysDir, hubUrl,
    slug: args.slug, title: args.title, question: args.question,
    anchorsFile: args.anchors
      ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "anchors", "ANCHORS.md")
  });
  process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`anchor-run: ${error.message}`);
    process.exit(1);
  });
}
