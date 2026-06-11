# Thread Hub

Signed, hash-chained, content-addressed decision record store. The canonical home
for ClisTa Protocol threads — where decision records *live*, get permanent
addresses, and stay verifiable forever.

**Zero npm dependencies.** Node >= 22 (built-in ed25519 + SQLite).

## The thesis

Implementation is collapsing toward free; accumulated, verifiable state is not.
Thread Hub is the substrate whose value grows as models get better, because
agents generate decisions faster than humans — and an agent's judgment is worth
nothing without a tamper-evident record of it. Protocol open, gravity proprietary:
git : GitHub :: ClisTa Protocol : Thread Hub.

## The record envelope (`threadhub.record.v0`)

```json
{
  "hub": "threadhub.record.v0",
  "thread": "thd_...",
  "seq": 4,
  "prev": "sha256:...",          // hash of record seq-1; null at genesis
  "author": "id_troy",
  "author_key": "<hex ed25519 public key>",
  "recorded_at": "2026-06-10T...Z",
  "kind": "genesis | clista.event | attestation | note",
  "payload": { }                  // a ClisTa event, an attestation, ...
}
```

- `record_hash = sha256(canonical_json(envelope))` — the **permanent citation
  address**. Cite hashes, not URLs.
- `signature = ed25519(author_key, record_hash)` — authorship binds to a key,
  not a server.
- Records are **self-verifying**: copy them anywhere (thumb drive, air-gapped
  instance, court exhibit) and `verify` needs nothing but the records.
- `trusted: false` always. Chain verification proves structure, never content.

## Guarantees (each one is a test in `test/test.js`)

| Property | Mechanism |
|---|---|
| Append-only | SQLite triggers abort UPDATE/DELETE on `records` |
| Tamper-evidence | recomputed content address vs stored hash |
| Authorship | per-record ed25519 signature over the record hash |
| Portability | verification is a pure function of exported records |
| Confidential notarization | hash-only attestations: prove existence, disclose nothing |
| ClisTa-native | NDJSON event logs ingest losslessly; round-trip tested |

## Quick start

```sh
node bin/cli.js identity create --name Troy --kind human
node bin/cli.js ingest --events <clista-log>.ndjson --author <id> --slug my-thread
node bin/cli.js verify --thread my-thread        # exit 0 iff chain valid
node bin/cli.js verify --all                     # CI: exit 0 iff every thread is valid
node bin/cli.js serve --port 7777                # viewer at /t/my-thread
npm test
```

## HTTP API

```
GET  /                       instance summary
GET  /threads                list threads
POST /threads                { title, question?, author }
POST /identities             { display_name, kind, public_key? }   public_key => non-custodial
GET  /t/:slug                raw viewer (HTML)
GET  /t/:slug.json           full record chain
GET  /t/:slug/verify         verification report
POST /t/:slug/records        { author, kind, payload }             custodial write
POST /t/:slug/records/signed { envelope, signature }               non-custodial write
POST /t/:slug/attest         { author, payload_hash, claim? }
GET  /r/:hash                single record by content address
```

Errors are `{ error, code }` with stable codes (`not_found` 404,
`stale_chain` 409, `payload_too_large` 413, `rate_limited` 429, …).
Writes are rate-limited per IP; records are capped at 256KB each.

## Writers

- The hub's own founding decision is dogfood thread #1:
  `threads/founding-architecture.ndjson` (regenerate with
  `scripts/generate-founding-thread.js`), including the preserved
  custodial-keys objection and its minority report.
- Agents write non-custodially — see `docs/octopus-writer.md` for the
  Octopus (Hermes Agent plugin) adapter: cascade-block → ObjectionRaised,
  recovery → DecisionMerged, pre-signed envelopes, client-held keys.

## Decisions already made (don't relitigate without a thread)

1. **Records self-verify; instances are hosting, not authority.** This is what
   makes self-hosting (CLISTA/defense) and a canonical public instance coexist.
2. **Two-layer addressing.** Content hash = permanent; `/t/slug` = convenience.
3. **Identity = keys; reputation = canonical instance.** Custodial keys in v1
   so human writers never touch key material; non-custodial is the self-host path.
4. **Federation = selective publication**, starting with hash-only attestation
   (notarization). No sync protocol in v1; record format already supports it.
5. **No viewer investment yet.** Every feature is one-shottable; the substrate
   holding records reliably is the moat. Boring is the strategy.

## Day-one writers

1. Troy — workflow audit threads (Lati Cooki / Latimer Holdings / tech portfolio)
2. Octopus — build decision threads emitted as `clista.event` records
3. One external party — the test of whether this is a product
