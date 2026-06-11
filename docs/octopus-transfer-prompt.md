# Octopus → Thread Hub — Claude Code transfer prompt

Paste everything below this line into Claude Code on the machine where the
Hermes Agent (Octopus) runs, from the Hermes Agent project root.

---

You are wiring **Octopus** (a Hermes Agent plugin) to **Thread Hub** so that
real build decisions land as signed, hash-chained, verifiable records. The
adapter, protocol, and write path already exist and are tested — do not
rebuild them. Your job is only the glue between Hermes build events and the
existing adapter.

## Fill these in before starting (stop and ask if unknown)

- `HUB_URL` — where a Thread Hub instance is reachable. If none is deployed,
  run one locally on this machine: clone the repo below, then
  `node bin/cli.js serve --port 7777` (db defaults to `./data/hub.db`; that
  file IS the instance — back it up, and know that records are self-verifying
  and portable, so the db can be re-hosted anywhere later without losing
  verifiability).
- `THREAD_SLUG` — the build-decision thread, e.g. `octo-build`.
- A path outside any repo for Octopus's private key, mode 0600.

## Get the code

`git clone https://github.com/lati-club/ThreadHub` (private; needs lati-club
or lati-cooki GitHub access — stop and ask if you have neither). Zero npm
dependencies, Node >= 22, plain CommonJS. Read these three files first:

- `docs/octopus-writer.md` — the integration doc; follow it, don't reinvent it
- `adapters/octopus.js` — `mapBuildEvent` + `OctopusWriter` (the thing you call)
- `test/octopus.test.js` — working end-to-end example against an in-process hub

## Locked decisions (raise an objection and stop rather than redesign)

1. **Octopus is a non-custodial writer.** It generates and holds its own
   ed25519 keypair (`src/identity.js#generateKeypair`), registers only the
   public key (`POST /identities` with `public_key`), and submits pre-signed
   envelopes via `POST /t/:slug/records/signed`. The hub must never see the
   private key. Do not "simplify" to the custodial `POST /t/:slug/records`
   path — custodial signatures attest custody, not authorship; that trade is
   for human writers only (see the founding thread's minority report).
2. **The adapter emits protocol; it does not own protocol.** Mapping is fixed:
   `cascade-block` → `ObjectionRaised`, `recovery` → `DecisionMerged`
   (preserving the objection it resolves). Unknown build event types throw —
   extend the mapping only deliberately, with a test, never by guessing.
3. **Every new guarantee ships as a test or it doesn't exist.** Test the glue
   against an in-process hub (`createServer` from `src/server.js`, listen on
   port 0 — exactly like `test/octopus.test.js` does). No mocks of the hub.
4. **Boring is the strategy.** No dashboards, no queues, no retry frameworks.
   The glue should be a small file.

## The task

1. **One-time setup (idempotent script or documented manual step):** generate
   the keypair, store the private key PEM at the configured path, register the
   public key with the hub, record the returned identity id in plugin config.
   The thread itself is created once by the hub operator (thread creation is a
   custodial action); if `THREAD_SLUG` doesn't exist yet, stop and say so.
2. **Find the real hook points** in the Hermes Agent plugin lifecycle where a
   cascade blocks and where a build recovers. Map whatever the native event
   shapes are into the adapter's input shape:
   `{ type: 'cascade-block'|'recovery', build_id, task, reason|resolution, at }`.
   `build_id` + `task` must be identical between a block and the recovery that
   resolves it — that pair is how the objection and decision link (ids are
   content-derived; no shared state).
3. **Wire `OctopusWriter.emit()`** at those hook points. Handle exactly two
   failure modes: on `stale_chain` (HTTP 409), re-call `emit()` once (it
   re-reads the head); on anything else, log and continue — **a failed record
   emission must never block or fail the build itself.** Records are evidence,
   not a gate.
4. **Tests:** at minimum — (a) a real native Hermes event maps to the expected
   ClisTa event through your glue; (b) end-to-end: block + recovery from your
   glue land on an in-process hub, `verifyThread` reports `valid: true`, and
   the hub holds no private key for the Octopus identity; (c) emission failure
   does not propagate into the build result.
5. **Prove it on one real build:** trigger or wait for an actual cascade-block
   and recovery, then show `GET HUB_URL/t/THREAD_SLUG/verify` returning
   `valid: true` with the new records, and cite their `record_hash` values —
   the hash is the permanent citation address, the URL is convenience.

## API facts you'll need (already implemented, already tested)

- Errors are `{ error, code }`: `stale_chain` 409, `payload_too_large` 413
  (256KB/record cap), `rate_limited` 429 (per-IP, POST only), `not_found` 404.
- `emit()` reads the chain head from `GET /t/:slug/verify`, builds the
  envelope at `seq = records`, signs its content address, submits. The hub
  re-validates signature, author key binding, and chain position on insert.
- `trusted: false` always — chain verification proves structure, never
  endorses content. Don't surface it as "approved by the hub" anywhere.

## Style

Match the host project's conventions for the glue file. Plain code, comments
explain *why*. When done, report: hook points found, files touched, test
results, and the record hashes from the real build.
