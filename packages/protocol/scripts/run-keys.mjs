#!/usr/bin/env node
// run-keys.mjs — per-run non-custodial ed25519 writer keys (Phase 5 Slice 2,
// DR-phase5-topology rule 5.1). Zero-dep: node:crypto only.
//
//   node scripts/run-keys.mjs keygen --dir <keysDir> --role <role> [--role ...]
//   node scripts/run-keys.mjs sign   --key <role.pem> --hash <64-hex>
//   node scripts/run-keys.mjs verify --pub <role.pub | 64-hex> --hash <64-hex> --sig <128-hex>
//
// This file REIMPLEMENTS ThreadHub's spec — packages/threadhub/src/identity.js
// (keygen/sign/verify) and src/canonical.js (canonical JSON + content
// addressing) — and never imports it: DR-phase5-topology binds integration to
// HTTP + event vocabulary only. The reimplementation is pinned to ThreadHub's
// answers by literal fixture vectors in test/run-keys.test.js (copied from
// packages/threadhub/fixtures/events.ndjson, which ThreadHub's own suite
// ingests and verifies). Canonicalization drift breaks those vectors first.
//
// SIGNATURE PREIMAGE (derived from packages/threadhub/adapters/octopus.js
// send() and src/hub.js appendSigned() / src/identity.js):
//   1. canonical body  = canonicalize(value): object keys sorted
//      lexicographically, no insignificant whitespace, JSON.stringify string
//      escaping, undefined-valued keys dropped, non-finite numbers rejected.
//   2. content address = "sha256:" + sha256(UTF-8 bytes of canonical body).
//   3. message         = the RAW 32 BYTES of the hex hash (the part after
//      "sha256:", hex-decoded) — NOT the ASCII hex string.
//   4. signature       = ed25519(privateKey, message), hex-encoded (128 hex).
// The hub's /t/:slug/records/signed verifies exactly this:
//   identity.verify(record_hash.slice(7), signature, envelope.author_key)
// where record_hash = contentAddress(envelope). The same primitive signs a
// ClisTa event's content_hash (or a gate.py event hash) at reasoning time.
//
// KEY HYGIENE (DR rule 5.5): <role>.pem is written 0600 into the run's keys
// dir and is git-ignored; <role>.pub holds the 64-hex public key. Private key
// material is NEVER printed to stdout/stderr, and existing key files are
// never overwritten — a run's keys are minted once, for that run.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// --- canonical JSON + content addressing (spec: threadhub/src/canonical.js) ---

export function canonicalize(value) {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("canonicalize: non-finite number");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys
      .filter((k) => value[k] !== undefined)
      .map((k) => JSON.stringify(k) + ":" + canonicalize(value[k]))
      .join(",") + "}";
  }
  throw new Error(`canonicalize: unsupported type ${typeof value}`);
}

export function sha256hex(input) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function contentAddress(value) {
  return "sha256:" + sha256hex(canonicalize(value));
}

// --- ed25519 keys + raw-hash signing (spec: threadhub/src/identity.js) ---

export function generateKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyHex = publicKey
    .export({ type: "spki", format: "der" })
    .subarray(-32) // raw 32-byte ed25519 key at the end of SPKI DER
    .toString("hex");
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  return { publicKeyHex, privateKeyPem };
}

export function signHashHex(hashHex, privateKeyPem) {
  const key = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(hashHex, "hex"), key).toString("hex");
}

function publicKeyFromHex(publicKeyHex) {
  // Rebuild SPKI DER: fixed ed25519 prefix + raw 32-byte key
  // (same constant as threadhub/src/identity.js publicKeyFromHex).
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  const der = Buffer.concat([prefix, Buffer.from(publicKeyHex, "hex")]);
  return crypto.createPublicKey({ key: der, format: "der", type: "spki" });
}

export function verifyHashHex(hashHex, signatureHex, publicKeyHex) {
  try {
    const key = publicKeyFromHex(publicKeyHex);
    return crypto.verify(
      null,
      Buffer.from(hashHex, "hex"),
      key,
      Buffer.from(signatureHex, "hex")
    );
  } catch {
    return false;
  }
}

// --- key files: <role>.pem (0600, private) + <role>.pub (public hex) ---

export function writeRoleKeypair(dir, role) {
  const pemPath = path.join(dir, `${role}.pem`);
  const pubPath = path.join(dir, `${role}.pub`);
  if (fs.existsSync(pemPath) || fs.existsSync(pubPath)) {
    throw new Error(`refusing to overwrite existing key files for role "${role}" in ${dir}`);
  }
  const pair = generateKeypair();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(pemPath, pair.privateKeyPem, { mode: 0o600 });
  fs.writeFileSync(pubPath, `${pair.publicKeyHex}\n`, { mode: 0o644 });
  return { role, pemPath, pubPath, publicKeyHex: pair.publicKeyHex };
}

export function readPublicKeyHex(pubFileOrHex) {
  if (/^[0-9a-f]{64}$/.test(pubFileOrHex)) return pubFileOrHex;
  const text = fs.readFileSync(pubFileOrHex, "utf8").trim();
  if (!/^[0-9a-f]{64}$/.test(text)) {
    throw new Error(`${pubFileOrHex} does not contain a 64-hex ed25519 public key`);
  }
  return text;
}

// --- CLI ---

function parseArgs(argv) {
  const args = { _: [], role: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`missing value for --${name}`);
      }
      if (name === "role") args.role.push(value);
      else args[name] = value;
      i += 1;
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function requireHashHex(value, name) {
  if (!/^[0-9a-f]+$/.test(value || "") || (value.length % 2) !== 0) {
    throw new Error(`--${name} must be an even-length lowercase hex string`);
  }
  return value;
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === "keygen") {
    if (!args.dir || args.role.length === 0) {
      throw new Error("usage: run-keys.mjs keygen --dir <keysDir> --role <role> [--role <role> ...]");
    }
    for (const role of args.role) {
      if (!/^[A-Za-z0-9_.-]+$/.test(role)) {
        throw new Error(`role "${role}" must match [A-Za-z0-9_.-]+ (it names the key files)`);
      }
      const made = writeRoleKeypair(args.dir, role);
      // Public key only — the .pem stays on disk at 0600 and is never shown.
      process.stdout.write(`${made.role} ${made.publicKeyHex} ${made.pemPath}\n`);
    }
    return 0;
  }

  if (command === "sign") {
    if (!args.key || !args.hash) {
      throw new Error("usage: run-keys.mjs sign --key <role.pem> --hash <hex>");
    }
    const hashHex = requireHashHex(args.hash, "hash");
    const pem = fs.readFileSync(args.key, "utf8");
    process.stdout.write(`${signHashHex(hashHex, pem)}\n`);
    return 0;
  }

  if (command === "verify") {
    if (!args.pub || !args.hash || !args.sig) {
      throw new Error("usage: run-keys.mjs verify --pub <role.pub|hex> --hash <hex> --sig <hex>");
    }
    const ok = verifyHashHex(
      requireHashHex(args.hash, "hash"),
      requireHashHex(args.sig, "sig"),
      readPublicKeyHex(args.pub)
    );
    process.stdout.write(ok ? "ok\n" : "invalid\n");
    return ok ? 0 : 1;
  }

  throw new Error(`unknown command "${command || ""}" — expected keygen | sign | verify`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main());
  } catch (error) {
    // Errors name files and roles, never key bytes.
    console.error(`run-keys: ${error.message}`);
    process.exit(2);
  }
}
