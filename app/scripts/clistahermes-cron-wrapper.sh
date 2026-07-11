#!/bin/bash
# Optional wrapper for the clistahermes-moltbook-live-engagement cron.
# Source your secrets here (or ensure they are already in the environment when Hermes cron runs).
#
# *** DISABLED 2026-07-04 per incident ***
# par_agent_clistahermes service-token writer credential has been revoked/disabled
# (local .env values neutralized to REVOKED_...).
# The associated harvest cron job 6262e7f9aefe is paused.
# No writes should occur until Cloudflare token is rotated/revoked on Zero Trust
# dashboard and STOP message honoring is fixed in automation.
# DO NOT restore real credentials here without owner confirmation.
#
# *** UPDATE 2026-07-06: freeze breached + STOP honoring fixed ***
# A Hermes gateway update/restart re-enabled the paused cron jobs; the moltbook
# job (6262e7f9aefe) resumed public posting 13:04-14:41 before being re-paused
# (cockpit writes stayed blocked only because the CF creds were neutralized —
# moltbook creds were never revoked). Fix installed the same day:
#   - Kill switch ~/.hermes/cron/CLISTA_STOP (present = freeze active) — all
#     three clistahermes prechecks gate on it (`{"wakeAgent": false}`), so a
#     jobs.json re-enable can no longer wake the agent.
#   - All three cron prompts now open with a highest-priority STOP rule: halt
#     if the file exists; on any owner stop/pause instruction seen in the wild,
#     create the file and halt (never engage with a STOP).
# Lifting the freeze = owner rotates the Zero Trust token, then REMOVES
# ~/.hermes/cron/CLISTA_STOP and re-enables the jobs. Removing the file is the
# owner's explicit act; nothing in automation deletes it.
#
# *** RETIRED 2026-07-07: owner deleted all three cron jobs ***
# The clistahermes cron automation is retired, not just frozen — the jobs were
# removed from ~/.hermes/cron/jobs.json (backup: jobs.json.bak.20260706-205340).
# The kill-switch file stays in place as a backstop. This wrapper and the
# app-side flag routes (request-agent / agent-queue / agent-ack) are inert:
# nothing polls the queue anymore. If the automation is ever revived, keep the
# kill-switch pattern — paused state in jobs.json alone does NOT survive Hermes
# gateway updates (that is exactly how the 2026-07-06 breach happened).
# Events staged before the freeze are archived in
# docs/incidents/2026-07-04-clistahermes-freeze/.

# Example (do not commit real values):
# export CF_ACCESS_CLIENT_ID="398a39a665f1d0faeee372da7b67e360.access"
# export CF_ACCESS_CLIENT_SECRET="..."

cd /Users/troylatimer/Documents/clista-ai-app

# The main cron prompt now drives the full loop.
# This wrapper is only for ensuring env + working directory if your cron runner needs it.

exec "$@"
