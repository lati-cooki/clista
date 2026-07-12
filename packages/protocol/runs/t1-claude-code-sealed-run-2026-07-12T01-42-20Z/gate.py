#!/usr/bin/env python3
"""Sidecar gate for a witnessed ClisTa T1 run.

Append-only, hash-chained JSON event log. Writers must be registered before
they may append. Sealing freezes the log. Verification recomputes the chain.
Coverage check diffs report claims against citing events.
"""
import argparse, hashlib, json, sys, os
from datetime import datetime, timezone

LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thread.jsonl")
GENESIS_PREV = "0" * 64


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


def append_event(writer, etype, payload):
    events = load()
    if sealed(events):
        sys.exit("GATE REJECT: thread is sealed; append refused")
    if etype not in ("ThreadOpened", "WriterRegistered"):
        registered = {e["payload"]["writer"] for e in events if e["type"] == "WriterRegistered"}
        if writer not in registered and writer != "GATE":
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
    with open(LOG, "a") as f:
        f.write(json.dumps(ev, ensure_ascii=False) + "\n")
    print(ev["hash"])


def cmd_init(args):
    if load():
        sys.exit("GATE REJECT: thread already exists")
    with open(args.prompt_file) as f:
        prompt = f.read()
    append_event("ORCHESTRATOR", "ThreadOpened", {
        "thread": "t1-fraud-threshold-holiday-promo",
        "genesis_prompt_verbatim": prompt,
    })


def cmd_register(args):
    events = load()
    registered = {e["payload"]["writer"] for e in events if e["type"] == "WriterRegistered"}
    if args.writer in registered:
        sys.exit(f"GATE REJECT: writer '{args.writer}' already registered")
    append_event("ORCHESTRATOR", "WriterRegistered", {"writer": args.writer, "role": args.role})


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
    prev = GENESIS_PREV
    for e in events:
        recomputed = compute_hash({k: e[k] for k in ("seq", "ts", "writer", "type", "payload", "prev")})
        chain_ok = e["prev"] == prev
        hash_ok = recomputed == e["hash"]
        status = "OK" if (chain_ok and hash_ok) else "FAIL"
        if status == "FAIL":
            ok = False
        print(f"[{e['seq']:02d}] {e['hash'][:16]} prev={'ok' if chain_ok else 'BROKEN'} hash={'ok' if hash_ok else 'MISMATCH'} {e['writer']}/{e['type']} -> {status}")
        prev = e["hash"]
    print(f"events={len(events)} sealed={sealed(events)}")
    print("CHAIN VERIFICATION: " + ("PASS" if ok and sealed(events) else "FAIL"))
    sys.exit(0 if ok and sealed(events) else 1)


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
s = sub.add_parser("init"); s.add_argument("--prompt-file", required=True); s.set_defaults(fn=cmd_init)
s = sub.add_parser("register"); s.add_argument("--writer", required=True); s.add_argument("--role", required=True); s.set_defaults(fn=cmd_register)
s = sub.add_parser("append"); s.add_argument("--writer", required=True); s.add_argument("--type", required=True)
s.add_argument("--payload"); s.add_argument("--payload-file"); s.set_defaults(fn=cmd_append)
s = sub.add_parser("seal"); s.set_defaults(fn=cmd_seal)
s = sub.add_parser("verify"); s.set_defaults(fn=cmd_verify)
s = sub.add_parser("coverage"); s.set_defaults(fn=cmd_coverage)
a = p.parse_args()
a.fn(a)
