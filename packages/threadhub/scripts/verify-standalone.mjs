#!/usr/bin/env node
// verify-standalone.mjs — standalone Thread Hub chain checker. Zero
// dependencies, zero imports: one file that is simultaneously the CLI, the
// module, and the in-browser verifier. The hub serves these exact bytes at
// GET /verify.mjs and the public viewer's "Verify this thread" button runs
// them via a direct module load of that URL — same code, not a sibling; a
// second verifier would be a second source of truth, which is the one thing
// this architecture forbids (DR-2026-07-13-record-is-the-interface rule 4).
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
// address (sha-256 over canonical JSON) is the next record's prev, seqs are
// continuous — and every signature the export carries verifies against its
// embedded author_key. What it never proves: that the content is TRUE.
// Records may arrive bare (the hub's current export omits record_hash and
// signature) or with those sidecar fields; unsigned records are verified by
// hash chain only, and the summary discloses exactly how many were signed.
// On a bare export nothing holds the LAST record's body but the printed
// head — a rewritten tail prints a self-consistent PASS — so always compare
// the printed head against an independently held head (e.g. the DR rule 1.3
// citation's verify.head).
//
// Environments: all crypto is globalThis.crypto.subtle (WebCrypto), so the
// module runs unmodified in Node >= 19 and in browsers. Ed25519 in WebCrypto
// is feature-detected: Node >= 19 has it; browsers shipped it in Chrome/Edge
// 137, Firefox 130, Safari 17 — where an environment lacks it, the summary
// line discloses "signature verification unavailable in this environment:
// 0/n checked" instead of silently skipping (honest degradation, never
// silent). Reading a local file from the CLI uses process.getBuiltinModule
// (Node >= 22.3); URL inputs and everything else need only Node >= 19.

// Canonical JSON (keys sorted, no whitespace, drop undefined) — the hub's src/canonical.js, inlined.
const canon = (v) => v === null || typeof v !== "object" ? JSON.stringify(v)
  : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : "{" + Object.keys(v).sort().filter((k) => v[k] !== undefined)
      .map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
const hexToBytes = (hex) =>
  Uint8Array.from({ length: hex.length / 2 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
const bytesToHex = (buf) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const address = async (v) =>
  "sha256:" + bytesToHex(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canon(v))));

// ed25519 over the raw 32 bytes of the record hash; the raw hex author_key
// imports directly (WebCrypto takes the raw 32-byte key, no DER prefix).
const sigOK = async (hashHex, sigHex, pubHex) => {
  try {
    const key = await globalThis.crypto.subtle.importKey(
      "raw", hexToBytes(pubHex), { name: "Ed25519" }, false, ["verify"]);
    return await globalThis.crypto.subtle.verify("Ed25519", key, hexToBytes(sigHex), hexToBytes(hashHex));
  } catch { return false; }
};
// Feature-detect WebCrypto Ed25519 with a known-valid key (RFC 8032 test
// vector) so an environment that lacks the algorithm is distinguished from a
// signature that is actually bad.
const ed25519Available = async () => {
  try {
    await globalThis.crypto.subtle.importKey(
      "raw", hexToBytes("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"),
      { name: "Ed25519" }, false, ["verify"]);
    return true;
  } catch { return false; }
};

// The one verification path, shared verbatim by CLI and browser. Returns
// { ok, records, head, signaturesVerified, signaturesPresent,
//   signatureVerificationAvailable, failure, line } — `line` is the exact
// text the CLI prints, so a page rendering it shows the checker's own words.
export async function verifyExport(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { ok: false, records: 0, head: null, signaturesVerified: 0, signaturesPresent: 0,
      signatureVerificationAvailable: await ed25519Available(), failure: null,
      line: "FAIL: input is not a non-empty array of records" };
  }
  const sigAvailable = await ed25519Available();
  let prev = null, signed = 0, present = 0;
  const failAt = (seq, what) => ({ ok: false, records: records.length, head: prev,
    signaturesVerified: signed, signaturesPresent: present,
    signatureVerificationAvailable: sigAvailable,
    failure: { seq, reason: what }, line: `FAIL at seq ${seq}: ${what}` });

  for (let i = 0; i < records.length; i += 1) {
    const { signature, record_hash, ...envelope } = records[i]; // exports carry envelopes bare or with sidecar fields
    const recomputed = await address(envelope);
    if (envelope.seq !== i) return failAt(envelope.seq ?? i, `sequence gap: expected ${i}, got ${envelope.seq}`);
    if (envelope.prev !== prev) return failAt(i, `broken chain: prev is ${envelope.prev}, but the prior record's recomputed address is ${prev}`);
    if (record_hash !== undefined && record_hash !== recomputed) return failAt(i, `hash mismatch (body altered): stated ${record_hash}, recomputed ${recomputed}`);
    if (signature !== undefined) {
      present += 1;
      if (sigAvailable) {
        if (!(await sigOK(recomputed.slice(7), signature, envelope.author_key))) {
          return failAt(i, `invalid signature over ${recomputed} by author_key ${envelope.author_key}`);
        }
        signed += 1;
      }
    }
    prev = recomputed;
  }

  const n = records.length;
  const line = sigAvailable
    ? `PASS: ${n} records, head ${prev}, signatures verified ${signed}/${n}`
      + (signed < n ? " (unsigned records are held by the hash chain only)" : "")
    : `PASS: ${n} records, head ${prev}, signature verification unavailable in this environment: 0/${n} checked (records are held by the hash chain only)`;
  return { ok: true, records: n, head: prev, signaturesVerified: signed, signaturesPresent: present,
    signatureVerificationAvailable: sigAvailable, failure: null, line };
}

// CLI entry — guarded so loading this module from a page (or a test) runs
// nothing. The guard matches this module's own URL against process.argv[1];
// in a browser there is no `process`, so the guard is inert by construction.
const argvPath = globalThis.process?.argv?.[1];
const isCLI = Boolean(argvPath)
  && import.meta.url.startsWith("file:")
  && decodeURIComponent(new URL(import.meta.url).pathname).endsWith(argvPath.replace(/^\.\//, ""));

if (isCLI) {
  const die = (msg) => { console.error(msg); process.exit(1); };
  const src = process.argv[2] ?? die("usage: node verify-standalone.mjs <thread.json file | http(s) URL>");
  // Local files are read via process.getBuiltinModule — builtin access
  // without an import statement, so the no-imports guarantee holds.
  const raw = /^https?:\/\//.test(src)
    ? await (await fetch(src)).text()
    : globalThis.process.getBuiltinModule("node:fs").readFileSync(src, "utf8");
  const result = await verifyExport(JSON.parse(raw));
  if (!result.ok) die(result.line);
  console.log(result.line);
}
