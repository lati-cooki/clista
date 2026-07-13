// run-keys.test.js — Slice 2 (Phase 5, DR-phase5-topology rule 5.1): per-run
// non-custodial ed25519 writer keys.
//
// scripts/run-keys.mjs REIMPLEMENTS ThreadHub's signing/canonicalization spec
// (packages/threadhub/src/identity.js + src/canonical.js) — it never imports
// it (DR: integration via HTTP + event vocabulary only). Canonicalization
// drift between the two implementations is THE named risk of this slice, so
// the literal vectors below are COPIED from ThreadHub's test suite fixtures
// and pinned here: if either implementation drifts, these hashes break.
//
// Key hygiene under test (DR rule 5.5): <role>.pem is 0600, never printed,
// and git-ignored; only the .pub (public key hex) is shareable.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const RUN_KEYS = path.join(ROOT, "scripts", "run-keys.mjs");

function loadRunKeys() {
  return import(RUN_KEYS);
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clista-run-keys-"));
}

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [RUN_KEYS, ...args], { encoding: "utf8", ...options });
}

// ---------------------------------------------------------------------------
// Canonicalization vectors — copied from ThreadHub's suite.
// ---------------------------------------------------------------------------

test("canonicalize: order-independent, matches ThreadHub's canonical form", async () => {
  const { canonicalize, contentAddress } = await loadRunKeys();
  // Property copied from packages/threadhub/test/test.js
  // ("canonical JSON is order-independent").
  assert.equal(
    contentAddress({ b: 1, a: [2, { z: 3, y: 4 }] }),
    contentAddress({ a: [2, { y: 4, z: 3 }], b: 1 })
  );
  // Exact canonical bytes and hash, computed with ThreadHub's
  // src/canonical.js on the same value (worktree HEAD 56f420b) and copied
  // here as literals so both implementations stay pinned to one answer.
  assert.equal(canonicalize({ b: 1, a: [2, { z: 3, y: 4 }] }), '{"a":[2,{"y":4,"z":3}],"b":1}');
  assert.equal(
    contentAddress({ b: 1, a: [2, { z: 3, y: 4 }] }),
    "sha256:d7bc8a2a1c87d959f7699542056ae658f1b5fd120b835f51e702fe095d609c72"
  );
});

test("canonicalize: drops undefined-valued keys, rejects non-finite numbers", async () => {
  const { canonicalize } = await loadRunKeys();
  // Spec behavior of ThreadHub src/canonical.js lines 11-14 and 22-23.
  assert.equal(canonicalize({ a: 1, gone: undefined }), '{"a":1}');
  assert.throws(() => canonicalize({ bad: Infinity }), /non-finite/);
});

// Vectors copied verbatim from packages/threadhub/fixtures/events.ndjson —
// the fixture ThreadHub's own suite ingests and verifies (test/test.js,
// "ClisTa NDJSON event log ingests as a verifiable thread"). Each fixture
// line's content_hash is sha256 over the canonical JSON of the material
// object below, so these are direct canonicalization+hash vectors.
const FIXTURE_VECTORS = [
  {
    // fixtures/events.ndjson line 1 (evt_001)
    expected: "sha256:5d22818574618f9ce2e8c907e1c0259f572dc84b29d230b969e19a36d55afba0",
    material: {
      event_type: "ParticipantAdded",
      thread_id: "thd_clista_protocol_first",
      actor_id: "par_troy",
      timestamp: "2026-06-05T10:00:00.000Z",
      payload: {
        participant: {
          id: "par_troy", object: "participant", kind: "human",
          name: "Troy", role: "decision owner"
        }
      },
      metadata: undefined
    }
  },
  {
    // fixtures/events.ndjson line 5 (evt_005 — nested object + array values)
    expected: "sha256:3d717a113187e5e5d0e31fcf35d97caa9a1c634bbbb0a9c272c69c18a8a630d9",
    material: {
      event_type: "ThreadCreated",
      thread_id: "thd_clista_protocol_first",
      actor_id: "par_troy",
      timestamp: "2026-06-05T10:01:00.000Z",
      payload: {
        thread: {
          id: "thd_clista_protocol_first", object: "thread",
          title: "ClisTa MVP protocol shape",
          question: "Should ClisTa MVP begin as a local-first JSON protocol before UI?",
          status: "active",
          participantIds: ["par_troy", "par_codex", "par_research", "par_dissent"],
          createdAt: "2026-06-05T10:01:00.000Z",
          updatedAt: "2026-06-05T10:01:00.000Z"
        }
      },
      metadata: undefined
    }
  },
  {
    // fixtures/events.ndjson line 18 (evt_017 — deep nesting, many arrays)
    expected: "sha256:04c5f9829871b4df339f124cc4b2872c3e6d4ca4291ca895bb65520f8493faeb",
    material: {
      event_type: "DecisionMerged",
      thread_id: "thd_clista_protocol_first",
      actor_id: "par_troy",
      timestamp: "2026-06-05T10:13:00.000Z",
      payload: {
        decisionRecord: {
          id: "dcr_protocol_first", object: "decisionRecord",
          threadId: "thd_clista_protocol_first",
          decisionRequestId: "drq_protocol_first", status: "approved",
          summary: "ClisTa MVP will begin as a local-first JSON protocol engine before UI, agents, graph database, or governance portal.",
          rationale: "The first proof point is durable structured state that can be reloaded by another human or agent. That requires schema, event log, projection, CLI, and audit before higher-level product surfaces.",
          conditions: [
            "Build CLI first",
            "Keep agents as future adapters that emit protocol objects",
            "Validate with the ClisTa protocol-first thread"
          ],
          supportingEvidenceIds: ["evd_reloadable_state", "evd_chat_history_bad_memory", "evd_agents_should_emit_protocol"],
          supportingClaimIds: ["clm_protocol_first", "clm_agents_later"],
          preservedObjectionIds: ["obj_schema_overfit"],
          minorityReportIds: [],
          nextAction: "Implement schema, append-only events, projector, CLI commands, and first test thread.",
          decidedByParticipantId: "par_troy",
          decidedAt: "2026-06-05T10:13:00.000Z",
          contentHash: "sha256:abc29dc923c05a02467f3e7b26905c733d155e071df31ecf5fb5e4aaaa80b79d",
          supportingAssumptionIds: ["asm_projection_sufficient"]
        }
      },
      metadata: undefined
    }
  }
];

test("contentAddress reproduces ThreadHub fixture hashes (drift guard)", async () => {
  const { contentAddress } = await loadRunKeys();
  for (const { expected, material } of FIXTURE_VECTORS) {
    assert.equal(contentAddress(material), expected);
  }
});

test("threadhub.record.v0 envelope hashes to the pinned record_hash", async () => {
  const { contentAddress } = await loadRunKeys();
  // Envelope shape exactly per packages/threadhub/adapters/octopus.js
  // send(); payload is fixtures/events.ndjson line 1 verbatim. Expected
  // record_hash computed with ThreadHub's src/canonical.js at worktree HEAD
  // 56f420b and copied here as a literal.
  const envelope = {
    hub: "threadhub.record.v0",
    thread: "thd_fixture_vector",
    seq: 1,
    prev: "sha256:" + "00".repeat(32),
    author: "id_fixture_writer",
    author_key: "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    recorded_at: "2026-07-12T00:00:00.000Z",
    kind: "clista.event",
    payload: {
      event_id: "evt_001",
      event_type: "ParticipantAdded",
      thread_id: "thd_clista_protocol_first",
      actor_id: "par_troy",
      timestamp: "2026-06-05T10:00:00.000Z",
      payload: {
        participant: {
          id: "par_troy", object: "participant", kind: "human",
          name: "Troy", role: "decision owner"
        }
      },
      content_hash: "sha256:5d22818574618f9ce2e8c907e1c0259f572dc84b29d230b969e19a36d55afba0"
    }
  };
  assert.equal(
    contentAddress(envelope),
    "sha256:73a781710402c766d069e8db029c3e46daa58f4ef39af6ceff69657e3ff4252f"
  );
});

// ---------------------------------------------------------------------------
// ed25519 primitive — RFC 8032 §7.1 TEST 3 (publicly standardized vector; not
// operational key material, so DR rule 5.5's no-keys-in-repo is not touched).
// Pins the exact preimage semantics: the message is the RAW BYTES of the
// hex-decoded hash, matching ThreadHub src/identity.js sign()/verify().
// ---------------------------------------------------------------------------
const RFC8032_TEST3 = {
  seedHex: "c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7",
  publicKeyHex: "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025",
  messageHex: "af82",
  signatureHex:
    "6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac" +
    "18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a"
};

function pemFromSeed(seedHex) {
  // PKCS#8 DER for ed25519 = fixed prefix + 32-byte seed.
  const der = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(seedHex, "hex")
  ]);
  return crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" })
    .export({ type: "pkcs8", format: "pem" });
}

test("signHashHex/verifyHashHex reproduce RFC 8032 test 3 (raw-bytes preimage)", async () => {
  const { signHashHex, verifyHashHex } = await loadRunKeys();
  const pem = pemFromSeed(RFC8032_TEST3.seedHex);
  assert.equal(signHashHex(RFC8032_TEST3.messageHex, pem), RFC8032_TEST3.signatureHex);
  assert.equal(
    verifyHashHex(RFC8032_TEST3.messageHex, RFC8032_TEST3.signatureHex, RFC8032_TEST3.publicKeyHex),
    true
  );
  // Any bit flip in message, signature, or key must fail — and malformed
  // inputs return false rather than throwing (ThreadHub verify() contract).
  assert.equal(
    verifyHashHex("af83", RFC8032_TEST3.signatureHex, RFC8032_TEST3.publicKeyHex),
    false
  );
  assert.equal(
    verifyHashHex(RFC8032_TEST3.messageHex, "00" + RFC8032_TEST3.signatureHex.slice(2), RFC8032_TEST3.publicKeyHex),
    false
  );
  assert.equal(verifyHashHex(RFC8032_TEST3.messageHex, RFC8032_TEST3.signatureHex, "zz"), false);
});

test("generateKeypair: 32-byte pubkey hex; sign/verify round trip on a content hash", async () => {
  const { generateKeypair, signHashHex, verifyHashHex, contentAddress } = await loadRunKeys();
  const pair = generateKeypair();
  assert.match(pair.publicKeyHex, /^[0-9a-f]{64}$/);
  assert.match(pair.privateKeyPem, /BEGIN PRIVATE KEY/);
  const hashHex = contentAddress({ toy: "payload" }).slice(7);
  const sig = signHashHex(hashHex, pair.privateKeyPem);
  assert.match(sig, /^[0-9a-f]{128}$/);
  assert.equal(verifyHashHex(hashHex, sig, pair.publicKeyHex), true);
  const otherPair = generateKeypair();
  assert.equal(verifyHashHex(hashHex, sig, otherPair.publicKeyHex), false);
});

// ---------------------------------------------------------------------------
// CLI: keygen / sign / verify — key hygiene is part of the contract.
// ---------------------------------------------------------------------------

test("keygen CLI: <role>.pem 0600 + <role>.pub, no private material on stdout", () => {
  const dir = path.join(tmpDir(), "keys");
  const res = runCli(["keygen", "--dir", dir, "--role", "maker", "--role", "checker"]);
  assert.equal(res.status, 0, res.stderr);

  for (const role of ["maker", "checker"]) {
    const pemPath = path.join(dir, `${role}.pem`);
    const pubPath = path.join(dir, `${role}.pub`);
    assert.ok(fs.existsSync(pemPath), `${role}.pem must exist`);
    assert.ok(fs.existsSync(pubPath), `${role}.pub must exist`);
    const mode = fs.statSync(pemPath).mode & 0o777;
    assert.equal(mode, 0o600, `${role}.pem must be 0600, got ${mode.toString(8)}`);
    const pubHex = fs.readFileSync(pubPath, "utf8").trim();
    assert.match(pubHex, /^[0-9a-f]{64}$/);
    // stdout announces the role + public key, never the private key
    assert.ok(res.stdout.includes(pubHex));
  }
  assert.ok(!/PRIVATE/i.test(res.stdout), "stdout must not mention private key material");
  assert.ok(!/PRIVATE/i.test(res.stderr), "stderr must not mention private key material");

  // refuses to overwrite existing keys (a run's keys are minted once)
  const again = runCli(["keygen", "--dir", dir, "--role", "maker"]);
  assert.notEqual(again.status, 0);
  assert.ok(!/PRIVATE/i.test(again.stdout + again.stderr));
});

test("sign/verify CLI: signature over a raw hash hex round-trips", async () => {
  const { verifyHashHex } = await loadRunKeys();
  const dir = path.join(tmpDir(), "keys");
  assert.equal(runCli(["keygen", "--dir", dir, "--role", "maker"]).status, 0);
  const hashHex = crypto.createHash("sha256").update("toy event").digest("hex");

  const signed = runCli(["sign", "--key", path.join(dir, "maker.pem"), "--hash", hashHex]);
  assert.equal(signed.status, 0, signed.stderr);
  const sig = signed.stdout.trim();
  assert.match(sig, /^[0-9a-f]{128}$/);

  const pubHex = fs.readFileSync(path.join(dir, "maker.pub"), "utf8").trim();
  assert.equal(verifyHashHex(hashHex, sig, pubHex), true);

  const okViaPubFile = runCli(["verify", "--pub", path.join(dir, "maker.pub"), "--hash", hashHex, "--sig", sig]);
  assert.equal(okViaPubFile.status, 0, okViaPubFile.stderr);
  const okViaHex = runCli(["verify", "--pub", pubHex, "--hash", hashHex, "--sig", sig]);
  assert.equal(okViaHex.status, 0, okViaHex.stderr);

  const bad = runCli(["verify", "--pub", pubHex, "--hash", hashHex, "--sig", "00".repeat(64)]);
  assert.equal(bad.status, 1);

  // malformed hash is refused up front — the tool only signs hash hex
  const notHex = runCli(["sign", "--key", path.join(dir, "maker.pem"), "--hash", "not-a-hash"]);
  assert.notEqual(notHex.status, 0);
});

// ---------------------------------------------------------------------------
// Hygiene: *.pem must never be committable (DR rule 5.5).
// ---------------------------------------------------------------------------

test("gitignore covers *.pem and run key dirs", () => {
  const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.match(gitignore, /^\*\.pem$/m, ".gitignore must ignore *.pem");

  const check = spawnSync(
    "git",
    ["check-ignore", "-q", path.join(ROOT, "runs", "hypothetical-run", "keys", "maker.pem")],
    { cwd: ROOT, encoding: "utf8" }
  );
  if (check.error) {
    return; // git unavailable in this environment; the file assertion above stands
  }
  assert.equal(check.status, 0, "runs/**/keys/*.pem must be git-ignored");
});
