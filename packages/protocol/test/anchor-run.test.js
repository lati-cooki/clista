// anchor-run.test.js — Slice 2 (Phase 5): post-hoc anchoring of a sealed
// run's events into ThreadHub as signed threadhub.record.v0 envelopes
// (DR-phase5-topology rules 4.2/4.3: an anchor proves a weak external
// timestamp, never notarization).
//
// The honesty core under test is the TWO-TIMESTAMP distinction: the
// envelope's recorded_at is the anchor time (when the record landed on the
// hub); the payload's inner ts/timestamp stays the reasoning-time claim.
// Anchoring is testimony about the past — it never rewrites thread.jsonl.
//
// No live hub: a fake fetch implements the hub's verify surface, including
// the real appendSigned checks (envelope shape, author_key match, signature
// over the record hash, chain position), so a drifting client fails here.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const ANCHOR_RUN = path.join(ROOT, "scripts", "anchor-run.mjs");
const RUN_KEYS = path.join(ROOT, "scripts", "run-keys.mjs");

const ANCHOR_TIME = "2026-07-12T20:00:00.000Z";

async function mods() {
  const [anchor, keys] = await Promise.all([import(ANCHOR_RUN), import(RUN_KEYS)]);
  return { ...anchor, ...keys };
}

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// --- a minimal in-memory ThreadHub running the REAL appendSigned checks ---
function fakeHub({ contentAddress, verifyHashHex }) {
  const state = { identities: [], threads: [], requests: [] };
  let nextId = 0;

  const jsonRes = (status, body) => ({
    ok: status < 400,
    status,
    json: async () => body
  });

  const fetchImpl = async (url, opts = {}) => {
    const { pathname } = new URL(url);
    const method = opts.method || "GET";
    const body = opts.body ? JSON.parse(opts.body) : undefined;
    state.requests.push({ method, pathname, body, raw: opts.body });

    if (method === "POST" && pathname === "/identities") {
      const identity = {
        id: `id_fake_${nextId++}`,
        display_name: body.display_name,
        kind: body.kind,
        public_key: body.public_key ?? `fakecustodial${nextId}`,
        custodial: !body.public_key
      };
      state.identities.push(identity);
      return jsonRes(201, { ...identity, publicKey: identity.public_key });
    }

    if (method === "POST" && pathname === "/threads") {
      if (!state.identities.some((i) => i.id === body.author)) {
        return jsonRes(404, { error: `unknown identity: ${body.author}`, code: "not_found" });
      }
      const id = `thd_fake_${nextId++}`;
      const slug = String(body.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const genesisHash = contentAddress({ genesis: id, title: body.title });
      const thread = { id, slug, title: body.title, records: [{ record_hash: genesisHash, seq: 0 }] };
      state.threads.push(thread);
      return jsonRes(201, { id, slug, title: body.title, genesisHash });
    }

    const threadFor = (key) => state.threads.find((t) => t.id === key || t.slug === key);

    let m;
    if ((m = pathname.match(/^\/t\/([^/]+)\.json$/)) && method === "GET") {
      const thread = threadFor(decodeURIComponent(m[1]));
      if (!thread) return jsonRes(404, { error: "thread not found", code: "not_found" });
      // exportThread: the full envelope chain (genesis included).
      return jsonRes(200, thread.records.map((r) => r.envelope ?? {
        hub: "threadhub.record.v0", thread: thread.id, seq: r.seq, prev: null,
        author: "id_genesis", author_key: "", recorded_at: "", kind: "genesis", payload: {}
      }));
    }
    if ((m = pathname.match(/^\/t\/([^/]+)\/verify$/)) && method === "GET") {
      const thread = threadFor(decodeURIComponent(m[1]));
      if (!thread) return jsonRes(404, { error: "thread not found", code: "not_found" });
      const head = thread.records.at(-1);
      return jsonRes(200, {
        thread: thread.id, slug: thread.slug,
        records: thread.records.length, head: head.record_hash,
        valid: true, trusted: false, problems: []
      });
    }

    if ((m = pathname.match(/^\/t\/([^/]+)\/records\/signed$/)) && method === "POST") {
      const thread = threadFor(decodeURIComponent(m[1]));
      if (!thread) return jsonRes(404, { error: "thread not found", code: "not_found" });
      const { envelope, signature } = body;
      // The real hub.js appendSigned checks, in order:
      if (!envelope || envelope.hub !== "threadhub.record.v0") {
        return jsonRes(400, { error: "envelope.hub must be threadhub.record.v0", code: "bad_request" });
      }
      if (envelope.thread !== thread.id) {
        return jsonRes(400, { error: "envelope.thread does not match thread", code: "bad_request" });
      }
      const author = state.identities.find((i) => i.id === envelope.author);
      if (!author) return jsonRes(404, { error: `unknown identity: ${envelope.author}`, code: "not_found" });
      if (envelope.author_key !== author.public_key) {
        return jsonRes(400, { error: "author_key mismatch", code: "author_key_mismatch" });
      }
      const record_hash = contentAddress(envelope);
      if (!verifyHashHex(record_hash.slice(7), signature ?? "", envelope.author_key)) {
        return jsonRes(400, { error: "invalid signature", code: "invalid_signature" });
      }
      const head = thread.records.at(-1);
      if (envelope.prev !== head.record_hash || envelope.seq !== head.seq + 1) {
        return jsonRes(409, { error: "stale chain position", code: "stale_chain" });
      }
      thread.records.push({ record_hash, seq: envelope.seq, envelope, signature });
      return jsonRes(201, { record_hash, seq: envelope.seq });
    }

    return jsonRes(404, { error: "not found", code: "not_found" });
  };

  return { state, fetchImpl };
}

// --- a toy gate.py-format run dir: thread.jsonl + keys/<writer>.pem ---
async function gateStyleRunDir() {
  const { writeRoleKeypair, sha256hex, signHashHex } = await mods();
  const runDir = tmpDir("clista-anchor-gate-");
  const keysDir = path.join(runDir, "keys");
  const keys = {
    ORCHESTRATOR: writeRoleKeypair(keysDir, "ORCHESTRATOR"),
    MAKER: writeRoleKeypair(keysDir, "MAKER")
  };

  const canonical = (obj) => JSON.stringify(sortKeys(obj));
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((acc, k) => ((acc[k] = sortKeys(value[k])), acc), {});
    }
    return value;
  }

  const events = [];
  const push = (writer, type, payload, ts) => {
    const sans = { seq: events.length, ts, writer, type, payload, prev: events.length ? events.at(-1).hash : "0".repeat(64) };
    const hash = sha256hex(canonical(sans));
    const sig = signHashHex(hash, fs.readFileSync(keys[writer].pemPath, "utf8"));
    events.push({ ...sans, hash, sig });
  };
  push("ORCHESTRATOR", "ThreadOpened", { thread: "toy-anchor-run" }, "2026-07-12T10:00:00+00:00");
  push("ORCHESTRATOR", "WriterRegistered", { writer: "MAKER", role: "maker" }, "2026-07-12T10:00:05+00:00");
  push("MAKER", "ProposalMade", { text: "pin the toy dependency" }, "2026-07-12T10:01:00+00:00");

  fs.writeFileSync(
    path.join(runDir, "thread.jsonl"),
    events.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  return { runDir, keysDir, events, keys };
}

function snapshotDir(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      const p = path.join(entry.parentPath ?? entry.path, entry.name);
      out[p] = fs.readFileSync(p);
    }
  }
  return out;
}

test("anchorRun: gate.py-format run anchors per-event with signed envelopes", async () => {
  const m = await mods();
  const { runDir, keysDir, events } = await gateStyleRunDir();
  const hub = fakeHub(m);
  const before = snapshotDir(runDir);

  const receipt = await m.anchorRun({
    runDir,
    keysDir,
    hubUrl: "http://fake-hub:8110",
    title: "toy-anchor-run",
    question: "anchored?",
    fetchImpl: hub.fetchImpl,
    now: () => ANCHOR_TIME
  });

  // Non-custodial registration happened for each distinct writer, pubkey only.
  const identityPosts = hub.state.requests.filter((r) => r.method === "POST" && r.pathname === "/identities");
  const nonCustodial = identityPosts.filter((r) => r.body.public_key);
  assert.equal(nonCustodial.length, 2, "each distinct writer registers once with its public key");
  assert.deepEqual(
    nonCustodial.map((r) => r.body.display_name).sort(),
    ["MAKER", "ORCHESTRATOR"]
  );
  for (const post of nonCustodial) {
    assert.match(post.body.public_key, /^[0-9a-f]{64}$/);
  }
  // Private key material never crosses the wire.
  for (const r of hub.state.requests) {
    assert.ok(!/PRIVATE/i.test(r.raw ?? ""), "no PEM/private material in any request body");
  }

  // One signed record per run event, accepted by the real appendSigned checks.
  const thread = hub.state.threads[0];
  assert.equal(thread.records.length, 1 + events.length, "genesis + one record per event");
  const anchored = thread.records.slice(1);

  anchored.forEach((rec, i) => {
    const envelope = rec.envelope;
    // Envelope shape exactly per adapters/octopus.js send().
    assert.deepEqual(
      Object.keys(envelope).sort(),
      ["author", "author_key", "hub", "kind", "payload", "prev", "recorded_at", "seq", "thread"]
    );
    assert.equal(envelope.hub, "threadhub.record.v0");
    assert.equal(envelope.seq, i + 1);
    // Two-timestamp honesty: recorded_at is the anchor time; the payload's
    // inner ts stays the reasoning-time claim, verbatim.
    assert.equal(envelope.recorded_at, ANCHOR_TIME);
    assert.deepEqual(envelope.payload, events[i]);
    assert.equal(envelope.payload.ts, events[i].ts);
    assert.notEqual(envelope.payload.ts, envelope.recorded_at);
    assert.equal(envelope.kind, "run.event");
    // The writer's own key signed it.
    const writerPub = fs.readFileSync(path.join(keysDir, `${events[i].writer}.pub`), "utf8").trim();
    assert.equal(envelope.author_key, writerPub);
    assert.equal(m.verifyHashHex(m.contentAddress(envelope).slice(7), rec.signature, writerPub), true);
  });

  // Receipt reports the anchored chain.
  assert.equal(receipt.records.length, events.length);
  assert.equal(receipt.head, thread.records.at(-1).record_hash);
  assert.equal(receipt.anchoredAt, ANCHOR_TIME);
  assert.equal(receipt.thread, thread.id);
  assert.equal(receipt.completed, true);

  // The run's testimony is never edited: every pre-existing file (the event
  // log above all) is byte-identical after anchoring. The only additions are
  // run-local anchoring metadata: anchor-receipt.json and the writers'
  // keys/<writer>.identity.json registration receipts.
  const after = snapshotDir(runDir);
  for (const [file, bytes] of Object.entries(before)) {
    assert.deepEqual(after[file], bytes, `${file} must be byte-identical`);
  }
  const added = Object.keys(after).filter((f) => !(f in before)).map((f) => path.relative(runDir, f)).sort();
  assert.deepEqual(added, [
    "anchor-receipt.json",
    path.join("keys", "MAKER.identity.json"),
    path.join("keys", "ORCHESTRATOR.identity.json")
  ]);

  // The persisted receipt makes the anchor legible on its own.
  const saved = JSON.parse(fs.readFileSync(path.join(runDir, "anchor-receipt.json"), "utf8"));
  assert.equal(saved.completed, true);
  assert.equal(saved.landed, events.length);
  assert.equal(saved.total, events.length);
  assert.equal(saved.thread, thread.id);
  assert.deepEqual(saved.records.map((r) => r.seq), anchored.map((r) => r.seq));
});

test("anchorRun: ClisTa events.ndjson run anchors as kind clista.event", async () => {
  const m = await mods();
  const runDir = tmpDir("clista-anchor-ndjson-");
  const keysDir = path.join(runDir, "keys");
  m.writeRoleKeypair(keysDir, "par_t1_maker");

  const event = {
    event_id: "evt_toy_1",
    event_type: "ClaimCreated",
    thread_id: "thd_toy",
    actor_id: "par_t1_maker",
    timestamp: "2026-07-12T11:00:00.000Z",
    payload: { claim: { id: "clm_toy", object: "claim", text: "toy" } },
    protocol_version: "clista.protocol.v0",
    hash_version: "clista.event_hash.v1",
    content_hash: "sha256:" + "ab".repeat(32)
  };
  fs.writeFileSync(path.join(runDir, "events.ndjson"), JSON.stringify(event) + "\n");

  const hub = fakeHub(m);
  const receipt = await m.anchorRun({
    runDir, keysDir, hubUrl: "http://fake-hub:8110",
    title: "toy clista anchor", fetchImpl: hub.fetchImpl, now: () => ANCHOR_TIME
  });

  const rec = hub.state.threads[0].records.at(-1);
  assert.equal(rec.envelope.kind, "clista.event");
  assert.deepEqual(rec.envelope.payload, event);
  assert.equal(rec.envelope.payload.timestamp, event.timestamp); // reasoning-time claim
  assert.equal(rec.envelope.recorded_at, ANCHOR_TIME); // anchor-time statement
  assert.equal(receipt.records.length, 1);
});

test("anchorRun: refuses up front when a writer's key file is missing", async () => {
  const m = await mods();
  const { runDir, keysDir } = await gateStyleRunDir();
  fs.rmSync(path.join(keysDir, "MAKER.pem"));
  const hub = fakeHub(m);

  await assert.rejects(
    m.anchorRun({
      runDir, keysDir, hubUrl: "http://fake-hub:8110",
      title: "toy", fetchImpl: hub.fetchImpl, now: () => ANCHOR_TIME
    }),
    /MAKER/
  );
  // Fail-fast: nothing was submitted to the hub before the key check.
  assert.equal(hub.state.requests.length, 0);
});

test("anchorRun: targets an existing thread when slug is given", async () => {
  const m = await mods();
  const { runDir, keysDir, events } = await gateStyleRunDir();
  const hub = fakeHub(m);

  // Pre-create the thread on the hub (as the controller would have).
  const courier = await (await hub.fetchImpl("http://fake-hub:8110/identities", {
    method: "POST", body: JSON.stringify({ display_name: "controller", kind: "human" })
  })).json();
  const existing = await (await hub.fetchImpl("http://fake-hub:8110/threads", {
    method: "POST", body: JSON.stringify({ title: "pre made thread", author: courier.id })
  })).json();

  const receipt = await m.anchorRun({
    runDir, keysDir, hubUrl: "http://fake-hub:8110", slug: existing.slug,
    fetchImpl: hub.fetchImpl, now: () => ANCHOR_TIME
  });

  assert.equal(hub.state.threads.length, 1, "no second thread was created");
  assert.equal(receipt.thread, existing.id);
  assert.equal(hub.state.threads[0].records.length, 1 + events.length);
});

// ---------------------------------------------------------------------------
// Anchors are permanent testimony: re-runs must CONVERGE — never duplicate
// identities, never re-append anchored events, and always leave a legible
// receipt of exactly what landed.
// ---------------------------------------------------------------------------

test("anchorRun: re-running converges — no duplicate identities, no duplicate records", async () => {
  const m = await mods();
  const { runDir, keysDir, events } = await gateStyleRunDir();
  const hub = fakeHub(m);
  const opts = {
    runDir, keysDir, hubUrl: "http://fake-hub:8110",
    title: "toy-idempotent", fetchImpl: hub.fetchImpl, now: () => ANCHOR_TIME
  };

  const first = await m.anchorRun(opts);
  const identitiesAfterFirst = hub.state.identities.length;
  const recordsAfterFirst = hub.state.threads[0].records.length;

  // Identity registration receipts persist beside the keys.
  for (const writer of ["ORCHESTRATOR", "MAKER"]) {
    const saved = JSON.parse(fs.readFileSync(path.join(keysDir, `${writer}.identity.json`), "utf8"));
    assert.match(saved.id, /^id_/);
    assert.equal(saved.public_key, fs.readFileSync(path.join(keysDir, `${writer}.pub`), "utf8").trim());
  }

  // Second run: same thread (via the persisted anchor receipt), zero new
  // identities, zero new records, still a complete receipt.
  const second = await m.anchorRun(opts);
  assert.equal(hub.state.threads.length, 1, "the receipt's thread is reused — no second thread");
  assert.equal(hub.state.identities.length, identitiesAfterFirst, "no duplicate hub identities");
  assert.equal(hub.state.threads[0].records.length, recordsAfterFirst, "no duplicate records");
  assert.equal(second.thread, first.thread);
  assert.equal(second.completed, true);
  assert.equal(second.records.length, events.length);
  assert.equal(second.head, first.head, "converged to the same head");

  // A tampered identity receipt must never let one key wear another's mask.
  const idFile = path.join(keysDir, "MAKER.identity.json");
  const saved = JSON.parse(fs.readFileSync(idFile, "utf8"));
  saved.public_key = "ff".repeat(32);
  fs.writeFileSync(idFile, JSON.stringify(saved));
  await assert.rejects(m.anchorRun(opts), /different public key/);
});

test("anchorRun: mid-run hub failure leaves a partial receipt; re-run resumes, never re-appends", async () => {
  const m = await mods();
  const { runDir, keysDir, events } = await gateStyleRunDir();
  const hub = fakeHub(m);

  // Fail the SECOND signed append (after 1 of 3 events landed).
  let signedPosts = 0;
  let failing = true;
  const flakyFetch = async (url, opts) => {
    if (failing && /\/records\/signed$/.test(new URL(url).pathname) && (opts?.method ?? "GET") === "POST") {
      signedPosts += 1;
      if (signedPosts === 2) throw new Error("hub unreachable (injected)");
    }
    return hub.fetchImpl(url, opts);
  };
  const opts = {
    runDir, keysDir, hubUrl: "http://fake-hub:8110",
    title: "toy-resume", fetchImpl: flakyFetch, now: () => ANCHOR_TIME
  };

  await assert.rejects(m.anchorRun(opts), /hub unreachable/);

  // The partial anchor is legible: receipt says exactly what landed.
  const partial = JSON.parse(fs.readFileSync(path.join(runDir, "anchor-receipt.json"), "utf8"));
  assert.equal(partial.completed, false);
  assert.equal(partial.landed, 1);
  assert.equal(partial.total, events.length);
  assert.match(partial.error, /hub unreachable/);
  assert.equal(hub.state.threads[0].records.length, 2, "genesis + the one landed record");

  // Heal the hub; the re-run skips the anchored prefix and lands the rest.
  failing = false;
  const receipt = await m.anchorRun(opts);
  assert.equal(receipt.completed, true);
  assert.equal(receipt.records.length, events.length);
  assert.equal(hub.state.threads[0].records.length, 1 + events.length, "each event anchored exactly once");
  assert.equal(hub.state.identities.length, 3, "2 writers + 1 courier — no re-mints on resume");
  // The resumed prefix is reported from the hub's own chain.
  assert.equal(receipt.records[0].resumed, true);
  assert.equal(receipt.records[1].resumed, undefined);

  const final = JSON.parse(fs.readFileSync(path.join(runDir, "anchor-receipt.json"), "utf8"));
  assert.equal(final.completed, true);
  assert.equal(final.landed, events.length);
});

test("anchorRun: a divergent anchored prefix is a hard error, never a silent re-append", async () => {
  const m = await mods();
  const { runDir, keysDir } = await gateStyleRunDir();
  const hub = fakeHub(m);
  const opts = {
    runDir, keysDir, hubUrl: "http://fake-hub:8110",
    title: "toy-diverge", fetchImpl: hub.fetchImpl, now: () => ANCHOR_TIME
  };
  await m.anchorRun(opts);
  const recordsBefore = hub.state.threads[0].records.length;

  // The local log now disagrees with what was anchored (event 0 edited).
  const logPath = path.join(runDir, "thread.jsonl");
  const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  lines[0].payload.thread = "a-different-story";
  fs.writeFileSync(logPath, lines.map((e) => JSON.stringify(e)).join("\n") + "\n");

  await assert.rejects(m.anchorRun(opts), (error) => {
    assert.match(error.message, /diverge/i);
    assert.match(error.message, /seq 1/, "names the divergent thread seq");
    return true;
  });
  assert.equal(hub.state.threads[0].records.length, recordsBefore, "nothing was appended");
});
