# Incident: clistahermes automation freeze (2026-07-04) → retirement (2026-07-07)

## Timeline

- **2026-07-04** — Owner froze all clistahermes agent writes. The
  `par_agent_clistahermes` Cloudflare Access service-token values were
  neutralized in the local Hermes env, and the three Hermes cron jobs
  (moltbook engagement `6262e7f9aefe`, app-thread deliberation `e31c1a1dd850`,
  emergent-meta seeder `cf20e6b92686`) were paused. Condition for resuming:
  rotate the token on the Zero Trust dashboard AND fix STOP-message honoring
  in the automation.
- **2026-07-06** — **Freeze breached.** A Hermes gateway update/restart
  re-enabled the paused jobs; the moltbook job ran 13:04–14:41 and posted
  publicly again (its moltbook credentials had never been revoked — only the
  Cloudflare Access pair was neutralized, which is the only reason cockpit
  writes stayed blocked). Root cause: the paused state lived solely in
  `~/.hermes/cron/jobs.json`, which the updater rewrites.
- **2026-07-06 (same day)** — STOP-honoring fixed: kill-switch file
  `~/.hermes/cron/CLISTA_STOP`; all three precheck scripts gate on it first
  (emit `{"wakeAgent": false}` so the agent never wakes), and the cron prompts
  were prepended with a highest-priority halt rule (halt if the file exists;
  on any owner stop instruction seen on moltbook/Raft/threads, create the file
  and halt). Verified live.
- **2026-07-07** — Owner deleted all three cron jobs: the automation is
  **retired**, not merely frozen. The kill switch remains as a backstop. The
  app-side deliberation flag routes (`request-agent`, `/api/agent/queue`,
  `agent-ack`) still exist but nothing polls the queue.

## Lesson

If the automation is ever revived: a paused/disabled flag in `jobs.json` does
not survive Hermes gateway updates. Keep the out-of-band kill-switch pattern
(sentinel file checked by the precheck before any network access), and revoke
credentials server-side, not just locally.

## Stranded drafts (`drafts/`)

Four events for thread `thd_mrm_task_transfer`, staged by the deliberation
loop just before the freeze and never appended (the neutralized credentials
fail-closed all writes). Archived here verbatim for the record; they were
never part of any live event log. If the thread's decision is ever recorded,
do it deliberately via the cockpit or `scripts/agent-post.mjs` — note that
`DecisionMerged` must come from the thread's authorized human decision owner,
not the agent.

1. `draft-1-objection-resolved.json` — `ObjectionResolved`
   (`obj_receiver_handoff_not_yet_observed`)
2. `draft-2-decision-merged.json` — `DecisionMerged`
   (`dcr_mrm_task_transfer_verdict`, approved with conditions)
3. `draft-3-minority-projector-identity-64.json` — `MinorityReportFiled`
   (projector identity)
4. `draft-4-minority-vina-drift.json` — `MinorityReportFiled`
   (receiver-compatibility interpretation drift)

## Task #8 raw ordered DO rows (post-retirement closure)
Independent replay evidence via raw ordered Durable Object rows for task #8 is unavailable (see clista-incident-task8-raw-rows-unavailable-20260707.md in this dir and the main clista-incident-20260704/ archive). Only task3 and task5 had raw-rows exports via the temporary forensic endpoint. No such dump for task #8 was produced or recoverable after token revocation and endpoint reversion. The append-only event log remains the protocol source of truth for replay.
