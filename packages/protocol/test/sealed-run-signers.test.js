// sealed-run-signers.test.js — Slice 2 (Phase 5): optional injected signers
// for the T1 harness (DR-phase5-topology rule 5.1 — sign each event AT
// REASONING TIME, never in a bulk pass afterward).
//
// Design under test:
//   * The injected-signer interface is a CONTRACT (Slice 7 injects real
//     per-run key signers): { publicKeyHex, sign(hashHex) -> signatureHex }.
//   * The signature covers the event's content_hash (raw hash bytes — the
//     same preimage /records/signed verifies; spec in scripts/run-keys.mjs).
//   * Signatures land in a sidecar (.clista/signatures.ndjson) written by
//     the SAME gate call that appends the event — the canonical
//     events.ndjson bytes stay identical with or without signers (rule 2.1:
//     the run's event log is canonical until accumulated), and old
//     verifiers keep working unmodified.
//   * WITHOUT signers, behavior is byte-identical to the pre-slice harness:
//     no new fields, no sidecar, same serialization.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { runSealedRun, appendThroughGate, signaturesPath } = require("../src/harness/sealed-run");
const { readEvents } = require("../src/events");
const { serializeEventsNdjson } = require("../src/integrity");

const ROOT = path.resolve(__dirname, "..");
const RUN_KEYS = path.join(ROOT, "scripts", "run-keys.mjs");

const ROLES = {
  maker: {
    proposal: "Adopt tabs over spaces in the toy repo",
    evidenceSource: "toy style survey",
    evidenceFinding: "3 of 4 toy files already use tabs",
    assumption: "the toy repo has no downstream style consumers",
    decisionSummary: "Tabs adopted for the toy repo",
    decisionRationale: "Majority of existing files already comply."
  },
  checker: {
    objection: "Tabs render inconsistently across the toy viewers",
    resolution: "Maker added a toy .editorconfig pinning tab width",
    reviewNotes: "Challenge answered; approving"
  }
};

// The exact field set the pre-slice harness wrote (see src/events.js
// createEvent + prepareEventForAppend). Byte-identity without signers means:
// exactly these fields, nothing else, canonical NDJSON serialization.
const LEGACY_EVENT_KEYS = [
  "actor_id", "content_hash", "event_id", "event_type", "payload",
  "previous_hash", "protocol_version", "thread_id", "timestamp"
];

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clista-t1-signed-"));
}

async function keypairSigners() {
  const { generateKeypair, signHashHex } = await import(RUN_KEYS);
  const make = () => {
    const pair = generateKeypair();
    return {
      publicKeyHex: pair.publicKeyHex,
      sign: (hashHex) => signHashHex(hashHex, pair.privateKeyPem)
    };
  };
  return { par_t1_maker: make(), par_t1_checker: make() };
}

test("without signers: sealed run output is byte-identical to the legacy shape", () => {
  const cwd = tempCwd();
  const result = runSealedRun({
    cwd, threadTitle: "T1 no signers", question: "unchanged?", roles: ROLES
  });
  assert.equal(result.pass, true);

  // No signature artifacts of any kind.
  assert.ok(!fs.existsSync(signaturesPath(cwd)), "no signatures sidecar without signers");
  assert.equal(result.signatures, undefined);

  // Every event carries exactly the legacy field set (first event has no
  // previous_hash; hash_version was introduced with createEvent defaults).
  const events = readEvents(cwd);
  for (const [i, event] of events.entries()) {
    const expected = LEGACY_EVENT_KEYS
      .concat(["hash_version"])
      .filter((k) => (i === 0 ? k !== "previous_hash" : true))
      .sort();
    assert.deepEqual(Object.keys(event).sort(), expected, `event ${i} field set unchanged`);
  }

  // The file bytes are exactly the canonical serialization of those events —
  // the same writer path as before this slice.
  const raw = fs.readFileSync(path.join(cwd, ".clista", "events.ndjson"), "utf8");
  assert.equal(raw, serializeEventsNdjson(events));
});

test("with signers: canonical event log unchanged; every event signed at append time", async () => {
  const { verifyHashHex } = await import(RUN_KEYS);
  const signers = await keypairSigners();
  const cwd = tempCwd();

  const result = runSealedRun({
    cwd, threadTitle: "T1 signed", question: "signed at reasoning time?", roles: ROLES, signers
  });
  assert.equal(result.pass, true);

  // Rule 2.1: the canonical thread bytes do not change under custody — the
  // event field set is identical to the unsigned run.
  const events = readEvents(cwd);
  for (const [i, event] of events.entries()) {
    const expected = LEGACY_EVENT_KEYS
      .concat(["hash_version"])
      .filter((k) => (i === 0 ? k !== "previous_hash" : true))
      .sort();
    assert.deepEqual(Object.keys(event).sort(), expected, `event ${i} field set unchanged`);
  }

  // One signature per appended event, written by the same gate call
  // (reasoning time), covering the event's content_hash, verifiable against
  // the injected role key.
  const sidecar = fs.readFileSync(signaturesPath(cwd), "utf8")
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
  assert.equal(sidecar.length, events.length, "every appended event has a signature");
  assert.deepEqual(result.signatures, sidecar);

  events.forEach((event, i) => {
    const sig = sidecar[i];
    assert.equal(sig.schema, "clista.run_signature.v0");
    assert.equal(sig.event_id, event.event_id);
    assert.equal(sig.content_hash, event.content_hash);
    assert.equal(sig.actor_id, event.actor_id);
    assert.equal(sig.public_key, signers[event.actor_id].publicKeyHex, "signed by the event's own role key");
    assert.equal(
      verifyHashHex(event.content_hash.slice(7), sig.signature, sig.public_key),
      true,
      `signature ${i} must verify over the content hash`
    );
    // Cross-check: it must NOT verify under the other role's key.
    const other = event.actor_id === "par_t1_maker" ? "par_t1_checker" : "par_t1_maker";
    assert.equal(
      verifyHashHex(event.content_hash.slice(7), sig.signature, signers[other].publicKeyHex),
      false
    );
  });
});

test("appendThroughGate: a signer signs its own append; rejection signs nothing", async () => {
  const signers = await keypairSigners();
  const cwd = tempCwd();

  // Valid append with a signer.
  const ok = appendThroughGate(
    {
      type: "ParticipantAdded", threadId: "thd_gate_sig", actorId: "par_t1_maker",
      payload: { participant: { id: "par_t1_maker", object: "participant", kind: "agent", name: "M", role: "maker" } }
    },
    cwd,
    signers.par_t1_maker
  );
  assert.equal(ok.valid, true);
  assert.equal(ok.signature.content_hash, ok.event.content_hash);
  assert.equal(ok.signature.public_key, signers.par_t1_maker.publicKeyHex);

  // A rejected candidate is never signed: nothing new in the sidecar.
  const sidecarBefore = fs.readFileSync(signaturesPath(cwd), "utf8");
  const rejected = appendThroughGate(
    {
      type: "ThreadCreated", threadId: "thd_gate_sig", actorId: "par_never_declared",
      payload: {
        thread: {
          id: "thd_gate_sig", object: "thread", title: "reject", question: "?",
          status: "active", participantIds: ["par_never_declared"],
          createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z"
        }
      }
    },
    cwd,
    signers.par_t1_checker
  );
  assert.equal(rejected.valid, false);
  assert.equal(rejected.signature, undefined);
  assert.equal(fs.readFileSync(signaturesPath(cwd), "utf8"), sidecarBefore);
});

test("a signers map missing an appending writer throws — partial custody is misconfiguration", async () => {
  const signers = await keypairSigners();
  delete signers.par_t1_checker; // maker keyed, checker forgotten
  const cwd = tempCwd();

  // Rule 5.1: every writer keyed. A provided-but-incomplete signers map must
  // never silently append unsigned events for the missing writer.
  assert.throws(
    () => runSealedRun({
      cwd, threadTitle: "T1 partial custody", question: "misconfigured?", roles: ROLES, signers
    }),
    /par_t1_checker/
  );

  // Everything that DID land was signed; nothing unsigned slipped through.
  const events = readEvents(cwd);
  const sidecar = fs.existsSync(signaturesPath(cwd))
    ? fs.readFileSync(signaturesPath(cwd), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse)
    : [];
  assert.equal(sidecar.length, events.length, "every appended event carries a signature");
  assert.ok(events.every((e) => e.actor_id === "par_t1_maker"), "no unsigned checker event was appended");
});
