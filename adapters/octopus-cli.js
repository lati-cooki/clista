#!/usr/bin/env node
// octopus-cli.js — the Node bridge the Octopus Hermes plugin (Python) shells
// out to. Octopus is a non-custodial writer: it holds its own ed25519 key and
// submits pre-signed envelopes. Signing lives here, in JS, on top of the
// already-tested OctopusWriter — the Python glue never reimplements the write
// path, it just maps build events and calls this.
//
// Commands (all print a single JSON line on stdout; logical failures still
// exit 0 with {ok:false,...} so the Python caller can read structure rather
// than parse stderr — only an unexpected crash exits non-zero):
//
//   keygen   --key PATH
//       Idempotent. If PATH exists, load it and derive the public key; else
//       generate a keypair and write the private PEM at PATH (mode 0600).
//       The hub never sees this file. -> {ok, public_key, key_path, created}
//
//   register --hub URL --pub HEX [--name Octopus]
//       POST /identities with the PUBLIC key only. -> {ok, id, custodial:false}
//
//   emit     --hub URL --slug S --author ID --actor ID --key PATH
//            (--event '<json>'  |  build event JSON on stdin)
//       Single-shot: read head, build+sign envelope, POST signed. The Python
//       glue owns the retry-once-on-stale policy, so this returns the stale
//       signal structurally rather than retrying itself.
//       -> {ok, record_hash, seq}  |  {ok:false, code, error}
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const identity = require('../src/identity');
const { OctopusWriter } = require('./octopus');

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const out = (o) => { console.log(JSON.stringify(o)); process.exit(0); };
const fail = (msg, extra = {}) => out({ ok: false, error: String(msg), ...extra });

// ed25519 public key (raw 32-byte hex) from a PKCS8 private PEM — lets keygen
// stay idempotent (re-derive the public key from an existing private key
// instead of regenerating and breaking the registered identity binding).
function pubHexFromPem(privateKeyPem) {
  const pub = crypto.createPublicKey(crypto.createPrivateKey(privateKeyPem));
  return pub.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
}

function loadKey(keyPath) {
  const pem = fs.readFileSync(keyPath, 'utf8');
  return { publicKeyHex: pubHexFromPem(pem), privateKeyPem: pem };
}

function keygen(keyPath) {
  if (fs.existsSync(keyPath)) {
    return { ...loadKey(keyPath), created: false };
  }
  const kp = identity.generateKeypair();
  fs.mkdirSync(path.dirname(path.resolve(keyPath)), { recursive: true });
  fs.writeFileSync(keyPath, kp.privateKeyPem, { mode: 0o600 });
  fs.chmodSync(keyPath, 0o600); // belt-and-suspenders: enforce 0600 even if umask widened it
  return { publicKeyHex: kp.publicKeyHex, privateKeyPem: kp.privateKeyPem, created: true };
}

// A thrown emit error carries the HTTP status in its message
// ("POST /...: 409 ..."); 409 is the hub's stale-chain rejection.
const isStale = (err) => / 409 /.test(String(err && err.message));

(async () => {
  try {
    if (cmd === 'keygen') {
      const keyPath = flag('key');
      if (!keyPath) return fail('keygen requires --key');
      const k = keygen(keyPath);
      return out({ ok: true, public_key: k.publicKeyHex, key_path: keyPath, created: k.created });
    }

    if (cmd === 'register') {
      const hub = (flag('hub') || '').replace(/\/$/, '');
      const pub = flag('pub');
      if (!hub || !pub) return fail('register requires --hub and --pub');
      const res = await fetch(`${hub}/identities`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: flag('name', 'Octopus'), kind: 'agent', public_key: pub }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(body.error || `register failed: ${res.status}`, { code: body.code });
      return out({ ok: true, id: body.id, custodial: body.custodial === true });
    }

    if (cmd === 'emit') {
      const hub = flag('hub');
      const slug = flag('slug');
      const author = flag('author');
      const actor = flag('actor');
      const keyPath = flag('key');
      if (!hub || !slug || !author || !actor || !keyPath) {
        return fail('emit requires --hub --slug --author --actor --key');
      }
      const raw = flag('event') ?? fs.readFileSync(0, 'utf8'); // fd 0 = stdin
      const buildEvent = JSON.parse(raw);
      const keypair = loadKey(keyPath);
      const writer = new OctopusWriter({ baseUrl: hub, slug, authorId: author, keypair, actorId: actor });
      try {
        const r = await writer.emit(buildEvent);
        return out({ ok: true, record_hash: r.record_hash, seq: r.seq });
      } catch (e) {
        return fail(e.message, { code: isStale(e) ? 'stale_chain' : undefined });
      }
    }

    return fail(`unknown command: ${cmd}`);
  } catch (e) {
    // Unexpected (bad JSON, missing key file, network thrown outside emit): a
    // real crash — exit non-zero so the caller treats it as a hard failure.
    console.error('octopus-cli error:', e.message);
    process.exit(1);
  }
})();
