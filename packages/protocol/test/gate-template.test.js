// gate-template.test.js — Slice 2 (Phase 5): the sidecar-gate TEMPLATE for
// the next orchestrated T1 run (scripts/gate.py). The historical run's copy
// at runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/gate.py is a sealed
// artifact and is never touched.
//
// What the template must now enforce (DR-phase5-topology rule 5.1):
//   * every writer registers a PUBLIC KEY before any event (non-custodial:
//     optionally minted at the hub via POST /identities {public_key});
//   * append_event signs each event AT APPEND TIME via run-keys.mjs sign
//     (preimage: raw bytes of the event's hash hex);
//   * verify checks every signature against the registered pubkeys.
const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(ROOT, "scripts", "gate.py");
const RUN_KEYS = path.join(ROOT, "scripts", "run-keys.mjs");

const python = spawnSync("python3", ["--version"], { encoding: "utf8" });
const HAVE_PYTHON = !python.error && python.status === 0;

function setupRun() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clista-gate-template-"));
  fs.copyFileSync(TEMPLATE, path.join(dir, "gate.py"));
  fs.writeFileSync(path.join(dir, "prompt.md"), "# toy genesis prompt\n");
  const keygen = spawnSync(
    process.execPath,
    [RUN_KEYS, "keygen", "--dir", path.join(dir, "keys"), "--role", "ORCHESTRATOR", "--role", "MAKER", "--role", "CHECKER"],
    { encoding: "utf8" }
  );
  assert.equal(keygen.status, 0, keygen.stderr);
  return dir;
}

const GATE_ENV = {
  ...process.env,
  CLISTA_RUN_KEYS: RUN_KEYS,
  CLISTA_NODE: process.execPath
};

function gate(dir, args, options = {}) {
  return spawnSync("python3", [path.join(dir, "gate.py"), ...args], {
    encoding: "utf8",
    cwd: dir,
    env: GATE_ENV,
    ...options
  });
}

// Async variant for tests that also run an in-process HTTP server: spawnSync
// would block the event loop and deadlock the server's responses.
function gateAsync(dir, args) {
  return new Promise((resolve) => {
    const child = spawn("python3", [path.join(dir, "gate.py"), ...args], {
      cwd: dir, env: GATE_ENV
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => { stdout += c; });
    child.stderr.on("data", (c) => { stderr += c; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function readLog(dir) {
  return fs.readFileSync(path.join(dir, "thread.jsonl"), "utf8")
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function pubOf(dir, role) {
  return fs.readFileSync(path.join(dir, "keys", `${role}.pub`), "utf8").trim();
}

test("gate.py template: keyed init/register/append, signatures verified", { skip: !HAVE_PYTHON }, async (t) => {
  const { verifyHashHex } = await import(RUN_KEYS);
  const dir = setupRun();

  // init records the orchestrator's pubkey and signs ThreadOpened.
  const init = gate(dir, ["init", "--prompt-file", "prompt.md", "--thread", "toy-keyed-run"]);
  assert.equal(init.status, 0, init.stderr);

  // register requires a pubkey — writers are keys now, not strings.
  const noKey = gate(dir, ["register", "--writer", "GHOST", "--role", "spook"]);
  assert.notEqual(noKey.status, 0, "register without --pubkey must be refused");

  const regMaker = gate(dir, ["register", "--writer", "MAKER", "--role", "maker", "--pubkey", path.join("keys", "MAKER.pub")]);
  assert.equal(regMaker.status, 0, regMaker.stderr);
  const regChecker = gate(dir, ["register", "--writer", "CHECKER", "--role", "checker", "--pubkey", pubOf(dir, "CHECKER")]);
  assert.equal(regChecker.status, 0, regChecker.stderr);

  // unregistered writers still bounce off the gate.
  const ghost = gate(dir, ["append", "--writer", "GHOST", "--type", "Note", "--payload", "{}"]);
  assert.notEqual(ghost.status, 0);
  assert.match(ghost.stderr + ghost.stdout, /not registered/);

  // append signs at append time with the writer's own key.
  const appended = gate(dir, ["append", "--writer", "MAKER", "--type", "ProposalMade", "--payload", JSON.stringify({ text: "pin the toy dep" })]);
  assert.equal(appended.status, 0, appended.stderr);

  const events = readLog(dir);
  assert.equal(events.at(0).type, "ThreadOpened");
  assert.equal(events.at(0).payload.orchestrator_pubkey, pubOf(dir, "ORCHESTRATOR"));
  for (const [i, event] of events.entries()) {
    assert.match(event.sig ?? "", /^[0-9a-f]{128}$/, `event ${i} must carry a signature`);
  }
  const maker = events.find((e) => e.type === "ProposalMade");
  assert.equal(maker.writer, "MAKER");
  assert.equal(verifyHashHex(maker.hash, maker.sig, pubOf(dir, "MAKER")), true, "MAKER's signature verifies over the event hash");
  assert.equal(verifyHashHex(maker.hash, maker.sig, pubOf(dir, "ORCHESTRATOR")), false, "and not under any other key");
  const registration = events.find((e) => e.type === "WriterRegistered" && e.payload.writer === "MAKER");
  assert.equal(registration.payload.pubkey, pubOf(dir, "MAKER"), "registration carries the writer's pubkey");

  // seal, then verify: chain AND signatures must pass.
  assert.equal(gate(dir, ["seal"]).status, 0);
  const verify = gate(dir, ["verify"]);
  assert.equal(verify.status, 0, verify.stdout + verify.stderr);
  assert.match(verify.stdout, /SIGNATURES: PASS/);
  assert.match(verify.stdout, /CHAIN VERIFICATION: PASS/);
});

test("gate.py template: verify fails on a tampered signature", { skip: !HAVE_PYTHON }, () => {
  const dir = setupRun();
  assert.equal(gate(dir, ["init", "--prompt-file", "prompt.md", "--thread", "toy-tamper"]).status, 0);
  assert.equal(gate(dir, ["register", "--writer", "MAKER", "--role", "maker", "--pubkey", path.join("keys", "MAKER.pub")]).status, 0);
  assert.equal(gate(dir, ["append", "--writer", "MAKER", "--type", "Note", "--payload", "{}"]).status, 0);
  assert.equal(gate(dir, ["seal"]).status, 0);

  // Flip one signature nibble; the chain hash stays valid (the signature is
  // beside the hashed material), so only signature checking can catch it.
  const logPath = path.join(dir, "thread.jsonl");
  const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const target = lines.find((e) => e.type === "Note");
  target.sig = (target.sig[0] === "0" ? "1" : "0") + target.sig.slice(1);
  fs.writeFileSync(logPath, lines.map((e) => JSON.stringify(e)).join("\n") + "\n");

  const verify = gate(dir, ["verify"]);
  assert.equal(verify.status, 1);
  assert.match(verify.stdout, /SIGNATURES: FAIL/);
});

test("gate.py template: register --hub mints the identity non-custodially", { skip: !HAVE_PYTHON }, async () => {
  const dir = setupRun();
  assert.equal(gate(dir, ["init", "--prompt-file", "prompt.md", "--thread", "toy-hub-reg"]).status, 0);

  const posts = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      posts.push({ method: req.method, url: req.url, body: JSON.parse(body || "{}") });
      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "id_hub_minted", custodial: false }));
    });
  });
  const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));

  try {
    const reg = await gateAsync(dir, [
      "register", "--writer", "MAKER", "--role", "maker",
      "--pubkey", path.join("keys", "MAKER.pub"),
      "--hub", `http://127.0.0.1:${port}`
    ]);
    assert.equal(reg.status, 0, reg.stderr);
  } finally {
    server.close();
  }

  assert.equal(posts.length, 1);
  assert.equal(posts[0].method, "POST");
  assert.equal(posts[0].url, "/identities");
  assert.equal(posts[0].body.public_key, pubOf(dir, "MAKER"), "hub sees the public key only");
  assert.equal(posts[0].body.display_name, "MAKER");
  assert.ok(!/PRIVATE/i.test(JSON.stringify(posts[0].body)), "no private material crosses the wire");

  const registration = readLog(dir).find((e) => e.type === "WriterRegistered");
  assert.equal(registration.payload.hub_identity, "id_hub_minted", "the minted hub identity is witnessed in the log");
});

test("next-run provenance: t1-agent-run.mjs gens per-run keys and states the honest residual", () => {
  // t1-agent-run.mjs needs live model calls, so this locks its wiring
  // statically: per-run keygen, injected signers, and the knownGaps
  // replacement (positive claims + the one honest residual) in result.json
  // composition.
  const source = fs.readFileSync(path.join(ROOT, "scripts", "t1-agent-run.mjs"), "utf8");
  assert.match(source, /writeRoleKeypair/, "generates per-run role keys");
  assert.match(source, /signers/, "injects signers into runSealedRun");
  assert.ok(
    source.includes("orchestrator host held all role key files — per-file isolation, not per-machine"),
    "result.json keeps the honest residual, verbatim"
  );
  assert.ok(!source.includes("privateKeyPem"), "no private key handles outside signer closures — key files only");
});
