# History — how this system got here

Condensed timeline; details live in the linked repos/docs.

## 2026-06 — consolidation and going public

- **06-04** clista-protocol re-baselined at `~/clista-protocol` (fresh start);
  three older clista dirs archived to `~/clista-archive`.
- **06-07** Public flip: github.com/lati-club/clista-protocol (v0.30.1) with
  the debate pack + judging pre-registration, decided via a ledgered ClisTa
  debate (run-4).
- **06-10/11** ThreadHub built (record envelope v0, ed25519 + node:sqlite);
  Octopus↔ThreadHub integration (octo-build, csv-cli running example
  cross-cited into the protocol repo).
- **06-23/24** app.clista.ai agent-deliberation era: clistahermes cron loop
  (moltbook + Raft harvesting); Raft space "clista" formed; **06-24 the A2A
  integration decision** (the loop's charter) decided in the cockpit.
- **06-29** Pharma phase-gate examples decided (LTN-4481 set).

## 2026-07 — the incident and the rebuild

- **07-04 INCIDENT**: the clistahermes harvest automation did not honor STOP
  orders and appended chat content (including the stop orders themselves) to
  production threads under its own identity — the authored-by ≠
  transport-writer failure. Local containment failed (remote writer);
  contained only by global Cloudflare token revocation. Evidence exports
  preserved (`~/clista-incident-20260704/`, tasks #3/#5; #8 closed as
  replay-unavailable).
- **07-06 BREACH**: a Hermes gateway update resurrected the paused cron jobs
  (pause state lives in `jobs.json`, which updates rewrite). Kill-switch file
  pattern (CLISTA_STOP) added, then the whole path decommissioned.
- **07-07 RETIREMENT + REBUILD** (one day, in order):
  - clistahermes jobs deleted, Moltbook campaign retired (protocol PR #67),
    deliberation surface removed from the app (PR #39).
  - Protocol v0.33.0-maintainability (cli/validator split #49) synced into
    the app (PR #38).
  - Re-review loop hardened: current-owner resolution + email seam
    (app PR #40), intake approve-as-objection (PR #41).
  - ThreadHub agent-loop test harness + `--rate-limit` (ThreadHub PR #6),
    generic signed `send` (PR #7).
  - Persistent hub via launchd; **hermes-raft** identity + first supervised
    deliberation on `agent-loop-autonomy`; **Clista** identity added with the
    no-impersonation rule after Protocol refused the shared-identity prompt.
  - App→ThreadHub archive feed (export route + `archive-thread.mjs`, PR #42);
    **first real archive**: the 06-24 A2A decision →
    `clista-agent-app-archive-0bf0bb6f`.
- **07-08** This atlas created.
- **07-08 (evening) RAFT RE-HOME**: the Jul 6 machine-assignment swap fixed.
  Both Raft computer records had been named "TheMacLati.local" with agents
  crossed onto the wrong machines; Raft UI cannot move agents between
  computers, so Clista and Protocol were deleted and recreated on the hub
  machine as **@ClisTagent** and **@ProtocolCodex** (workspaces, ThreadHub
  keys and prompts migrated; hub author ids unchanged). The TheMacLati
  computer record was deleted — Raft topology is now a single computer,
  TheLatiMac.local. Meanwhile `agent-loop-autonomy` converged: hermes-raft
  (records #10–11) confirmed a clean scheduler and closed on supervised-only;
  formal decision record pending.

## Lessons that became invariants

1. Pause state that lives in a file an updater rewrites is not a control →
   kill switches must live outside the managed state, and scheduled writers
   need them BEFORE first run.
2. Transport writers must never author others' content → per-agent
   non-custodial keys everywhere (ThreadHub's design).
3. Local containment of a remote writer is an illusion → credentials are the
   only global off-switch; revoke server-side.
4. Decided ≠ preserved → archive decided threads to the notary for addresses
   that outlive any one platform.
