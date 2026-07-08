# Transfer prompt — resume the ClisTa agent-loop work

Paste this into a fresh session. Read `README.md` + `docs/` in this repo
(lati-club/clista-atlas, local `~/clista-atlas`) FIRST — it is the integration
map (systems, flows, identities/keys, runbook, decisions, history). This file
is only the "where we left off" delta on top of it.

## State as of 2026-07-08 ~01:10 AM

Everything merged, deployed, green:
- clista-protocol v0.33.0 · clista-ai-app (re-review owner-notify #40,
  approve-as-objection #41, export+archive #42) · ThreadHub (agent-loop
  harness #6, generic signed `send` #7). Suites: protocol ~350 / app 25+41 /
  hub 34 — all passing.
- ThreadHub runs via launchd `com.lati.threadhub` on `127.0.0.1:7777`
  (loopback-only, deliberate). Store: 8 threads incl. the first real archive
  `clista-agent-app-archive-0bf0bb6f` (the 2026-06-24 A2A charter decision,
  head `sha256:69e90bb3ad2d…912c97`).
- Active hub writers (per-agent non-custodial keys — see
  `docs/identities.md` for the full table): **hermes-raft**
  (`id_3ae9ab170ba0`, woken via Raft `wake @hermes-raft`) and **Clista**
  (`id_2ab003576c60`, woken via Raft DM). Octopus (`id_140db57a3dc5`) emits
  build signals automatically during `/octopus` runs.

## In flight — check these first

1. **Clista's deliberation on `agent-loop-autonomy`** (`thd_8743a56ee608`).
   Woken by DM 2026-07-08 01:05 AM (was Offline at send time). At handoff the
   thread had **7 records**: genesis, two ParticipantDeclared, and
   hermes-raft's evidence + claim `clm_scheduled-pause-insufficient` +
   position (supervised-only) + objection `obj_safeguards-insufficient`.
   → `curl -s http://127.0.0.1:7777/t/agent-loop-autonomy/verify` — if
   records > 7, Clista responded; read the new records and brief Troy. If
   still 7 after a while, Clista's runtime never woke — tell Troy to re-wake
   it in Raft (message pointing at
   `~/.slock/profiles/clista_agent/threadhub-prompt.md`).
   Re-arm the ledger watch (poll verify every ~15s, report new records with
   seq/author/event/content).
2. **The `agent-loop-autonomy` decision itself** — supervised-only vs
   scheduled autonomy + safeguards. Agents stage; Troy merges. When decided:
   it gates any cron writer AND any hub network exposure (Protocol/MacLati
   participation). Consider archiving it once decided.
3. **Deferred, decision-gated**: hub network exposure (tunnel + per-agent
   auth); email alerts for re-review (send_email binding is documented but
   commented in clista-ai-app `wrangler.jsonc` — needs
   `wrangler email sending enable clista.ai` + uncomment);
   protocol schema split (8,220-line schemas file, noted upstream, unowned).

## Rules that bind every session (details: atlas README invariants)

- Agents write ONLY as themselves with their own key; agents never merge;
  supervised sessions only — NO cron writers (open decision, and the 07-04/06
  incidents are why); hub stays loopback; ledgers are append-only.
- Never run ThreadHub remote smoke (`THREADHUB_URL`) against the real local
  hub — smoke residue is permanent.
- Update THIS repo in the same change as any integration change.

## Quick commands

```sh
cd ~/ThreadHub && node bin/cli.js verify --all          # all chains valid?
curl -s http://127.0.0.1:7777/ | head -3                 # hub up? (else launchctl kickstart gui/501/com.lati.threadhub)
open http://127.0.0.1:7777/t/agent-loop-autonomy         # the live deliberation ledger
cd ~/Documents/clista-ai-app && node scripts/archive-thread.mjs <threadId>   # archive a decided cockpit thread
```

Raft: app.raft.build space "clista" (#all + DMs). Wake agents there; the
LEDGER is the deliberation, Raft chat is commentary.
