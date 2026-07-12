# Architecture — systems and data flows

> **Provenance:** clista-protocol@7dceb917b9a18f282cd1cad6ed4a10e3725b5678 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@93d10232ec65b0039a89938dbc5fa5a9d2f7efaf

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

### Protocol → App (code, same-commit since the 2026-07-12 de-vendor)
- The engine is **imported directly**: `app/worker/engine/index.js` is a thin
  surface over `packages/protocol/src/` (worker runs `nodejs_compat`, so the
  engine's `node:crypto` hashing works in workerd unchanged; the retired
  js-sha256/Web-Crypto ports, hash baselines, and `vendor-engine.mjs` are
  gone). A protocol change reaches the app in the same monorepo commit; the
  review gate is the PR itself plus the engine-parity test.
- Examples: `app/scripts/generate-examples.mjs` regenerates the cockpit's
  registry (`worker/examples/`, gitignored) from
  `packages/protocol/examples/manifest.json` before every test/build/dev run,
  re-verifying each example with the same engine. Seeding is still
  **seed-once per thread id** (DO ledgers are append-only): shipping a
  revised example means re-issuing its thread ids at the source
  (e.g. `*_ltn4481` → `*_ltn4481_r2`) and seeding fresh; superseded cards get
  hidden (`POST /api/threads/:id/hide`, index-projection metadata only).

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

- ThreadHub does **not** import the protocol engine; the app does (direct
  workspace import since 2026-07-12 — formerly vendored).
- The app and ThreadHub share **no** API surface; logs move between them as
  exported/ingested ClisTa events.
- The re-review loop lives **in the app's ledger** (post-decision objection →
  auto `ReviewTriggered` → current-owner notify, clista-ai-app #19/#21).
- ThreadHub has **no seal/terminal state** — "complete" is a convention
  (marker record + verify assertion), enforced by tests, not the store.
- **No unwitnessed work** (Mutual Reliance, DR-2026-07-12): any
  output-shaping action — recall/reuse, arbitration, gate rejections,
  external ingestion — emits a typed event at action time. Absent records
  outrank corrupted ones in severity; reconstruction never satisfies.
- **Precedent as citation, never ventriloquism** (Mutual Reliance,
  DR-2026-07-12): reused conclusions travel as `PrecedentReference`
  citations (holding + context hashes + regrounding mode); prior rationale
  is unrepresentable in the shape. Ambiguous context match → fresh compute.
- **Reports follow the protocol too** (Mutual Reliance, DR-2026-07-12):
  prose derived from a thread ships as a `SealedReport` event — ordered
  claims, each citing earlier same-thread event hashes — so the report layer
  verifies with the same three mechanical checks as the log layer. Reports
  are renderings, never evidence; they do not re-enter the decision graph.
