# Transfer prompt — resume the ClisTa canonical-source seal

Paste this into a fresh session. Read `README.md` + `docs/` in this repo
(lati-club/clista-atlas, local `~/clista-atlas`) FIRST — it is the integration
map (systems, flows, identities/keys, runbook, decisions, history). This file
is only the "where we left off" delta on top of it.

## State as of 2026-07-08 ~10:50 AM

- **`canonical-source-designation`** (`thd_c1a2a74df65b`, ThreadHub) is the
  live decision: designate `clista-protocol` sole authority for protocol
  facts, demote the atlas to navigation-only, five binding rules. Records:
  0 genesis · 1 DR (Troy) · 2–6 hermes-raft challenge (supports with caveats;
  objection `obj_supremacy-enforceability`) · 7 Troy amendment adding rule 5
  (CI pin validation) that resolves the objection. Chain valid.
  Local DR copy: `docs/decisions/DR-2026-07-08-canonical-source.md`.
- **Troy intends to SEAL after Protocol's second challenge pass.** Protocol
  (Codex, hub writer `id_0b8ea08dc760`, runs on THIS Mac) was woken at
  ~10:45 AM with an independent-scrutiny brief (stress-test rule 5,
  rule conflicts, unstated obligations on clista-protocol). A background
  watch was polling for records > 8; if the session died, check
  `curl -s http://127.0.0.1:7777/t/canonical-source-designation/verify`.
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
