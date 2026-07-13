#!/usr/bin/env python3
"""Sidecar gate TEMPLATE for a witnessed ClisTa run — keyed writers edition.

Provenance: seeded from the sealed T1 run's gate
(runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/gate.py — that copy is a
sealed artifact and is never edited), upgraded per DR-phase5-topology rule
5.1: writers are per-run non-custodial ed25519 keys, not registered strings.
The orchestrator copies THIS file into the next run directory.

What changed from the sealed run's gate:
  * init records the orchestrator's public key in ThreadOpened.
  * register REQUIRES --pubkey (hex or a .pub file). With --hub <url> it also
    mints the identity at ThreadHub via POST /identities
    {display_name, kind, public_key} — public key only, non-custodial: the
    hub never sees a private key. Registration happens BEFORE any event by
    that writer.
  * append_event signs each event AT APPEND TIME (reasoning time — a post-hoc
    bulk pass would not retire the T1 knownGap) by shelling out to
    scripts/run-keys.mjs sign with the writer's keys/<writer>.pem.
  * verify checks every signature against the registered public keys, on top
    of the hash chain.

Signature preimage (must match run-keys.mjs / ThreadHub /records/signed):
  event hash = sha256 hex over canonical JSON (sorted keys, compact
  separators) of the fields (seq, ts, writer, type, payload, prev);
  the ed25519 message is the RAW 32 BYTES of that hex hash; the signature is
  stored BESIDE the hashed material as ev["sig"] — exactly as ThreadHub
  stores the record signature beside the envelope, never inside it.

Keys: keys/<writer>.pem (0600) + keys/<writer>.pub live next to this file
(override with GATE_KEYS_DIR). Generate with
  node scripts/run-keys.mjs keygen --dir keys --role ORCHESTRATOR --role ...
Private keys never leave the run host and are git-ignored (DR rule 5.5).

Anchoring stays post-hoc and honest (scripts/anchor-run.mjs): the hub
envelope's recorded_at is the anchor time; each event's local ts stays the
reasoning-time claim. This gate never talks to the hub except optional
identity minting at register time.

result.json for a run driven by this template replaces the old two knownGaps
with the positive claims (keyed writers signing at reasoning time; head
anchored post-hoc via anchor-run.mjs) plus ONE honest residual, verbatim:
  "orchestrator host held all role key files — per-file isolation, not
  per-machine."
"""
import argparse, hashlib, json, subprocess, sys, os
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "thread.jsonl")
KEYS_DIR = os.environ.get("GATE_KEYS_DIR", os.path.join(HERE, "keys"))
GENESIS_PREV = "0" * 64
HEX64 = 64


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def load():
    if not os.path.exists(LOG):
        return []
    with open(LOG) as f:
        return [json.loads(line) for line in f if line.strip()]


def head(events):
    return events[-1]["hash"] if events else GENESIS_PREV


def sealed(events):
    return any(e["type"] == "ThreadSealed" for e in events)


def compute_hash(event_sans_hash):
    return hashlib.sha256(canonical(event_sans_hash).encode()).hexdigest()


# --- keys: signing shells out to run-keys.mjs (the single implementation of
# --- the primitive; this gate never reimplements ed25519) ---

def run_keys_path():
    override = os.environ.get("CLISTA_RUN_KEYS")
    if override:
        return override
    sibling = os.path.join(HERE, "run-keys.mjs")
    if os.path.exists(sibling):
        return sibling
    sys.exit("GATE REJECT: run-keys.mjs not found (set CLISTA_RUN_KEYS)")


def node_bin():
    return os.environ.get("CLISTA_NODE", "node")


def run_keys(args):
    proc = subprocess.run(
        [node_bin(), run_keys_path(), *args], capture_output=True, text=True
    )
    return proc


def read_pubkey(value):
    """Accept a 64-hex pubkey or a path to a .pub file."""
    if len(value) == HEX64 and all(c in "0123456789abcdef" for c in value):
        return value
    path = value if os.path.isabs(value) else os.path.join(HERE, value)
    with open(path) as f:
        text = f.read().strip()
    if len(text) != HEX64:
        sys.exit(f"GATE REJECT: {value} does not contain a 64-hex public key")
    return text


def key_pem(writer):
    return os.path.join(KEYS_DIR, f"{writer}.pem")


def sign_hash(writer, hash_hex):
    pem = key_pem(writer)
    if not os.path.exists(pem):
        sys.exit(f"GATE REJECT: no signing key for '{writer}' ({pem}); unsigned appends are refused")
    proc = run_keys(["sign", "--key", pem, "--hash", hash_hex])
    if proc.returncode != 0:
        sys.exit(f"GATE REJECT: signing failed for '{writer}': {proc.stderr.strip()}")
    return proc.stdout.strip()


def verify_sig(pubkey_hex, hash_hex, sig_hex):
    proc = run_keys(["verify", "--pub", pubkey_hex, "--hash", hash_hex, "--sig", sig_hex])
    return proc.returncode == 0


def registered_pubkeys(events):
    """writer -> pubkey: the orchestrator from ThreadOpened, the rest from
    their WriterRegistered events."""
    keys = {}
    for e in events:
        if e["type"] == "ThreadOpened":
            keys["ORCHESTRATOR"] = e["payload"].get("orchestrator_pubkey")
        if e["type"] == "WriterRegistered":
            keys[e["payload"]["writer"]] = e["payload"].get("pubkey")
    return keys


# --- the only write path: registered writer, hash-chained, SIGNED at append ---

def append_event(writer, etype, payload):
    events = load()
    if sealed(events):
        sys.exit("GATE REJECT: thread is sealed; append refused")
    if etype not in ("ThreadOpened", "WriterRegistered"):
        registered = {e["payload"]["writer"] for e in events if e["type"] == "WriterRegistered"}
        if writer not in registered and writer != "ORCHESTRATOR":
            sys.exit(f"GATE REJECT: writer '{writer}' not registered")
    ev = {
        "seq": len(events),
        "ts": now(),
        "writer": writer,
        "type": etype,
        "payload": payload,
        "prev": head(events),
    }
    ev["hash"] = compute_hash({k: ev[k] for k in ("seq", "ts", "writer", "type", "payload", "prev")})
    # Reasoning-time signature: this append IS the signing moment. The sig
    # sits beside the hashed material (like ThreadHub's envelope signature).
    ev["sig"] = sign_hash(writer, ev["hash"])
    with open(LOG, "a") as f:
        f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    print(ev["hash"])


def cmd_init(args):
    if load():
        sys.exit("GATE REJECT: thread already exists")
    with open(args.prompt_file) as f:
        prompt = f.read()
    pubkey = read_pubkey(args.pubkey) if args.pubkey else read_pubkey(os.path.join(KEYS_DIR, "ORCHESTRATOR.pub"))
    append_event("ORCHESTRATOR", "ThreadOpened", {
        "thread": args.thread,
        "genesis_prompt_verbatim": prompt,
        "orchestrator_pubkey": pubkey,
    })


def hub_mint_identity(hub, writer, pubkey):
    """Non-custodial mint: the hub stores the PUBLIC key only (DR rule 5.1).
    Shape per packages/threadhub/src/server.js POST /identities."""
    body = json.dumps({"display_name": writer, "kind": "agent", "public_key": pubkey}).encode()
    req = urllib.request.Request(hub.rstrip("/") + "/identities", data=body, method="POST")
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read())


def cmd_register(args):
    events = load()
    registered = {e["payload"]["writer"] for e in events if e["type"] == "WriterRegistered"}
    if args.writer in registered:
        sys.exit(f"GATE REJECT: writer '{args.writer}' already registered")
    pubkey = read_pubkey(args.pubkey)
    payload = {"writer": args.writer, "role": args.role, "pubkey": pubkey}
    if args.hub:
        identity = hub_mint_identity(args.hub, args.writer, pubkey)
        payload["hub"] = args.hub
        payload["hub_identity"] = identity.get("id")
    append_event("ORCHESTRATOR", "WriterRegistered", payload)


def cmd_append(args):
    if args.payload_file:
        with open(args.payload_file) as f:
            payload = json.load(f)
    else:
        payload = json.loads(args.payload)
    append_event(args.writer, args.type, payload)


def cmd_seal(args):
    events = load()
    if sealed(events):
        sys.exit("GATE REJECT: already sealed")
    append_event("ORCHESTRATOR", "ThreadSealed", {"final_head": head(events), "event_count": len(events)})


def cmd_verify(args):
    events = load()
    ok = True
    sigs_ok = True
    prev = GENESIS_PREV
    pubkeys = registered_pubkeys(events)
    for e in events:
        recomputed = compute_hash({k: e[k] for k in ("seq", "ts", "writer", "type", "payload", "prev")})
        chain_ok = e["prev"] == prev
        hash_ok = recomputed == e["hash"]
        pubkey = pubkeys.get(e["writer"])
        sig_ok = bool(pubkey and e.get("sig")) and verify_sig(pubkey, e["hash"], e["sig"])
        status = "OK" if (chain_ok and hash_ok and sig_ok) else "FAIL"
        if not (chain_ok and hash_ok):
            ok = False
        if not sig_ok:
            sigs_ok = False
        print(f"[{e['seq']:02d}] {e['hash'][:16]} prev={'ok' if chain_ok else 'BROKEN'} hash={'ok' if hash_ok else 'MISMATCH'} sig={'ok' if sig_ok else 'INVALID'} {e['writer']}/{e['type']} -> {status}")
        prev = e["hash"]
    print(f"events={len(events)} sealed={sealed(events)}")
    print("SIGNATURES: " + ("PASS" if sigs_ok else "FAIL"))
    print("CHAIN VERIFICATION: " + ("PASS" if ok and sealed(events) else "FAIL"))
    sys.exit(0 if ok and sigs_ok and sealed(events) else 1)


def cmd_coverage(args):
    events = load()
    hashes = {e["hash"] for e in events}
    reports = [e for e in events if e["type"] == "ClaimCitedReport"]
    if not reports:
        sys.exit("COVERAGE: FAIL (no ClaimCitedReport event)")
    claims = reports[-1]["payload"]["claims"]
    unwitnessed = []
    for i, c in enumerate(claims):
        cites = c.get("citations", [])
        bad = [h for h in cites if h not in hashes]
        if not cites or bad:
            unwitnessed.append({"claim_index": i, "claim": c["claim"], "missing": bad or "NO CITATIONS"})
    print(f"claims={len(claims)} unwitnessed={len(unwitnessed)}")
    if unwitnessed:
        print("UNWITNESSED-CLAIMS DIFF:")
        for u in unwitnessed:
            print(json.dumps(u, ensure_ascii=False))
        print("COVERAGE: FAIL")
        sys.exit(1)
    print("UNWITNESSED-CLAIMS DIFF: (empty)")
    print("COVERAGE: PASS")


p = argparse.ArgumentParser()
sub = p.add_subparsers(dest="cmd", required=True)
s = sub.add_parser("init"); s.add_argument("--prompt-file", required=True); s.add_argument("--thread", required=True)
s.add_argument("--pubkey"); s.set_defaults(fn=cmd_init)
s = sub.add_parser("register"); s.add_argument("--writer", required=True); s.add_argument("--role", required=True)
s.add_argument("--pubkey", required=True); s.add_argument("--hub"); s.set_defaults(fn=cmd_register)
s = sub.add_parser("append"); s.add_argument("--writer", required=True); s.add_argument("--type", required=True)
s.add_argument("--payload"); s.add_argument("--payload-file"); s.set_defaults(fn=cmd_append)
s = sub.add_parser("seal"); s.set_defaults(fn=cmd_seal)
s = sub.add_parser("verify"); s.set_defaults(fn=cmd_verify)
s = sub.add_parser("coverage"); s.set_defaults(fn=cmd_coverage)
a = p.parse_args()
a.fn(a)
