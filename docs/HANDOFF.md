# Transfer prompt — the ClisTa monorepo / MRM pivot
> **Provenance:** clista@fbc13652273269587e9793cae0b6dd6c9cd874a7

Paste this into a fresh session. This repo — **lati-cooki/clista**, local
`~/clista` — is the single authoritative home for the whole system (see the
root `README.md`). Read root `README.md` + this `docs/` directory FIRST; this
file is the "where we left off" delta on top of them. Sections below the top
delta describe the pre-monorepo era (those repos merged here with history;
provenance pins in older pages are historical artifacts of that era).

## Update 2026-07-12 (later) — Mutual Reliance workstream: all 8 slices DONE

The v2 direction (`docs/new/clista-new-direction-transfer-prompt.md`,
owner-approved) executed end to end in one session:

- **Three DRs adopted** (docs/decision-records/, atlas updated same-commit):
  claim-citation report events (`SealedReport`), silent-action prohibition,
  precedent-as-citation (`PrecedentReference`, implementation deferred).
- **Implemented (TDD)**: `SealedReport` first-class event type (registry +
  validator + projector); `src/report.js` `verifyReport` — three mechanical
  checks (chain / existence / coverage); CLI `clista report verify`
  (T2 ventriloquism diff, prose output). Suite 355 → 379 green.
- **T1/T2 executed live** (FINDINGS-T1-T2.md): T1 agent variant PASS attempt
  one (prediction confirmed); T2 agent prediction MISSED — forced citation
  structure was satisfied immediately by a live model; miss recorded plainly.
  Artifacts under `packages/protocol/runs/`.
- **Evidence chain SEALED** as ClisTa thread
  `thd_mutual_reliance_evidence_mrh43nx1_dcfbe526` (14 events, seal
  `sha256:93dd6c1d3ea92519325d3bde55ec9cf273013eed857f7a7b9a51ad76f488c460`),
  artifact `packages/protocol/runs/evidence-seal-2026-07-12/` — chain,
  validation, and report all verify via `clista report verify`.
- `PrecedentReference` IMPLEMENTED 2026-07-12 (follow-up slice against the
  Slice 3 DR): first-class event type, validator rejects rationale fields
  outright, age derived never stored. Suite 379 → 397 green.
- Gate-rejection event type IMPLEMENTED 2026-07-12: `GateRejectionRecorded`
  closes the Slice 2 known nonconformance — `decision propose` and the
  harness gate witness every refusal (candidate by content hash, engine
  reasons, refused writer); unwitnessable refusals (empty log, undeclared
  writer, broken log) append nothing and are disclosed as
  `rejectionWitnessed: false`. Suite 397 → 413 green.
- App de-vendor (cutover item 3) DONE 2026-07-12: `app/worker/engine/` is a
  single index.js importing `packages/protocol/src/` directly (worker now
  runs `nodejs_compat`; js-sha256/Web-Crypto ports, hash baselines, and both
  vendor scripts deleted — ~16k vendored lines gone). Examples regenerate
  from the package manifest via `scripts/generate-examples.mjs` (pre-hooks;
  `worker/examples/` gitignored). The three new event types reach the app
  automatically. App suite 25 node + 43 workerd green; wrangler dry-run
  bundle carries the new types and no js-sha256.
- Open follow-ups from the workstream: unforced-prose diffing belongs to
  probe-style T3/T4 in the swarm repo.

## Update 2026-07-12 — CUTOVER DONE: production deploys from the monorepo

The 07-11 blocker below is RESOLVED and the deploy cutover is complete:

- **Secrets fixed**: `CLOUDFLARE_ACCOUNT_ID` re-set to the 32-char id; a new
  API token "clista monorepo deploy (GH Actions)" was minted from the Edit
  Cloudflare Workers template (Account Resources → Include → troylati only).
  NOTE for future diagnostics: current Cloudflare user tokens are
  `cfut_`-prefixed and **53 chars** — the old "~40 chars" expectation is
  stale. `cf-diag.yml` passed all checks (run 29173970883) and was DELETED.
- **Pipeline proven**: staging deploy from CI green (run 29173984183,
  staging.clista.ai healthy) → first monorepo production deploy green
  (run 29174143736, worker version `2217f99d`, app.clista.ai healthy behind
  Access). Push trigger restored in `deploy-app.yml` (old repo's paths,
  prefixed `app/`).
- **Stray worker incident (same evening)**: a Cloudflare Workers Builds git
  integration experiment auto-deployed a worker named `clista` serving the
  raw (unbuilt) app source publicly at clista.troylati.workers.dev. Deleted
  via `wrangler delete --name clista`; verify the Workers Builds git
  integration is disconnected in the dash so a push doesn't recreate it.
  GH Actions (not Workers Builds) is the chosen deploy path — it keeps the
  staging gate and explicit production dispatch.
- **ThreadHub repoint + freeze DONE 2026-07-12 (later)**: the launchd service
  `com.lati.threadhub` now runs `~/clista/packages/threadhub/bin/cli.js`
  (WorkingDirectory likewise); the DB stays at `~/ThreadHub/data/hub.db` by
  explicit `--db` (deliberate — moving it is a future migration). Verified:
  178 records / 11 threads, `verify --all` clean from the monorepo checkout.
  lati-club/ThreadHub frozen with a pointer README (`c13b308`). Gotcha
  survived: PR #8 (publish-to-app bridge) had landed on the old remote AFTER
  the subtree cut — carried into the monorepo at `fbc1365` (suite 45/45)
  before the freeze.
- **Remaining** (from the checklist below): disable the frozen
  lati-club/clista-ai-app repo's 7 workflows (classifier-blocked; owner
  one-liner in session notes).
- `docs/new/` holds the Mutual Reliance / new-direction transfer prompt — a
  separate protocol workstream, not started, uncommitted until owner says so.

## Update 2026-07-11 (early) — cutover in progress, PAUSED on two bad secrets [RESOLVED — see above]

Where the deploy cutover stopped (session ended here; everything below the
next heading still describes the pivot itself):

- **Root CI is LIVE and green** on lati-cooki/clista: `tests.yml` (6 jobs:
  change filter, protocol JS/Python/replay, threadhub, app node+worker),
  `deploy-staging.yml` (PR paths + dispatch, same fail-closed Access gate),
  `deploy-app.yml` — **deliberately workflow_dispatch-ONLY** until the
  pipeline is proven; do NOT add the push trigger before one clean staging
  run + one explicit production run.
- **Monorepo code deploys fine**: staging.clista.ai was deployed from
  `~/clista/app` with LOCAL wrangler auth (version `97075eda`) to isolate
  the CI failure. The app code is not the problem.
- **BLOCKER — both repo secrets hold wrong values** (proven by the
  temporary `cf-diag.yml` workflow, run 29137786249):
  `CLOUDFLARE_ACCOUNT_ID` is 33 chars (must be exactly the 32-char
  `1c0cdbfbea6c50934ddcec8546507314`); `CLOUDFLARE_API_TOKEN` is 64 chars
  and the verify endpoint says "Invalid API Token" (~40-char token secret
  needed — the 64-hex value is likely the token ID, not the secret; Roll
  the token or mint a new one from the "Edit Cloudflare Workers" template
  with Account Resources → Include → troylati).
- **Resume sequence**: fix both secrets → dispatch `cf-diag.yml` (15s
  pass/fail, prints no values) → dispatch `deploy-staging.yml` → dispatch
  `deploy-app.yml` (first monorepo production deploy; verify app.clista.ai)
  → restore the push trigger in `deploy-app.yml` (paths under `app/`, see
  the old repo's workflow) → freeze lati-club/clista-ai-app (pointer
  README, disable its workflows; its uncommitted incident-doc edits were
  already carried into the monorepo) → repoint the ThreadHub launchd
  checkout when quiet → DELETE `cf-diag.yml`.
- Meanwhile **production app.clista.ai is healthy and untouched**, still
  serving the old repo's last deploy (`93d1023` content) — identical to
  monorepo `app/`. If an urgent app change is needed before cutover, land
  it in BOTH lati-club/clista-ai-app (deploys) and the monorepo (authority).

## Update 2026-07-10 (night) — MONOREPO PIVOT; new goal: MRM product

Owner decision: the multi-repo structure was limiting progress; the goal is
a true production app.clista.ai as an **MRM (model risk management) product**
— SR 11-7 effective challenge recorded as decisions with preserved dissent.

- **Ledgered first**: ThreadHub thread `monorepo-consolidation-for-the-mrm-pivot`
  (`thd_3e028f67bae0`): DR seq 1, owner decision seq 2
  `sha256:c750d2a69ca59019afd6fc8249a58cd1706b6b1a23be7e2ce63ddd595e73e34d`,
  implementation evidence seq 3 (+ correction seq 4). The
  `canonical-source-designation` seal is SUPERSEDED (pointer at its seq 13);
  its rules 1–5 (supremacy clause, provenance pins, CI pin validation,
  single entry point) lapse. The four security invariants are carried
  forward verbatim (root README) — they are product features, not process.
- **Monorepo assembled** @ `fa3a27fa`: subtree merges preserving all 438
  commits — `packages/protocol` (was clista-protocol@7dceb917),
  `packages/threadhub` (ThreadHub@41a1efe9), `app` (clista-ai-app@93d10232),
  `docs` (clista-atlas@6def6772, flattened). All suites green in place:
  protocol 355, threadhub 34, app 25 node + 43 workerd (`npm test` at root).
- **Public github.com/lati-club/clista-protocol: left as-is** (owner
  decision) — no more pushes; a historical public snapshot.

### Cutover checklist (remaining, in order)

1. **CI is OFF in the monorepo right now** — the merged workflows live at
   `app/.github/workflows/` and `packages/*/.github/`, which GitHub ignores.
   Author root `.github/workflows/` (tests per package + deploy with
   `working-directory: app`), and set the deploy secrets on lati-cooki/clista
   (Cloudflare API token etc. — secrets are not copyable, re-enter them).
2. Prove staging deploy from the monorepo, then flip production deploy here
   and freeze lati-club/clista-ai-app (pointer README; keep as archive).
   Until then: **production still deploys from lati-club/clista-ai-app** —
   land app changes there too, or hold deploys.
3. De-vendor: replace `app/worker/engine/` vendored code with direct imports
   from `packages/protocol` (workspace), retire `vendor-engine.mjs` /
   `vendor-examples.mjs` / hash baselines; examples import from the package.
4. Repoint the ThreadHub launchd service checkout from `~/ThreadHub` to
   `~/clista/packages/threadhub` when quiet. The DB at
   `~/ThreadHub/data/hub.db` is the state that matters — do NOT move it
   casually.
5. Freeze the old private repos with pointer READMEs after cutover
   (clista-atlas frozen now; ThreadHub + clista-ai-app after steps 2/4).
6. MRM roadmap seeds: model-inventory objects in the protocol grammar;
   SR 11-7 effective-challenge thread templates in the cockpit; the
   concept-drift example as onboarding; notary-as-a-service for customer
   attestation addresses.

## Update 2026-07-10 — LTN-4481 example re-issued as _r2; hide feature live

Cockpit example maintenance arc, complete, nothing open (details:
`docs/history.md` 07-10, `docs/operations.md` gotchas):

- The #77/#79 LTN-4481 log revisions could not reach the live seeded threads
  (seed-once per thread id; DO ledgers append-only). Re-issued the five
  thread ids as `*_ltn4481_r2` at the source (protocol `7dceb917`),
  re-vendored (app `e46d460`), seeded — parent 41 events incl. the
  DSMB-chair whether-to-advance dissent, chain validates clean.
- New app feature `93d10232`: `POST /api/threads/:id/{hide,unhide}` flips a
  `hidden` flag on the IndexDO card (projection metadata only; log untouched,
  thread resolvable by id; `GET /api/threads?hidden=1` audits). The five
  superseded originals are hidden. Ledger shows 16 threads, all current.
- app.clista.ai health-checked end to end (edge, Access, CI, console,
  chain-validated/replay-deterministic): green.

## Update 2026-07-08 (late evening) — re-home DONE, agents replaced

The daemon/machine-swap blocker below is RESOLVED (details:
`docs/identities.md`, `docs/history.md`). What changed:

- Raft topology is now a **single computer, TheLatiMac.local** (this Mac);
  the TheMacLati computer record was deleted and that Mac retired from Raft.
- **Clista and Protocol no longer exist on Raft.** Their replacements (same
  hub identities/keys, new Raft agent records, migrated workspaces):
  **@ClisTagent** (`29b464dc-…`, Claude/Opus) and **@ProtocolCodex**
  (`e4f8804b-…`, Codex/GPT-5.5). Old DM history is gone — re-brief via
  fresh DMs; their operating prompts are in their workspaces.
- `agent-loop-autonomy` **CLOSED 2026-07-09** — owner decision seq 21
  `sha256:d8ba166be2664fa3597edddf08137ce2ea4d7a2c17d977e16e6ffbef27c858b3`
  (22 records, chain valid): supervised-only adopted, unanimous; three-layer
  gate (minimal requirements + intra-cycle revocation + no unattended append
  authority) binds any future autonomy proposal.
- `canonical-source-designation`: **SEALED 2026-07-08** — owner record seq 12
  `sha256:2be39523a268269904c1b4e9f8b6ab359876c01349e2c03875749c73b55b1320`
  (13 records, chain valid). Full arc: DR seq 1 → hermes-raft challenge 2–6 →
  amendment seq 7 (rule 5) → ProtocolCodex pass 8–11 (implementation gate) →
  rules 1–5 implemented (atlas `62315a71…`, protocol `d76bd566…`) → seal
  citing those commits. decisions.md row moved to Decided; DR local copy
  marked ADOPTED. clista-protocol `d76bd566` PUSHED to the public remote
  2026-07-09 — rule 4 is live externally; the seal's pending-push disclosure
  is discharged.
- Chores: DONE — `raft-computer stop` on TheMacLati (Troy) and
  `raft-computer restart` here (service 0.72.1, doctor all-green,
  all three agents active). Stale key copy in `~/.slock/agents/4c17b9be-…/`
  DELETED 2026-07-09 (verified byte-identical to the canonical copy first;
  ProtocolCodex's seq 8–11 writes had already proven the canonical key).
  NOTHING REMAINS OPEN from the 07-08 re-home / canonical-source arc.

## State as of 2026-07-08 ~10:50 AM (historical — superseded above)

- **`canonical-source-designation`** (`thd_c1a2a74df65b`, ThreadHub) is the
  live decision: designate `clista-protocol` sole authority for protocol
  facts, demote the atlas to navigation-only, five binding rules. Records:
  0 genesis · 1 DR (Troy) · 2–6 hermes-raft challenge (supports with caveats;
  objection `obj_supremacy-enforceability`) · 7 Troy amendment adding rule 5
  (CI pin validation) that resolves the objection. Chain valid.
  Local DR copy: `docs/decisions/DR-2026-07-08-canonical-source.md`.
- **Troy intends to SEAL after Protocol's second challenge pass — BLOCKED
  on the dead raft-daemon.** Protocol was woken 10:36 AM, claimed the task,
  then blocked at 10:38: its wake executed on **TheMacLati.local** (same
  wrong-filesystem fingerprint as Clista's blocker — prototype `~/threadhub`
  with only founding-architecture / ship-the-support-beta, no hub, no key).
  Cause: this Mac's raft-daemon (npx `@botiverse/raft-daemon`, machine
  `machine-c1478b2f1988ce95`, hostname TheLatiMac.local) **died ~10:04 AM**;
  wakes then route to the other machine's daemon. Protocol refused to
  fork/guess keys and asked to be re-homed — correct behavior.
- **TO UNBLOCK (Troy, ~2 min): restart the raft-daemon on this Mac** —
  `raft-daemon --server-url https://api.raft.build --api-key <key>` (the
  key is the one from the original setup; Raft UI → the "DETECT RUNTIME"
  dialog → "Show setup command" re-displays it. Claude deliberately did not
  touch key material). Then re-wake Protocol in its DM ("wake Protocol —
  daemon restored, resume the canonical-source-designation second pass, see
  the 10:36 brief"). Then check
  `curl -s http://127.0.0.1:7777/t/canonical-source-designation/verify`
  for records > 8.
- **On seal** (owner record by Troy on the hub thread): implement rules 1–5
  across the atlas — README supremacy clause, per-page provenance pins
  (repo + commit), single-entry-point language, CI pin validation — and move
  the decisions.md row to Decided citing the seal record hash.

## Incidents fixed today (all committed to docs/)

- Hermes gateway's Raft bridge had died silently (~22:49 PM 07-07); fixed
  with `hermes gateway restart` (launchd-supervised). Wake hints deliver on
  reconnect.
- Clista and MacLati were stuck on stale-session errors; fixed via Raft UI →
  agent page → ↻ → **Reset Session & Restart** (workspace preserved).
- **Machine-assignment swap discovered**: Clista's runtime actually executes
  on TheMacLati.local, MacLati's on TheLatiMac.local (crossed in the Jul 6
  re-provision; Raft UI "Computer" fields are stale). Clista has NO hub
  access until re-homed — it stood down from the deliberation (correctly
  refused to fabricate; its hub key never left this Mac). Details + TODO:
  `docs/identities.md`. Clista asked to be pinged when re-homed.

## Rules that bind every session (details: atlas README invariants)

- Agents write ONLY as themselves with their own key; agents never merge;
  supervised sessions only — NO cron writers; hub stays loopback; ledgers
  are append-only. Update THIS repo in the same change as any integration
  change.

## Quick commands

```sh
curl -s http://127.0.0.1:7777/t/canonical-source-designation/verify   # challenge landed? (records > 8)
cd ~/ThreadHub && node bin/cli.js export --thread canonical-source-designation   # read the records
cd ~/ThreadHub && node bin/cli.js verify --all                        # all chains valid?
hermes gateway status                                                 # raft bridge up?
```

Raft: app.raft.build space "clista". Protocol/hermes-raft DMs have the
challenge briefs; the LEDGER is the deliberation, Raft chat is commentary.
