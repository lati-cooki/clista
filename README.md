# ClisTa

**The single authoritative home for the ClisTa system** — protocol, notary,
and the app.clista.ai cockpit — consolidated toward one goal: a production
**MRM (model risk management)** product where SR 11-7 effective challenge is
recorded as decisions with preserved dissent and tamper-evident provenance.

> **Authority:** this monorepo supersedes the multi-repo canonical-source
> designation. Decision: ThreadHub thread
> `monorepo-consolidation-for-the-mrm-pivot` (`thd_3e028f67bae0`), owner
> decision seq 2 `sha256:c750d2a69ca59019afd6fc8249a58cd1706b6b1a23be7e2ce63ddd595e73e34d`
> (2026-07-10), superseding `canonical-source-designation` seal seq 12.
> Full histories of the merged repos are preserved via subtree merges — every
> historical `repo@sha` citation resolves in this repo's history.

## Layout

| Path | Was | What it is |
|---|---|---|
| `packages/protocol/` | lati-club/clista-protocol | The protocol: event grammar, validator, projector, CLI, schemas, examples, debate pack |
| `packages/threadhub/` | lati-club/ThreadHub | The notary: zero-dependency signed/hash-chained record store (launchd service on `127.0.0.1:7777`) |
| `app/` | lati-club/clista-ai-app | The cockpit at **app.clista.ai**: Cloudflare Worker + React SPA, per-thread Durable Object ledgers |
| `docs/` | lati-club/clista-atlas | The integration map: architecture, identities, operations, decisions, history |

## Invariants (carried forward verbatim — these are product features)

1. Ledgers are **append-only** (app DO chains and ThreadHub records).
2. **Semantic author = transport writer**: per-agent non-custodial ed25519
   keys; no shared keys; agents never merge.
3. **Supervised sessions only**; no scheduled/unattended writers without a
   kill switch that survives updater rewrites.
4. Server-side credential revocation is the global off-switch.

## Working in the monorepo

Each package keeps its own `package.json`, lockfile, and test suite for now
(npm workspaces + engine de-vendoring are the first in-repo follow-up):

```sh
npm run test:protocol    # ~355 tests incl. clean-room replay support
npm run test:threadhub   # 34 tests incl. the agent-loop harness
npm run test:app         # 25 node + 43 workerd
npm test                 # all of the above, in sequence
```

**Deploy:** production app.clista.ai still deploys from lati-club/clista-ai-app
CI until the cutover here is proven (see `docs/HANDOFF.md`). Until then: land
changes here, mirror to the old repo to deploy.

## Where things were decided

The governing records live on ThreadHub (see `docs/decisions.md`):
`monorepo-consolidation-for-the-mrm-pivot` (this structure),
`canonical-source-designation` (superseded, pointer at seq 13),
`agent-loop-autonomy` (supervised-only, seq 21).
