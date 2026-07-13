#!/usr/bin/env node
// verify-standalone.mjs — standalone Thread Hub chain checker. Zero dependencies.
//
// DISCLOSURE: this checker is served by the hub it checks (GET /verify.mjs)
// as a convenience only. A verdict produced on the machine whose records you
// are questioning is not independent: SAVE THIS FILE and run it on another
// machine, against a saved copy of the thread JSON, with nothing but Node.
//
//   node verify-standalone.mjs <thread.json file | http(s) URL>
//   (input: the output of GET /t/<slug>.json — an array of records)
//
// What a PASS proves: the chain is intact — each record's recomputed content
// address (sha256 over canonical JSON) is the next record's prev, seqs are
// continuous — and every signature the export carries verifies against its
// embedded author_key. What it never proves: that the content is TRUE.
// Records may arrive bare (the hub's current export omits record_hash and
// signature) or with those sidecar fields; unsigned records are verified by
// hash chain only, and the summary discloses exactly how many were signed.
import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import process from "node:process";

// Canonical JSON (keys sorted, no whitespace, drop undefined) — the hub's src/canonical.js, inlined.
const canon = (v) => v === null || typeof v !== "object" ? JSON.stringify(v)
  : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : "{" + Object.keys(v).sort().filter((k) => v[k] !== undefined)
      .map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
const address = (v) => "sha256:" + createHash("sha256").update(canon(v), "utf8").digest("hex");
// ed25519 over the raw 32 bytes of the record hash; SPKI key rebuilt from its fixed DER prefix + raw hex key.
const sigOK = (hashHex, sigHex, pubHex) => {
  try {
    const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pubHex, "hex")]);
    return verify(null, Buffer.from(hashHex, "hex"), createPublicKey({ key: der, format: "der", type: "spki" }), Buffer.from(sigHex, "hex"));
  } catch { return false; }
};

const die = (msg) => { console.error(msg); process.exit(1); };
const src = process.argv[2] ?? die("usage: node verify-standalone.mjs <thread.json file | http(s) URL>");
const raw = /^https?:\/\//.test(src) ? await (await fetch(src)).text() : readFileSync(src, "utf8");
const records = JSON.parse(raw);
if (!Array.isArray(records) || records.length === 0) die("FAIL: input is not a non-empty array of records");

const fail = (seq, what) => die(`FAIL at seq ${seq}: ${what}`);
let prev = null, signed = 0;
records.forEach((rec, i) => {
  const { signature, record_hash, ...envelope } = rec; // exports carry envelopes bare or with sidecar fields
  const recomputed = address(envelope);
  if (envelope.seq !== i) fail(envelope.seq ?? i, `sequence gap: expected ${i}, got ${envelope.seq}`);
  if (envelope.prev !== prev) fail(i, `broken chain: prev is ${envelope.prev}, but the prior record's recomputed address is ${prev}`);
  if (record_hash !== undefined && record_hash !== recomputed) fail(i, `hash mismatch (body altered): stated ${record_hash}, recomputed ${recomputed}`);
  if (signature !== undefined) {
    if (!sigOK(recomputed.slice(7), signature, envelope.author_key)) fail(i, `invalid signature over ${recomputed} by author_key ${envelope.author_key}`);
    signed += 1;
  }
  prev = recomputed;
});
console.log(`PASS: ${records.length} records, head ${prev}, signatures verified ${signed}/${records.length}`
  + (signed < records.length ? " (unsigned records are held by the hash chain only)" : ""));
