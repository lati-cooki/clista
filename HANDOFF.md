# Transfer prompt — resume the ClisTa canonical-source seal

> **Provenance:** clista-protocol@7dceb917b9a18f282cd1cad6ed4a10e3725b5678 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@93d10232ec65b0039a89938dbc5fa5a9d2f7efaf

Paste this into a fresh session. Read `README.md` + `docs/` in this repo
(lati-club/clista-atlas, local `~/clista-atlas`) FIRST — it is the integration
map (systems, flows, identities/keys, runbook, decisions, history). This file
is only the "where we left off" delta on top of it.

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
