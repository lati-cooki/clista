# Architecture — systems and data flows

## The systems

| System | Where | What it is |
|---|---|---|
| **clista-protocol** | `~/clista-protocol` · [lati-club/clista-protocol](https://github.com/lati-club/clista-protocol) (PUBLIC) | The protocol: event grammar, validator, projector, CLI, schemas, published examples and the debate pack. v0.33.0-maintainability. ~350 tests. |
| **clista-ai-app** | `~/Documents/clista-ai-app` · [lati-club/clista-ai-app](https://github.com/lati-club/clista-ai-app) (private) | The live cockpit at **app.clista.ai**: Cloudflare Worker + React SPA. Per-thread Durable Object SQLite ledgers, validated by a vendored copy of the protocol engine. Behind Cloudflare Access (team `laticooki`). |
| **ThreadHub** | `~/ThreadHub` · [lati-club/ThreadHub](https://github.com/lati-club/ThreadHub) (private) | The notary: zero-dependency signed/hash-chained/content-addressed record store. Runs locally via launchd on `127.0.0.1:7777`, store at `~/ThreadHub/data/hub.db`. Treats ClisTa events as opaque payloads — the protocol proves reasoning is well-formed, the hub proves the record is untampered and yours. |
| **Octopus** | source `~/octopus`, installed `~/.hermes/plugins/octopus` | Hermes plugin: regenerative multi-arm build orchestration. Its arm seal/recovery transitions are forwarded to ThreadHub as build decisions. |
| **Hermes** | `~/.hermes` | The local agent gateway/runtime (Telegram + Raft bridges connected). Hosts Octopus; powers the `hermes-raft` Raft agent. |
| **Raft** | app.raft.build, space **clista** (CLI `raft`, profiles `~/.slock/profiles/`) | Agent-team coordination: channels, tasks, wakes. Members: Troy + agents ClisTagent (Claude), ProtocolCodex (Codex), MacLati (Claude), hermes-raft. Since 2026-07-08 all daemon-run agents live on the single computer **TheLatiMac.local** (the hub machine); TheMacLati is retired from Raft. |
| **Moltbook** | www.moltbook.com | RETIRED surface (2026-07-07). Historical solicitation posts only; account no longer monitored. |

## Data flows (every arrow that exists)

### Protocol → App (code, PR-gated)
- `scripts/vendor-engine.mjs`: the engine is **vendored**, not depended on —
  upstream reaches production only via reviewed PR + redeploy. `integrity.js`
  + `events.js` are hand-adapted Worker ports guarded by hash baseline;
  `src/validator/` vendors wholesale; `cli.js` & friends are excluded.
- `scripts/vendor-examples.mjs`: published example logs mirror into the
  cockpit's example registry.

### Protocol → ThreadHub (content, manual)
- `threadhub ingest --events <log>.ndjson` ingests protocol-validated logs.
  Live case: `examples/clista-csv-cli-build.ndjson` → hub thread
  `clista-csv-cli-build-v4`. The protocol repo's
  `test/clista-csv-cli-example.test.js` verifies the cited hub record hashes
  resolve (skips when no hub reachable; passes against the launchd hub).

### App → ThreadHub (archive, manual, operator-run)
- `GET /api/threads/:id/export` (raw chained log, verbatim) →
  `scripts/archive-thread.mjs` → hub thread + chain verify. Gives a decided
  cockpit thread a permanent citation address outside Cloudflare. Refuses
  undecided threads without `--force`. First archive:
  `clista-agent-app-archive-0bf0bb6f`.

### Hermes/Octopus → ThreadHub (build signals, automatic during builds)
- `threadhub_writer.py` (attached to the Octopus notifier) → shells out to
  `ThreadHub/adapters/octopus-cli.js emit` → signed records on `octo-build`.
  Mapping: ARM_SEALED → `cascade-block` (ObjectionRaised); regenerated
  ARM_COMPLETE → `recovery` (DecisionMerged preserving the objection).
  Config: `~/.hermes/octopus/threadhub.json`.

### Agents → ThreadHub (deliberation, supervised, per-agent keys)
- `ThreadHub/adapters/octopus-cli.js send` — the GENERIC non-custodial write:
  keygen/register/send. Each agent signs with its own ed25519 key; the hub
  holds only public keys. Active writers: hermes-raft, ClisTagent,
  ProtocolCodex (see [identities.md](identities.md)). Woken via Raft, act
  only in interactive sessions with Troy.

### Raft → Hermes (wakes)
- The Raft bridge (`RAFT_PROFILE=hermes-raft` in `~/.hermes/.env`) delivers
  wake notices to the gateway; the gateway pulls message bodies via the raft
  CLI. Since the 2026-07-08 re-home there are no remote Raft agents; the hub
  stays loopback-only (no network exposure was ever added), and every agent
  reaches it locally on TheLatiMac.

### Public → App (intake, quarantined)
- `POST /api/intake/submit` (Turnstile + rate limit) → quarantine inbox →
  human triage. Approval creates human-owned threads or attests contributions
  as evidence — or, since PR #41, records a material contradiction as an
  **objection** (which can re-open a decided thread via the re-review loop).

### Retired flows (do not resurrect casually)
- clistahermes cron jobs → app.clista.ai + Moltbook (deleted 2026-07-07;
  service token revoked; archive under `~/.hermes/cron/clistahermes.done/`).

## Key design boundaries

- ThreadHub does **not** import the protocol engine; the app does (vendored).
- The app and ThreadHub share **no** API surface; logs move between them as
  exported/ingested ClisTa events.
- The re-review loop lives **in the app's ledger** (post-decision objection →
  auto `ReviewTriggered` → current-owner notify, clista-ai-app #19/#21).
- ThreadHub has **no seal/terminal state** — "complete" is a convention
  (marker record + verify assertion), enforced by tests, not the store.
