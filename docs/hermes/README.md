# Phase 4 — the emergent meta-thread seeder (Hermes cron)

The third autonomous loop. It watches the moltbook feed for a **cluster** of signal on a ClisTa
meta-topic and, when one forms, **proposes** a canonical decision thread into the app's triage
inbox (`POST /api/agent/intake`). A human approves it in the cockpit, which creates the
human-owned thread — so the agent never creates or owns a thread (the governance boundary that
makes this safe). It never posts to moltbook or Raft; its only side effect is enqueuing a
proposal.

These files live in **this repo** as the source of truth; they are **installed** into
`~/.hermes` by the owner. Nothing here runs until you install it.

## Files
- **`clista-emergent-meta-precheck.sh`** — the wake-gate. Fail-closed, always `exit 0`, last
  stdout line is the JSON gate. **Cluster gate (load-bearing):** wakes only when ≥2 *independent*
  fresh moltbook posts map to the same theme, the theme isn't in cooldown, and the posts aren't
  already owned by the deliberation loop. Signals **accumulate** across ticks (a post is only
  marked consumed when its theme actually wakes). Verified offline via the
  `PRECHECK_FAKE_CANDIDATES` test hook (cluster→wake, consumed→silent, accumulation, cooldown).
- **`clista-emergent-meta-prompt.md`** — the cron prompt (what the agent does on wake: synthesise
  a grounded proposal per waking theme, `POST /api/agent/intake`, append a themes row).
- **`clista-emergent-meta-job.json`** — a reference `jobs.json` entry (structure only).

## Install (owner)
1. **Copy the precheck** into the Hermes scripts dir:
   ```sh
   cp docs/hermes/clista-emergent-meta-precheck.sh ~/.hermes/scripts/
   chmod +x ~/.hermes/scripts/clista-emergent-meta-precheck.sh
   ```
2. **Add the job** to `~/.hermes/cron/jobs.json` (back up first; the scheduler hot-reloads per
   tick, so no restart). This jq snippet slurps the prompt for you and appends the job — replace
   the id with a fresh 12-hex value:
   ```sh
   cd /Users/troylatimer/Documents/clista-ai-app
   cp ~/.hermes/cron/jobs.json ~/.hermes/cron/jobs.json.bak.$(date -u +%Y%m%d-%H%M%S)
   jq --rawfile p docs/hermes/clista-emergent-meta-prompt.md '
     .jobs += [{
       id: "a1b2c3d4e5f6",
       name: "clistahermes-emergent-meta-seeder",
       prompt: $p, skills: ["moltbook"], skill: "moltbook", model: null,
       script: "clista-emergent-meta-precheck.sh", no_agent: false,
       schedule: { kind: "cron", expr: "0 */4 * * *", display: "0 */4 * * *" },
       schedule_display: "0 */4 * * *", enabled: true, state: "scheduled",
       deliver: "local", workdir: "/Users/troylatimer/Documents/clista-ai-app"
     }]' ~/.hermes/cron/jobs.json > /tmp/jobs.json && mv /tmp/jobs.json ~/.hermes/cron/jobs.json
   ```
   (Or use `hermes cron create` if you prefer its CLI; point `--script` at the precheck and feed
   the prompt from the md file.)
3. **Dry-run the gate** (should be silent on a quiet feed; it reads live moltbook with your
   creds):
   ```sh
   bash ~/.hermes/scripts/clista-emergent-meta-precheck.sh; echo "exit=$?"   # expect {"wakeAgent": false}, exit 0
   ```
4. **Test-fire** once it's enabled (classifier-gated for the assistant, so this is yours):
   `hermes cron run <id>`. With a real cluster present it enqueues one `thread_proposal` per
   waking theme; verify in the cockpit Triage inbox, and that
   `~/.hermes/cron/clista-emergent-themes.tsv` got a row.

## State files (created on first run, in `~/.hermes/cron/`)
- `clista-emergent-feed-seen.tsv` — consumed post ids (append-only, bounded; cold-start baselines
  silently).
- `clista-emergent-themes.tsv` — `theme ⇥ last_proposed_at ⇥ last_itk_id ⇥ signal_count`; drives
  the per-theme cooldown. The **agent** writes this after each proposal (the precheck only reads
  it).

## Tuning
- `CLUSTER_MIN` (default 2) — independent fresh posts to wake. Raise to be stricter.
- `COOLDOWN_HOURS` (default 72) — min gap between proposals on the same theme.
- `THEME_TERMS` — the theme→search-terms map. Add themes/terms; keep terms distinctive so silent
  ticks stay the norm.
- Schedule `0 */4 * * *` (every 4h) — lower frequency than the reply loops, since thread proposal
  is higher-impact.

## De-confliction with the other two loops
- Excludes clistahermes' own posts and any post already in `clista-app-deliberation.tsv` (owned by
  the deliberation loop), so it won't propose over work the other loops are handling.
- Its `feed-seen` / `themes` state is independent of the moltbook loop's `feed-seen`.
- It never posts externally, so it cannot react to its own output (no feedback loop).

## Rollback
Remove the job object from `jobs.json` (or restore the `.bak`), and optionally delete the two
state files. The precheck script is inert once no job references it.
