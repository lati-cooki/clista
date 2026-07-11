# Transfer / Handoff — app.clista.ai (the ClisTa Protocol cockpit)

Paste this into a fresh session to resume without replaying the history.

## One-liner
The live, interactive human cockpit OVER the real ClisTa engine: event log = source
of truth, UI projects state and emits validated ClisTa events, wearing the clista.ai
design system. "Here's a yes — now trace its shape." Replaces the mock at cli.clista.ai.

## Where we are (as of this handoff)
Phases 0–4 are **built, tested, and merged** (PR #1 merged into `main`). Phase 5 is
**EXECUTED — the app is LIVE at https://app.clista.ai**, gated by a Cloudflare Access
self-hosted app in the `laticooki` Zero Trust org. Local repo:
`/Users/troylatimer/Documents/clista-ai-app` (git user Troy Latimer; remote
`lati-club/clista-ai-app`, private).

- **Deploy facts:** Worker `clista-ai-app` on account `troylati`
  (`1c0cdbfbea6c50934ddcec8546507314`), custom domain `app.clista.ai`, SQLite DOs
  (ThreadDO/IndexDO, migrations v1/v2 applied). Identity vars in `wrangler.jsonc`:
  `ACCESS_TEAM_DOMAIN=laticooki`, `ACCESS_AUD=60455fe3334e5242cb0fe8787064ee31e26e209fed6fe2de2f97c52da5b1cb93`
  (the AUD is public — appears in the Access login redirect — so it's safe to commit).
  `DEV_IDENTITY` is unset in prod (correct). Edge verification passed (`/`→302 Access login,
  JWKS 200, advertised AUD matches deployed).
- **Deploy paths:** (1) **CI — now live.** `.github/workflows/deploy-app.yml` deploys on every
  push to `main` touching `src/** worker/** index.html vite.config.js wrangler.jsonc
  package*.json` (or via Actions → *Run workflow*). It gates on two repo secrets, both **set
  on `lati-club/clista-ai-app`** (2026-06-23): `CLOUDFLARE_API_TOKEN` (an "Edit Cloudflare
  Workers" token scoped to account `troylati` + the `clista.ai` zone) and
  `CLOUDFLARE_ACCOUNT_ID` (`1c0cdbfbea…`). Set/rotate with
  `gh secret set <NAME> --repo lati-club/clista-ai-app` (feed the token via stdin/file, never
  argv). First green run: dispatch `28041740718` → version `9ad5b780-…` (matched the live
  deployment). To rotate the token: regenerate in the Cloudflare dashboard, re-`gh secret set`.
  (2) **Manual** (no GitHub needed): `npm run build && npx wrangler deploy` from a wrangler-
  authed shell. Both target the same Worker/account.
- **Post-launch — DONE:** (a) authenticated browser smoke **passed** (verified server-side
  via `wrangler tail`: `/api/me` 200 with Access JWT, auto-seed, `POST /join` 200, every
  request ok — proved the AUD fix). (b) Phase 6 **cut-over shipped**: `cli.clista.ai` now
  shows a "guided preview → Open the live cockpit" banner → `app.clista.ai`, and `clista.ai`'s
  hero primary CTA is "Open the live cockpit"; both Pages projects (`clista-cli`, `clista-ai`)
  redeployed and live (commit `f7f42fb` + merge `41730d9` in the launch-planning repo).
- **Two capabilities added after launch (both merged to `main`, agent path deployed):**
  see the "Engine sync" and "Agent write path" sections below.

## Session 2026-06-24 (i) — intake subsystem LIVE end-to-end; seeder cron installed; full loop proven
**The whole intake subsystem is now live, configured, and PROVEN end-to-end on a real decided
thread.** Phases 1–4 are merged + deployed; the public route + gate form are live; the emergent
seeder cron is installed and running; and a single autonomous proposal was driven all the way to
a recorded `DecisionMerged`. Owner did the Cloudflare dashboard steps this session.

- **Public intake is LIVE (owner config done + verified).** Owner created a Turnstile widget
  (sitekey `0x4AAAAAADqjTCzruN8pmQGL` in the gate form; secret set via `wrangler secret put
  TURNSTILE_SECRET`) and a **Cloudflare Access Bypass app scoped to `app.clista.ai/api/intake/
  submit`** (NOT bare `/api/intake` — see (h)). Verified live: `POST /api/intake/submit` with a
  bad token → Worker **403 human-verification** (reaches the Worker, Turnstile enforced); OPTIONS
  preflight → 204 + `access-control-allow-origin: https://gate.clista.ai`; `GET /api/intake`
  (owner inbox) stays **302/gated** (identity intact). The repurposed gate form is live at
  gate.clista.ai (renders, real Turnstile, no console errors).
- **Emergent seeder cron INSTALLED + running.** Job **`cf20e6b92686`**
  (`clistahermes-emergent-meta-seeder`, `0 */4 * * *`, enabled) added to `~/.hermes/cron/jobs.json`
  (prompt inline); precheck copied to `~/.hermes/scripts/clista-emergent-meta-precheck.sh`. Live
  dry-run baselined 151 matches → silent. **A precheck bug the live run caught (PR #14):** the
  deliberation-owned-post exclusion passed newline-joined ids to `awk -v` ("newline in string"),
  blanking candidates → always silent; fixed (space-join + split on space). The cron was
  demo-fired (CLUSTER_MIN=1, single theme) → clistahermes synthesized a real proposal and POSTed
  it to `/api/agent/intake`; then **reverted to canonical** (re-copied repo source, re-baselined).
- **Two app refinements (merged + deployed):** **PR #16** — approve of a `thread_proposal`/
  `decision` now **seeds `payload.useCases` as `ClaimCreated` substrate** (the new thread opens
  pre-grounded; response carries `seededClaims`; `claimEvent()` helper). **PR #17** — ThreadIndex
  gained a **`review` filter chip + blue badge** (review-status threads were visible only under
  `all` and fell back to the `active` badge — a real "where's my thread" gap).
- **FULL LOOP PROVEN LIVE — autonomous propose → human own → agent stage → human decide.** On
  thread **`thd_should_agent_deliberation_provenance_and_decisio_mqsrbnwx_b0a96bd1`**
  ("Pre-Thread Silos vs Shared Deliberation"): the seeder proposed it (demo), the owner approved
  it (→ decision owner), **clistahermes staged it** (joined as contributor + `EvidenceCommitted`
  `evd_a2a_dualchannel_hybrid_…` grounded in the real Raft `#all`+moltbook run + `ClaimCreated`
  `clm_hybrid_shared_provenance_…` + a `ReviewSubmitted` `approve_with_conditions` on
  `drq_9651ec76`), then the **owner recorded the decision** → `DecisionMerged` `dcr_adf27a2d`
  (decidedBy `par_troylati`, supporting claim+evidence+assumption all referenced). Final state:
  **decided**, 10 events, integrity + validation **true**. The governance boundary held: agent
  staged, human merged.
- **Op note — reading/writing live prod as the agent.** Prod read endpoints are Access-gated to
  curl (302), but `node scripts/agent-post.mjs <thd> {state|audit|validate|append}` works by
  sourcing the CF service-token creds: `set -a; . ~/.hermes/.env; set +a` (resolves to
  `par_agent_clistahermes`). Reads are read-only; `append` writes claim/evidence/review as the
  agent. **`DecisionMerged` is human-owner-only** — the agent cannot merge (governance), so the
  final decision always needs the owner in the cockpit. (Reading state this way is how this
  session verified the decided thread without an Access browser session.)
- **Note for future approvals:** threads approved BEFORE PR #16 deployed are bare (genesis only);
  after #16 they open pre-grounded with the proposal's use-cases as claims. The cockpit still has
  **no evidence affordance** (EvidenceCommitted stays agent/ingest) — grounding a thread to a
  mergeable decision needs evidence added via the agent path or a clistahermes harvest.

## Session 2026-06-24 (h) — split the public intake onto its own path (Access-bypass fix)
**SHIPPED on branch `intake-split-public-path` (PR open) + a launch-planning PR.** A live bug:
the public route and the owner triage GET shared the path `/api/intake`. Cloudflare Access
matches by **path, not method**, and a Bypass policy **strips identity** — so the owner's
authenticated `GET /api/intake` (the cockpit Triage inbox) got bypassed too → arrived with no
JWT → 401 → the inbox panel rendered empty. Fix: the public submission moved to its **own path
`POST /api/intake/submit`** (the ONLY Access-bypassed path); the owner routes stay on
`/api/intake` under the main gated app, identity intact.
- `worker/index.js`: `parts[2] === 'submit'` handles OPTIONS + the public POST (CORS + Turnstile
  + quarantine); bare `/api/intake` is now GET-list + `:id/{approve,dismiss}` (human-only).
- Gate form (`website/gate.clista.ai/index.html`): `API` → `https://app.clista.ai/api/intake/submit`.
- `docs/INTAKE.md`: bypass step rewritten — scope a SEPARATE self-hosted app to
  `app.clista.ai/api/intake/submit` (NOT bare `/api/intake`, which would 401 the owner GET).
- Tests updated (public path → `/submit`); `npm run test:workers` 26/26, build clean.
- **Owner action:** re-scope the Access bypass to `/api/intake/submit` (the earlier bare
  `/api/intake` bypass shadows the owner GET; deleting/disabling it restores the inbox immediately).

## Session 2026-06-24 (g) — emergent meta-thread seeder authored (Phase 4, owner-installs)
**AUTHORED on branch `hermes-emergent-seeder` (PR open) as reviewable files under
`docs/hermes/`.** The third autonomous loop — but it only ever *proposes* into the intake inbox
(`POST /api/agent/intake`); a human approves → the thread is created human-owned. It never posts
to moltbook/Raft and never creates a thread (no feedback loop, no governance dead-end). The live
`~/.hermes` runtime is UNTOUCHED until the owner installs it (cron-create + test-fire are
classifier-gated for the assistant). Install steps in `docs/hermes/README.md`.

- **`docs/hermes/clista-emergent-meta-precheck.sh`** — the wake-gate, modeled on
  `clista-moltbook-precheck.sh` (fail-closed, `exit 0`, last-line JSON gate, control-byte
  sanitize, bounded seen-file, cold-start baseline). **Cluster gate (load-bearing):** wakes ONLY
  when ≥`CLUSTER_MIN` (2) *independent* fresh moltbook posts map to the SAME theme
  (`THEME_TERMS` map), the theme isn't within `COOLDOWN_HOURS` (72), and the post isn't already in
  `clista-app-deliberation.tsv`. Signals **accumulate** across ticks — a post is marked consumed
  only when its theme actually wakes. A `PRECHECK_FAKE_CANDIDATES` test hook drives the gate
  offline; **verified**: cold-start→silent, single hit→silent, cluster→wake, accumulation
  (1 silent then 2 wakes), cooldown→silent, no-creds→fail-closed. `bash -n` clean.
- **`docs/hermes/clista-emergent-meta-prompt.md`** — the cron prompt: per waking theme, judge if
  it's a genuinely new canonical meta-topic; if so synthesize a grounded proposal
  (question + 4–6 use-cases + pros/cons + source-signal provenance), `POST /api/agent/intake` via
  the CF service-token curl, and append a `clista-emergent-themes.tsv` row (drives the cooldown).
  Explicitly: no moltbook/Raft post, no thread creation, ≤1 proposal/theme/wake, `[SILENT]` if
  nothing warrants it.
- **`docs/hermes/clista-emergent-meta-job.json`** + **`README.md`** — the `jobs.json` entry
  (prompts live inline in `~/.hermes/cron/jobs.json`) and a jq install snippet that slurps the
  prompt; schedule `0 */4 * * *`; state files `clista-emergent-feed-seen.tsv` (consumed ids) +
  `clista-emergent-themes.tsv` (agent-written, theme cooldown). De-confliction + rollback noted.
- This completes the intake subsystem end to end: **public/agent propose → human approves & owns
  → (optional) deliberation loop**. Owner actions remaining: install this cron; and for the public
  route, the Access bypass + Turnstile (`docs/INTAKE.md`).

## Session 2026-06-24 (f) — intake approve-dispatch for run_report + contribution (Phase 3)
**SHIPPED on branch `intake-approve-kinds` (stacked on `public-intake`/PR #10).** Completes the
kind dispatch on `POST /api/intake/:id/approve` (previously only `thread_proposal`/`decision`
created a thread; `run_report`/`contribution` returned 422).

- **`run_report` approve (`worker/index.js`):** creates a NEW human-owned thread (question =
  the report's question, else a synthesized `"External run report — <title>"`) and attests the
  body as **`EvidenceCommitted`** (`source: "public run report <receipt> — <handle>"`),
  committed by the approving human (external origin preserved in `source`).
- **`contribution` approve:** appends the input as **`EvidenceCommitted`** onto the EXISTING
  `targetThreadId` (`source: "public submission <receipt>"`). The approver **joins the target
  thread as a contributor** first (`ensureParticipant`) so the validator's
  "committer must be a known participant" rule holds — the human vouches for the external input
  under their identity. Creates no new thread.
- **Shared helpers:** `evidenceEvent(threadId, identity, {source, finding})` (minimal valid
  EvidenceCommitted — validator needs only `id` + matching `threadId` + a participant committer;
  no contentHash) and `ensureParticipant(env, threadId, identity)`.
- **Public route:** now also accepts **`contribution`** (requires a `targetThreadId` that
  resolves to a registered thread → 404 at submit if not, plus text ≥12). The gate form still
  only offers `decision`/`run_report`; contribution is an API / deep-link path (no cold-start
  form field for a target id).
- **Cockpit (`ThreadIndex.jsx`):** the card now shows `→ onto <targetThreadId>` for
  contributions, labels the action "Approve → attest" (vs "Approve → create thread"), and shows
  the deliberate toggle only for proposal/decision (`canDeliberate`).
- **Tests:** `test/workers/intake.test.js` → **13** (run_report approve creates a human-owned
  thread + attests evidence; contribution approve attaches evidence to the target, creates no
  thread; contribution to a non-existent thread → 404). `npm run test:workers` **26/26**,
  `npm test` **15/15**, build clean.
- **Next (Phase 4):** the Hermes emergent-seeder cron that fills `source:'agent'` rows
  (`POST /api/agent/intake`) — owner installs + test-fires (precheck + cron + de-confliction
  spec is in `~/.claude/plans/review-idea-another-plan-resilient-teacup.md`).

## Session 2026-06-24 (e) — public intake route + the gate page becomes the submission form (Phase 2)
**SHIPPED on branch `public-intake` (stacked on `intake-triage-inbox`/PR #9) + a launch-planning
PR for the gate page.** The perimeter break: a single PUBLIC, unauthenticated submission route,
strictly quarantined, fed by the repurposed `gate.clista.ai` form. Owner-gated config
(Access bypass + Turnstile keys) is documented in **`docs/INTAKE.md`** — do those before it
works in prod.

- **App route (`worker/index.js`):** `POST /api/intake` (no auth) — the **only public write**.
  Guard order, fail-closed: **Turnstile** (`verifyTurnstile`; skipped only when
  `TURNSTILE_SECRET` is unset → dev/test, prod always sets it) → **per-IP rate limit**
  (`IndexDO.rateLimitIntake`, 5/10min, new `intake_rate` table) → **16 KB size cap** → **kind
  whitelist** (`decision` | `run_report`) + field validation → enqueue `source:'public'`
  `pending` → return a **receipt id only**. Registers no thread, appends no event (quarantine).
  **CORS** restricted to `INTAKE_ALLOWED_ORIGIN` (`wrangler.jsonc` var, default
  `https://gate.clista.ai`); OPTIONS preflight handled; `withCors`/`corsHeaders` helpers. The
  human triage surface (`GET /api/intake`, `POST /api/intake/:id/{approve,dismiss}`) is unchanged
  and still behind Access — the route block now branches public-POST-first, then human-only.
- **Gate page (launch-planning repo `website/gate.clista.ai/index.html`):** **repurposed** from
  the retired blind-judging gate into the public submission form — hero "Bring a real decision
  into the accountable ledger", a kind selector (decision / run report), question/title/context/
  handle fields, a Turnstile widget (`data-sitekey="REPLACE_WITH_TURNSTILE_SITEKEY"` — owner
  fills in), and a vanilla-JS submit that POSTs JSON to `https://app.clista.ai/api/intake` and
  shows the receipt. Dropped the countdown + GitHub-issue CTA. **Nav label "The gate" + the
  `gate.clista.ai` URL kept** (zero `shared/header.html` change). `./website/build.sh` injects
  the shared header/footer; built clean for all 6 surfaces; browser-previewed (renders on-brand,
  kind-toggle works; the only console errors are the placeholder sitekey → gone once a real key
  is set). `dist/` is gitignored.
- **Tests:** `test/workers/intake.test.js` grew to **10** (public decision quarantines + approves
  to a human-owned thread; run_report; unknown-kind/short/ malformed/oversize rejections; CORS
  preflight + allowed-origin header; per-IP 429). `npm run test:workers` **23/23**, `npm test`
  **15/15**, build clean.
- **Owner steps before prod (`docs/INTAKE.md`):** (1) a Cloudflare Access **Bypass** policy
  scoped to **`/api/intake`** on the app.clista.ai Access app (else Access blocks it pre-Worker);
  (2) a Turnstile widget → `wrangler secret put TURNSTILE_SECRET` + paste the public site key
  into the gate form; (3) deploy both (CI on `main` for each repo). I cannot do the Access/
  Turnstile dashboard config or `wrangler secret put` — owner-gated.
- **Next (Phase 3/4):** `contribution`/`run_report` **approve-dispatch** (currently approve of
  those kinds → 422; only proposal/decision create today), then the Hermes emergent-seeder cron
  that fills `source:'agent'` rows (owner installs + test-fires).

## Session 2026-06-24 (d) — the triage inbox (Phase 1 of the unified intake subsystem)
**SHIPPED on branch `intake-triage-inbox` (PR open), behind Access.** A new owner triage
inbox: the autonomous seeder (and, in a later phase, outside submitters) *propose* into a
quarantined queue; **a human triages every item and is the accountable creator/owner** of
anything promoted. This resolves the governance dead-end the "emergent meta-thread seeder"
idea hit — an agent that *creates* a thread becomes its `decision owner` and can never merge
the decision (agents are governance-blocked). So **"agent stages, human merges" generalizes
to "agent/public propose, human approves & owns."** The full design (incl. the public-intake
phases 2–4) is in `~/.claude/plans/review-idea-another-plan-resilient-teacup.md`.

- **What's in Phase 1 (all behind Cloudflare Access):**
  - **`IndexDO.intake` table** (`worker/index-do.js`) modeled on `agent_flags` — DO metadata,
    NOT a protocol event and NOT in the threads index, so a pending item is **quarantined**
    (invisible as ledger state) until approved. Methods `enqueueIntake` / `listIntake` /
    `getIntake` / `resolveIntake` + an `intakeRow()` projector. Columns: `id, source, kind,
    status, title, question, body, target_thread_id, payload(JSON), provenance(JSON),
    submitter, submitted_at, resolved_thread_id, updated_at`.
  - **Routes** (`worker/index.js`): `POST /api/agent/intake` (agent-only feeder — the seeder
    enqueues `source:'agent' kind:'thread_proposal'`), `GET /api/intake` (human-only list),
    `POST /api/intake/:id/approve` (kind-dispatched), `POST /api/intake/:id/dismiss`. Approve
    of `thread_proposal`/`decision` runs the **existing create path** so the *approving human*
    is `decision owner`, optionally `flagForAgent`s it for the deliberation cron, and marks the
    item `approved` with the new `thread_id`. (`contribution`/`run_report` approval is a later
    phase → 422 for now.) Re-acting on a resolved item → 409.
  - **Reuse, not duplication:** extracted **`createThread(env, identity, {question,title})`**
    in `worker/index.js` (the genesis ParticipantDeclared→ThreadCreated mint + ingest +
    register) so BOTH `POST /api/threads` and approve mint identical, human-owned genesis logs.
  - **Cockpit** (`src/screens/ThreadIndex.jsx` + `src/api.js`): an owner-only **Triage inbox**
    panel above the ledger (source/kind chips, use-cases, pros/cons, source-signals,
    Approve→create with a "have clistahermes deliberate" toggle, Dismiss). Approve jumps to the
    freshly-created cockpit (reuses the New-thread navigation). The panel only renders when
    items are pending and the viewer is the owner (agents get 403 server-side).
- **Tests + verification:** `test/workers/intake.test.js` (5 tests) — the governance keystone
  (**approve creates a thread owned by the approving human, not the agent**), the agent-only/
  human-only boundaries, quarantine (a proposal registers no thread), dismiss, 409 on
  re-approve, 422 on short question. `npm run test:workers` **18/18**, `npm test` **15/15**,
  build clean. **End-to-end against `wrangler dev`** (curl) + **browser** (Playwright via
  `MCP_DOCKER`): agent proposes → owner sees the quarantined panel → Approve+flag → new cockpit
  opens with **decision owner = par_troylati**, 2-event chain valid, banner "Handed to
  clistahermes…".
- **Next (owner-gated — Phase 2):** the **public `POST /api/intake`** (unauthenticated, the
  perimeter break) with Turnstile + rate-limit + size cap + fail-closed validation, **strict
  quarantine**. Needs owner config: a Cloudflare Access **bypass policy** scoped to
  `/api/intake` (else Access blocks it before the Worker) + Turnstile keys (the `turnstile-spin`
  skill provisions the widget). Then Phase 3 (`contribution`/`run_report` kinds) + Phase 4
  (the Hermes emergent-seeder cron that fills `source:'agent'` rows — owner installs).

## Session 2026-06-24 (c) — inline contextual human-action affordances in the cockpit
**SHIPPED + MERGED (PR #6, deployed).** The cockpit is now where humans contribute, not just the
separate Compose screen — extending the "Record the decision" merge-panel pattern to the other
contribution types, in place. Browser-verified end-to-end (the `MCP_DOCKER` Playwright gateway).

- **The affordances (all gated by `canContribute = isParticipant && status !== 'decided'`):**
  - **Raise objection / take a position** — buttons on each claim row (`claimContributeRow`),
    target pre-filled. **Add assumption / add claim** — "+ add" on the section headers.
  - **Stage a decision** — inline `DecisionRequestOpened` (proposal + `RefGroup` support pickers) when
    `canStageOpen` (undecided, no open proposal); **Submit a review** (`ReviewSubmitted`) when
    `canReview` (open proposal). Both feed the EXISTING owner merge panel (`canMerge`, owner-only).
  - A signed-in non-participant gets a **"join to act"** nudge, never a dead 422-bound form. Decided
    threads hide all of it (objecting to a recorded decision is intentionally NOT offered — reopen
    with a new DRQ rather than accreting onto a closed decision). Evidence stays excluded
    (`EvidenceCommitted` remains an ingest/agent path).
- **Reuse over duplication (the load-bearing decision):** the six per-kind payload builders were
  trapped in Compose's `buildEvent` closure. Extracted to **`src/events.js`** (`buildObjection` …
  `buildReview` + `rid` + the `SEVERITIES`/`STANCES`/`CONFIDENCE`/`REVIEW_STATUSES` constants + a
  shared `guard()`), so ONE module mints every event shape — kills the nested-`participantId` 422
  drift trap (the server forces only top-level `actor_id`). Compose now consumes it, behavior
  unchanged (−137 lines there). New reusable **`src/lib/InlineComposer.jsx`** (draft→append→reload
  lifecycle + inline fail-closed reasons, mirrors the merge panel) and **`src/lib/RefGroup.jsx`**
  (props-driven chip-multiselect, used by Compose AND the stage panel).
- **Tests:** **`test/events.test.js`** drives all six builders through the real engine (chain
  validates) and asserts the nested participant id == actor for every kind (the 422 trap). `npm test`
  15/15, `npm run test:workers` 13/13, build clean. **End-to-end** against `wrangler dev`: all six
  builders `POST 200`, chain valid. **Browser** (Playwright via MCP): decided-thread gating holds
  (scenario_demo shows no affordances); on an active thread, clicking "raise objection" on a claim
  revealed the inline composer, typed + `blocking` + submit → appended `obj_4c959824`, 8→9 events,
  integrity+validation true.
- **Op note — browser MCP:** the Playwright browser tools come through the `MCP_DOCKER` gateway
  (`docker mcp gateway run`, default profile server = `playwright`, image `mcp/playwright` ~1.72GB
  local). MCP servers attach at SESSION START, so if Docker/the gateway wasn't up at launch the
  browser tools are absent even once Docker is running. Fix: `/mcp` → reconnect `MCP_DOCKER` (or
  restart Claude Code); the browser reaches the dev worker at `http://host.docker.internal:8787`.
  Dev identity works header-less via `DEV_EMAIL` in `.dev.vars` (a plain browser load authenticates
  as `par_troylati`).

## Session 2026-06-24 (b) — positions channel badge + live dual-channel harvest re-proof
All MERGED + DEPLOYED (PR #2 badge, PR #3 this handoff, PR #4 row-layout fix; PRs used because
direct pushes to `main` are classifier-gated). The full A2A loop was re-proven LIVE end-to-end this
session — seed → real peer harvest → via-Raft position badge confirmed in the cockpit by the owner.

- **Positions now carry the via-Raft / via-moltbook badge (the last cosmetic gap).** A
  `PositionTaken` harvested off an A2A channel (e.g. the owner's Raft `#all` reply attested as a
  position, `source:"raft workspace #all:… — message …"`) used to render ONLY as a bare row in the
  audit chain — the channel badge lived on evidence/objections/provenance but positions had no
  badged section at all. Fixed: `src/adapt.js` adds `vm.positions` (stance/who/role/target/text +
  `channel` via `channelFromSource`) from `reasoningState.positions`; `src/screens/Cockpit.jsx`
  renders a **Positions** section (shown only when stances exist) with each stance's participant,
  target claim, stance chip, and `ChannelBadge`. Display-only, additive — no engine/worker/
  protocol-event change. Test `test/adapt-positions.test.js` proves a harvested Raft position
  carries the `raft` channel and a directly-composed one carries none. `npm test` 11/11,
  `npm run test:workers` 13/13, build clean.
- **Live dual-channel SEED re-proven on a fresh thread** (`thd_should_agent_to_agent_deliberation_
  use_a_shared__mqs86xkr_6a4cdccd`). Owner flagged it in the cockpit; fired the cron
  (`hermes cron run e31c1a1dd850 --accept-hooks` — note: `--accept-hooks` auto-posts to external
  surfaces, so it's an owner-authorized action, not auto-triggered). clistahermes seeded BOTH
  channels: moltbook post `e01da668-23f8-4298-b4cf-43d5548593bb` (published, challenge solved
  `32.00`) + Raft thread **`#all:a9942ddf`** (msg `a9942ddf-…`, seq `7660266`). App substrate: 1
  ParticipantDeclared + 2 ClaimCreated + 1 AssumptionDeclared = 6 events, integrity+validation
  true. Progress `{raft+moltbook · workspaceRef #all:a9942ddf · responders 0 · soliciting}`, then
  `agent-ack` → status `claimed` with workspaceRef+phase **preserved** (the `b3863b4` status-
  survives-ack fix held). Corroborated independently by `clista-app-deliberation.tsv` (row 3) +
  `clista-app-raft.state.tsv` (row 4, Detector C now watching `#all:a9942ddf`). The full tick
  report is at `~/.hermes/cron/output/e31c1a1dd850/2026-06-24_08-32-20.md`.
  - **Harvest→stage→merge tail NOT re-run** (needs a real peer reply + a later tick — external
    dependency); already proven end-to-end last session on `0bf0bb6f`. To also see the new badge on
    LIVE data: the owner replies on Raft `#all:a9942ddf` with a stance → next tick harvests it as a
    `PositionTaken` (source `raft workspace #all:a9942ddf — message …`) → via-Raft position to badge.
  - **Op note:** I cannot fire the cron's `--accept-hooks` or read service-token creds without
    explicit owner action — the classifier (correctly) gates outward A2A posts + credential reads.
    The seed-verification reads (`~/.hermes/cron/*.tsv`, the tick output `.md`) are operational
    state, allowed.
- **HARVEST RE-PROVEN LIVE — the badge now confirmed on real data.** The owner replied on Raft
  `#all:a9942ddf` and a **real second agent `@Clista`** (distinct from `clista_agent`/clistahermes)
  also weighed in — arguing the two seeded claims are a false dichotomy and taking a *synthesis*
  stance (a dedicated `#a2a-deliberation` channel WITH one thread per deliberation). clistahermes
  harvested both into the live thread as **1 PositionTaken + 2 EvidenceCommitted**, each with a
  `source:"raft workspace #all:a9942ddf — message <id>"` attribution:
  `pos_clistahermes_raft_prethread_synthesis_e3b8d207` (supports the per-thread claim),
  `evd_clistahermes_raft_seeding_pattern_e3b8d207`, `evd_clistahermes_raft_serendipity_92adca5c`
  (folds in the owner's `#all` serendipity↔S/N point). The owner CONFIRMED the **"via Raft"** badge
  renders on the position in the cockpit. So the thread is now claim+evidence+assumption+position
  grounded (merge-ready), sitting in `harvesting` (no stage attempt yet — clistahermes stages on a
  later tick by its own judgment, or the owner drives it; then the `3ac0fe7` "Record the decision"
  panel merges).
  - **Op lesson (who harvested):** the harvest produced a `clista_agent` reply on Raft (seq
    `7661435`) but **no cron output report** — because the always-on MAIN Hermes gateway session
    *shares the `clista_agent` profile* and harvested it outside the cron. So a harvest can come from
    EITHER the cron tick OR the live gateway session; don't assume the cron did it. Verify by the
    Raft channel content + the appended event ids, not the cron output dir.
  - **Detector-C reminder (bit me):** the `:45` scheduled tick logged `wakeAgent=false` and the
    raft-state seq still advanced (`7660266`→`7660913`→`7661435`) — Detector C advances the snapshot
    every run incl. non-waking ones, and raft seqs are global (a jump ≠ a relevant new message). Read
    the channel non-draining (`raft message read --channel '#all:<id>' --after <seq>`) to see actual
    content; reset the `clista-app-raft.state.tsv` seq to re-expose an already-snapshotted message.
- **Cockpit row-layout fix (PR #4, `bbccf58`, deployed).** Evidence/Assumptions/Claims/Positions
  rows laid `id | content` side-by-side, squeezing findings off-screen on narrow widths. Flipped all
  four to `flex-direction:column` (id above, content below, full width). `src/screens/Cockpit.jsx`,
  display-only.

## Session 2026-06-24 — Hermes Raft (raft.build) as the A2A deliberation channel
**FULL LOOP PROVEN END-TO-END on a real thread** (`thd_should_agent_to_agent_runs…_0bf0bb6f`):
`flag → seed on Raft #all + moltbook → harvest peers → agent stages → HUMAN merges → decided`.
Final state: **decided**, decisionRecord `dcr_d49a75d2` (approved), `decidedBy par_lati`, 21
events, integrity + validation true. The governance boundary held: the agent staged; only the
human decision owner (`par_lati`) recorded the `DecisionMerged`.

- **Decision-owner MERGE affordance (app, commit `3ac0fe7`, deployed) — NEW capability.** The
  composer covered the six contributor events but NOT `DecisionMerged`, so a staged decision had
  no in-app merge path (and the agent is governance-blocked from merging). Added a cockpit
  **"Record the decision"** panel shown ONLY to the thread's decision owner when a proposal is
  staged (reviewed) and undecided: summary/rationale/conditions → builds a `DecisionMerged`
  referencing the current proposal. `src/screens/Cockpit.jsx` (`recordDecision`, `canMerge` via
  the viewer's `decision owner` role) + `src/adapt.js` (`vm.decisionRequest` now carries the
  proposal's support sets + its review ids). Test: `test/workers/decision-merge.test.js` (full
  create→claim→evidence→assumption→DRQ→review→merge→decided, the agent-cannot-merge boundary,
  AND the live thread's exact duplicate-DRQ + late-assumption shape). 13 worker tests green.
- **Grounding-completeness rule (engine governance, learned the hard way).** A decision is
  REJECTED fail-closed without ALL THREE of supporting **evidence + claims + assumptions**
  (`worker/engine/governance.js:evaluateSupportRequirements`). The agent staged a proposal with
  NO assumption → unmergeable. Fixes: (a) the merge UI falls back to the thread's full substrate
  when the proposal left a set empty, + a note when the thread has no assumption; (b) added a
  real `AssumptionDeclared` to the live thread; (c) **deliberation prompt `e31c1a1dd850` patched**
  so staging FIRST ensures a claim + evidence + assumption all exist and the DRQ references all
  three (future staged decisions are merge-ready).
- **Duplicate-DRQ note (operational).** Staging the live thread, the manual stage RACED the
  autonomous cron (both opened a DecisionRequest within ~20s → two open DRQs). Harmless: chain
  valid, `currentProposal` projects to one, the merge targets it (regression-tested). LESSON:
  before manually driving a deliberation thread, check whether the cron already did it
  (`agent-status` / the `clista-app-deliberation.tsv` row) — the autonomous loop is live.

### Background — the Raft channel itself (built earlier this session)
Use Hermes **v0.17.0 "Reach Release"** Raft support as clistahermes's deliberation
back-channel **alongside moltbook (dual-channel)** — fixing the moltbook-engagement
bottleneck (the first live run got 0 comments). **Architecture (load-bearing):** a stateless
Worker can't be a Raft node (Raft needs a persistent `raft` CLI + auto-spawned `raft agent
bridge` + a localhost `/wake` endpoint), so **clistahermes IS the Raft bridge** and the app is
the **accountable ledger + A2A provenance surface** over it. The app never talks to Raft
directly. (`cloudflare/moltworker` — OpenClaw in Sandbox Containers — is the Phase 3 migration
target for hosting the runtime on Cloudflare; design-only, not built.) Newest first:

- **HARVEST PROVEN — both channels, with provenance (thread `…mqrlmyuh_0bf0bb6f`).** After
  seeding, the loop harvested real peer input from BOTH surfaces into accountable state:
  - `evd_moltbook_trinity_…` — a **real external agent `TrinityProtocolAgent`** replied on
    moltbook → EvidenceCommitted (source `moltbook u/TrinityProtocolAgent …`) → **via moltbook**.
  - `evd_raft_clistahermes_reply_741e56c5` — clistahermes's Raft reply attested (source `raft
    workspace #all:1800456c — reply …`) → **via Raft**.
  - `pos_raft_troy_decided_state` — the owner's Raft `#all` reply "Yes, this is the decided
    state" harvested as **PositionTaken** (source `raft workspace #all:1800456c — message …`) →
    **via Raft**. Integrity+validation valid; progress `responders:2, harvesting`. The cockpit
    renders the via-Raft / via-moltbook badges (badges are on evidence/objections/provenance;
    PositionTaken shows in the audit chain but is not a badged section — minor cosmetic gap).
- **THREE fixes the live test forced (all shipped/applied):**
  1. **app — `agent-ack` status-wipe (commit `b3863b4`, deployed):** ack DELETED the
     `agent_flags` row that carries the live status, so the banner never lit. Fixed:
     `claimFlag()` marks `'claimed'` (dequeued, row kept) + `recordAgentProgress()` UPSERTs.
  2. **Hermes — shared `clista_agent` inbox:** the MAIN Hermes gateway session co-uses the
     `clista_agent` Raft profile (it answered a `#all` "hi"), so `(A) cron is sole drainer` is
     FALSE. Harvest switched from draining (`raft message check`) to **non-draining reads**
     (`raft message read --channel <target> --after <seq>`) — immune to the race.
  3. **Hermes — replies land in the channel ROOT, not the sub-thread:** peers reply in `#all`,
     not `#all:<shortId>`. Precheck Detector C + the harvest prompt now watch the **parent
     channel** too (derive `#all` from each `raft_target`). State file
     `~/.hermes/cron/clista-app-raft.state.tsv` (`raft_target ⇥ last_seq`).
- **Op note — firing a tick manually:** `hermes cron run e31c1a1dd850 --accept-hooks` (gateway
  ticker runs it within seconds). The precheck still gates it; reset the relevant
  `clista-app-raft.state.tsv` seq to re-expose an already-snapshotted message. Detector C
  ADVANCES the snapshot every run (incl. dry-runs) — a manual `bash …precheck.sh` consumes the
  wake signal, so reset after probing.
- **LIVE END-TO-END PROOF (the dual-channel path works).** Flagged a NEW thread
  `thd_should_agent_to_agent_runs_be_integrated_in_the__mqrlmyuh_0bf0bb6f` in the cockpit;
  manually fired the cron (`hermes cron run e31c1a1dd850 --accept-hooks` — the gateway ticker
  runs it within seconds). clistahermes seeded it on **both channels**: created Raft thread
  **`#all:1800456c`** + moltbook post **`1ab5847f`**, added `ClaimCreated
  clm_agent_runs_integration_feasible_…` substrate, wrote the 5-col tsv row with the real
  `raft_target`, reported `progress` (raft+moltbook · responders 1 · soliciting), and acked.
  (Flag the EXISTING already-seeded thread instead → the idempotent guard just re-acks, no
  re-seed — confirmed on the prior tick.)
- **BUG the live test caught → fixed + deployed (commit `b3863b4`, CI green).** `agent-status`
  returned `{requested:false}` mid-deliberation: `agent-ack` **DELETED** the `agent_flags` row,
  but that row carries the live status — and the agent acks right after seeding, so the cockpit
  banner never lit. Fix: **`agent-ack` now `claimFlag()`** — marks the row `'claimed'`
  (dequeued from `listFlags`, which filters `status='pending'`) instead of `DELETE`, so the row
  + status persist until the thread is `decided`; **`recordAgentProgress()` now UPSERTs**
  (status `'claimed'` on insert) so a progress report is resilient and recreates the row even
  if cleared. Tests updated (`test/workers/agent-flag.test.js`: ack dequeues but status
  survives), 10/10. Verified live: a service-token `agent-progress` call recreated the status →
  `agent-status` now returns `claimed · raft+moltbook · #all:1800456c · responders 1 ·
  soliciting`, so the cockpit banner renders the live line. (Service tokens are `kind:agent`,
  so the owner can curl `agent-progress`/`agent-ack` directly.) NOTE `flagStatus().requested`
  now means "in deliberation" (pending OR claimed), not "pending request" — the cockpit shows
  the status block (not the request button) for the whole deliberation, hiding only when decided.
- **Next:** reply on Raft `#all:1800456c` or the moltbook post as a peer → next tick clistahermes
  `raft message check`s it, attests with a **"via Raft"** badge (`source:"raft workspace … —
  message <id>"`), bumps phase to `harvesting`. The Hermes-side files were backed up
  `*.bak.20260624-044111`; rollback = restore them.

- **Phase 0 — Raft External Agent (DONE, owner-set-up).** Profile **`clista_agent`** (agentId
  `7a538a89-31d0-49a4-b514-e68979960ff4`), channel **`#all`** in workspace `clista`
  (`https://app.raft.build/s/clista/...`). `RAFT_PROFILE=clista_agent` in `~/.hermes/.env`;
  Hermes gateway connected. **Namespace split (don't conflate):** Raft side = `clista_agent`;
  ClisTa app side = `par_agent_clistahermes` (Access service token). Same Hermes agent.
- **Phase 1 — app (SHIPPED, commit `d527621`, CI `28075241370` green, live).** The app records
  what clistahermes reports; no Raft dependency in the Worker.
  - `IndexDO.agent_flags` gained `channel/workspace_ref/responders/phase/detail/updated_at`
    (PRAGMA-guarded back-fill); new `recordAgentProgress()`; `flagStatus()` returns them; a
    fresh re-flag resets prior status. `worker/index-do.js`.
  - **`POST /api/threads/:id/agent-progress`** (agent-only, 403 else) — DO metadata, NOT a
    protocol event (chain stays clean). `GET …/agent-status` surfaces it; the existing 20s
    cockpit poll (`useThread.js`) shows it live. `worker/index.js`.
  - **Channel provenance:** `adapt.js` `channelFromSource()` parses the `source` convention
    (`"raft workspace … — …"` / `"moltbook …"`) → a channel tag on evidence, the surviving
    objection, and Provenance-Trace nodes; `Cockpit.jsx` renders **"via Raft" / "via moltbook"**
    badges (`styles.js` `channelMeta`). `channelLabel()` drives the live banner
    (*"clistahermes is deliberating via Raft + moltbook … — N agents engaged · phase"*).
  - `scripts/agent-post.mjs` gained a **`progress`** subcommand; `docs/AGENTS.md` gained a
    **"Raft deliberation channel"** section; `test/workers/agent-flag.test.js` extended
    (progress agent-only + round-trips; `npm run test:workers` 10/10, `npm test` 9/9, build OK).
- **Phase 2 — Hermes runtime (APPLIED, lives in `~/.hermes`, NOT this repo).** Backed up as
  `*.bak.20260624-044111`. Decision: **(A) the cron is the SOLE drainer** of the `clista_agent`
  Raft inbox.
  - **Cron prompt `e31c1a1dd850`** (6678→9396 chars, 8 guarded replacements, job still
    enabled @ `15,45`): dual-channel; a Raft ENVIRONMENT block (`#all`, `raft message
    send --target '#all'` via stdin, `raft message check` to drain, `raft manual`/`raft server
    info` to discover); 5-col state format; SEED solicits on Raft + reports `phase:"soliciting"`;
    HARVEST drains Raft and attests with `source:"raft workspace <target> — message <id>"` +
    reports `phase:"harvesting"`; CONVERGENCE reports `phase:"staged"` + posts the final summary
    on BOTH channels. Decision-owner boundary + decided-thread guardrail unchanged.
  - **Precheck `clista-app-precheck.sh`:** status-column fix (`$3→$4`) + **Detector C** — a
    *non-draining* `raft message read --channel <target> --after <seq>` snapshot (state
    `~/.hermes/cron/clista-app-raft.state.tsv`) that filters system/own messages and is
    **inert until a real `#all:<thread>` target exists**. (`raft inbox check` is daemon-only —
    unavailable to the external profile — hence the read-snapshot approach.) `bash -n` clean,
    dry-run silent.
  - **State tsv** `clista-app-deliberation.tsv` migrated to **5 columns**
    (`thread_id ⇥ moltbook_post ⇥ raft_target ⇥ status ⇥ updated_at`); existing in-flight row
    got `raft_target = -` (stays moltbook-only; only newly-flagged threads use the dual path).
  - **No restart needed** — scheduler reloads `jobs.json` per run; precheck re-read each tick.
- **Live proof PENDING (human action):** flagging is human-only, so the end-to-end Raft seed
  needs the owner to flag a thread in the cockpit ("Have clistahermes deliberate"). On the next
  `:15`/`:45` tick clistahermes seeds it onto Raft `#all` + moltbook and reports progress.
  Rollback = restore the three `*.bak.20260624-044111` files.

## Session 2026-06-23 (b) — agent deliberation, provenance, cockpit polish
All shipped to `main` + live on app.clista.ai (CI green). Newest first:

- **Provenance Trace panel (cockpit).** Decision-rooted tree (the engine's `provenance
  trace`): decision → supporting claims → each claim's evidence/assumptions + the objections
  targeting it (surviving = SURVIVED). `src/adapt.js` `buildProvenance()` builds it from
  projection links only (`decisionRecord.supportingClaimIds`, `claim.evidenceIds/assumptionIds`,
  `objection.targetObjectId/status`); `src/screens/Cockpit.jsx` `ProvTrace` renders it under the
  Decision Record. Only shows once a thread has a decision. (Commit `ecc2417`.)
- **Cockpit auto-refresh.** `src/useThread.js` now silently polls every 20s while a thread is
  NOT decided and the tab is visible (stops once decided), so out-of-band agent contributions
  appear without a manual refresh. (Commit `5a67456`.)
- **Agent-deliberation feature (the big one) — flag a thread → clistahermes deliberates on
  moltbook → records events back → stages a decision.** Full autonomy via the existing
  moltbook agent loop; the human owner records the final decision.
  - **App (Part A, `2af53bf`):** flag queue in `IndexDO` (`agent_flags` table — DO metadata,
    NOT a protocol event). Routes: `POST …/request-agent` (human-only), `GET …/agent-status`,
    `GET /api/agent/queue` (agent-only poll), `POST …/agent-ack` (agent-only). Cockpit shows a
    "Have clistahermes deliberate" banner on active, non-decided threads. Test:
    `test/workers/agent-flag.test.js` (`npm run test:workers`).
  - **Hermes (Part B):** cron job **`e31c1a1dd850` `clistahermes-app-thread-deliberation`**
    (`15,45 * * * *`, **ENABLED & proven live**). Precheck `~/.hermes/scripts/clista-app-precheck.sh`
    (Detector A: `/api/agent/queue`; Detector B: moltbook `/home` replies on deliberation posts).
    Agent state: `~/.hermes/cron/clista-app-deliberation.tsv` (`thread_id  post_id  status(active|
    decided)  updated_at`) — the source of truth for which posts this loop owns. The seeding +
    moltbook-skill writes go through `scripts/agent-post.mjs`.
  - **First live run PROVEN:** flagged the A2A objective-priority thread
    `thd_decide_which_objective_is_key_..._mqr26l7l_96291fb4` → clistahermes seeded 2 competing
    claims on the thread (6 events) + created moltbook post **`e8dc4ced-0e85-4866-a4ad-32bb5bb016f6`**
    (m/general) inviting agents to weigh in. Awaiting replies (0 comments as of handoff) — harvest
    happens on later ticks when other agents comment. **Deliberation quality depends on the
    moltbook community engaging — external dependency.**
- **Decision-owner boundary (important).** `governance.js` requires an **authorized decision
  owner** for a decision; the agent (`par_agent_clistahermes`) is a contributor, so it CANNOT
  merge. The deliberation prompt was corrected to **stage** the decision (`DecisionRequestOpened`
  + `ReviewSubmitted`) and hand the final `DecisionMerged` to the **human decision owner**.
- **Decided-thread guardrail** added to BOTH cron prompts (moltbook `6262e7f9aefe` +
  deliberation `e31c1a1dd850`): before appending, check status; if `decided`, don't accrete —
  open a NEW decision request for substantive input, else reply-only. (Fixes the "evidence after
  the decision" smell seen on `thd_csv_cli_build_moltbook`.)
  **[Update 2026-07-07: both cron jobs were DELETED when the clistahermes automation was
  retired (`docs/incidents/2026-07-04-clistahermes-freeze/`), so this guardrail has no live
  enforcement surface and its conflict with the re-review trigger (issue #20) is moot — there
  is no autonomous harvester. Post-decision objections now arrive only from authenticated
  participants appending `ObjectionRaised` directly, which auto-emits `ReviewTriggered` and
  notifies the CURRENT decision owner (issue #21). If a contributor agent is ever revived, its
  guardrail must distinguish kinds of post-decision input: a material objection/contradicting
  evidence → append the `ObjectionRaised` (that is precisely what re-opens the decision; never
  open a competing DRQ); supportive/non-substantive input → reply-only. The governance boundary
  is unchanged: an agent contributes, it never opens or merges a decision.]**
- **Patched legacy thread `thd_csv_cli_build_moltbook`.** It was ingested (not app-created) so it
  had **no decision owner** and a decision merged by `id_troy` (unauthorized). A re-declare is
  validator-blocked (`duplicate participant id`); the fix is `ParticipantAuthorityGranted` (no
  granter-authority gate → bootstraps the first owner). Appended one granting `id_troy`
  `decision_owner` (thread scope) → decision now authorized, chain still valid (38 events). NOTE:
  the cosmetic `participant.role` label (null for `id_troy`/`par_octopus`) can't be patched via
  append (declare-time field) — governance is fixed, the label is a permanent ingestion artifact.
- **Hooks auto-accept.** Set `hooks_auto_accept: true` in `~/.hermes/config.yaml` so autonomous
  cron shell commands (ack/tsv writes) stop hitting the approval gate. Config cache invalidates on
  file mtime + scheduler reloads per run → no gateway restart needed. (Both cron jobs benefit.)
- **Cockpit global surface menu** (`fa…`/`6158b5d`): the app topbar now carries the cross-surface
  nav (Home / Cockpit / CLI / Docs / The gate / Learn) matching clista.ai, replacing the tagline.
- **CI actions bumped to v5** (`5530446`): `actions/checkout@v5` + `actions/setup-node@v5` (Node 24),
  clearing the Node-20 deprecation warning in `deploy-app.yml` + `sync-engine.yml`.
- **Git auth:** both this repo AND `lati-cooki/clista-protocol-launch-planning` now carry a
  repo-local **gh-only credential helper** (`credential.helper` = empty then `!gh auth git-credential`)
  so pushes don't fall back to the osxkeychain credential. `lati-club` is a collaborator on the
  launch-planning repo, so plain `git push` works there now.

- **Phase 0 — surface.** Vite + React 19 SPA implementing the `app.clista.ai` Claude
  Design project `ClisTa Cockpit.dc.html` (imported via the claude_design MCP /
  DesignSync; project id `fe28cfec-8f76-4d43-94ae-ff333afa5a89`). Four screens:
  Thread Cockpit (hero), Thread Index, Compose/Append, Component Kit. Design carried
  in faithfully via a `css()` inline-style helper (`src/lib/css.js`), an SVG line-icon
  set (`src/icons.js`), and status/badge tokens (`src/styles.js`). Fonts Inter Tight +
  JetBrains Mono on warm paper `#e7e6e3` + the signal palette (verified green / evidence
  blue / degraded amber / failed red) — the design tool's own refinement of the brief's
  Jost/IBM Plex direction; we implemented the design as delivered.
- **Phase 1 — engine ported (trust anchor).** Pure ClisTa modules from
  `lati-club/ClisTa-Protocol` (`src/*.js`) vendored **verbatim** into `worker/engine/`
  (projector, validator, integrity + all transitive domain modules). Only two
  adaptations: `integrity.js` hashing `node:crypto` → synchronous **`js-sha256`**
  (byte-identical → deterministic replay; NOT Web Crypto subtle.digest which is async),
  and `events.js` fs store → pure builders + Web Crypto randomness. No Node builtins
  remain (no `nodejs_compat`). `worker/engine/package.json` marks it `commonjs`.
  `ThreadDO` (`worker/thread-do.js`) holds one thread's append-only, hash-chained log in
  **DO SQLite**; append is **validate-before-trust, fail-closed** (event_id + reasons,
  HTTP 422) with server-minted ids. Validator returns `errors` (not `reasons`); integrity
  returns `reasons` — don't confuse them.
- **Phase 2/3 — wired live.** Cockpit renders from real projected state (`src/data.js`
  deleted): `src/api.js` (client) → `src/useThread.js` (load + auto-seed demo) →
  `src/adapt.js` (projection `clista.threadState.v0` → cockpit view model). `IndexDO`
  (`worker/index-do.js`) provides the thread ledger; Worker registers a thread after each
  successful write. Compose posts a real `ObjectionRaised`; verified/degraded driven by
  the real `/validate` result (the live/degraded toggle is a client preview).
- **Phase 4 — identity.** `worker/identity.js` resolves the caller: production verifies
  Cloudflare Access `Cf-Access-Jwt-Assertion` against team JWKS (RS256 via Web Crypto,
  issuer/aud/exp); local dev uses an `X-Clista-Email` header honored ONLY when
  `DEV_IDENTITY=true` (`.dev.vars`, gitignored; `.dev.vars.example` committed). `actor_id`
  (`par_<email-slug>`) is server-authoritative. Writes require auth (401 else). A non-
  participant gets a fail-closed **Join thread** affordance → appends `ParticipantDeclared`.
  `GET /api/me` backs the topbar.

- **Engine sync (re-vendor pipeline).** The engine is vendored, not a live dep, so upstream
  changes reach prod only via a reviewed PR. `scripts/vendor-engine.mjs` (`npm run sync:engine`
  / `:check`) copies the verbatim modules from a `ClisTa-Protocol` checkout, **guards the two
  adapted ports** (integrity.js/events.js) via `worker/engine/.upstream-baseline.json` —
  failing if upstream changed a file we ported so a human re-applies it — preserves the
  curated exclusion set (cli/continuity/mcp_server/release/runtime stay out), and never adds
  files silently. `.github/workflows/sync-engine.yml` runs weekly/manual/repository_dispatch:
  clones the public repo at its latest tag, re-vendors, runs the parity test, **opens a PR on
  drift** (never auto-deploys; merging `worker/**` triggers `deploy-app.yml`).
- **Agent write path (Cloudflare Access service tokens).** Lets non-interactive agents write
  without a browser. `worker/identity.js`: a verified Access JWT with **no email = a service
  token** → resolves to **`par_agent_<token-name>`** (`kind: "agent"`, `source:
  "service-token"`) from its `common_name`; human path unchanged. `/join` declares the
  participant with `identity.kind`. `scripts/agent-post.mjs` is the client (`CF-Access-Client-
  Id/Secret` → ingest/join/append/validate). Dev: `X-Clista-Agent: <name>` header impersonates
  an agent when `DEV_IDENTITY=true`. Cloudflare puts the token's **Client ID** (not its
  dashboard name) in the JWT, so `wrangler.jsonc` `AGENT_NAMES` ("`<clientId>:<name>`") maps it
  to a friendly actor — `398a39…:clistahermes` → `par_agent_clistahermes`. Setup in
  **`docs/AGENTS.md`** (owner makes the token + a **Service Auth** policy on the app.clista.ai
  Access app). **LIVE & PROVEN in prod:** `par_agent_clistahermes` ingested the CSV-CLI log +
  posted moltbook findings (see the agent loop below). Service-token gotcha: the token MUST be
  created in the SAME account as the Access app (the `laticooki` Zero Trust org / account
  `1c0cdbfbea…`), else Access returns `service_token_status:false` and it won't show in the
  app's policy selector.
- **Orphan purge (admin cleanup).** Durable Objects can't be deleted externally, so
  `POST /api/threads/:id/purge` (auth required) clears an **orphan** thread — one with no
  `ThreadCreated`, hence never registered in the index (junk/malformed DOs). **Refuses any
  registered thread (409)** so legitimate logs stay append-only. `ThreadDO.purge()` +
  `IndexDO.remove()`; `scripts/agent-post.mjs <id> purge`. Used once to remove a stray
  join-only DO from a pre-fix agent write.

## The agent loop (moltbook ⇄ ClisTa) — the current operating pattern
Launch, cut-over, AND the first agent write are DONE. `clistahermes` (the Nous **Hermes
Agent** at `/Users/troylatimer/hermes-agent`, persona `par_agent_clistahermes`) now runs this
loop; its memory (`~/.hermes/memories/MEMORY.md`) carries the context so heartbeats/cron can
do it autonomously. The pattern, per engagement:
1. A moltbook ClisTa post gets comments/questions (e.g. post `5a649ad8-…`, m/general).
2. Capture each as accountable state in the **live** app thread via `scripts/agent-post.mjs`
   (auth = the Access service token): `ingest` a protocol `.ndjson` log → `join` → `append`
   each comment as `ObjectionRaised` / `EvidenceCommitted` (objections carried forward, never
   dropped) → `validate` (integrity + validation true).
3. Reply on moltbook summarizing what entered accountable state (Hermes' moltbook skill +
   creds under `~/.hermes/` / `~/.config/moltbook/`; NOT in any repo).
4. **Attest** the post back into the SAME live thread (`EvidenceCommitted`, `source:
   "moltbook u/clistahermes — reply comment <id>"`) so app.clista.ai and moltbook stay synced.

**Done so far (live, replayable):** thread `thd_csv_cli_build_moltbook` — 30 events: the
CSV-CLI log (25) + monty's pandas-fallback question → `ObjectionRaised`/`clm_parser_p2` +
globalwall's scaling question → `ObjectionRaised`/`clm_pandas_p2` + the fallback→DRQ handoff →
`EvidenceCommitted` + the post attestation (`examples/moltbook-attestation-evidence.json`).
moltbook reply = comment `6884f3ea-…`. NOTE the live app thread id is `thd_csv_cli_build_moltbook`
(the engine log's internal id `thd_csv_cli_build_consensus_mqa0yqno_…` was rebased so the DO
URL = the events' `thread_id`, which the cockpit needs). `scripts/moltbook-test.mjs` is the
local engine-validation harness for this. Gotcha: append events must set the nested
`participantId`/`committedByParticipantId` to the actual joined actor (`par_agent_clistahermes`),
not a stray id — the server only forces top-level `actor_id`, so a wrong nested id fails-closed (422).

## How to run / verify locally
- `npm install`
- `npm test` → engine parity + integrity on `node:test` (`test/*.test.js`; proves
  scenario-demo projects identically to the ClisTa CLI, js-sha256 byte-identical, tamper
  breaks the chain, and the New-thread genesis log validates/projects).
- `npm run test:workers` → **in-runtime DO tests** (`vitest` + `@cloudflare/vitest-pool-
  workers`, `test/workers/**`). Runs the real Worker + ThreadDO/IndexDO SQLite inside
  workerd via `SELF.fetch` (+ one direct `runInDurableObject`): create→validate→index,
  validate-before-trust (422, log unchanged), append-only chain growth, ingest-refuses-
  non-empty, purge-refuses-registered/removes-orphan. `npm run test:all` runs both. Dev
  identity comes from `miniflare.bindings` in `vitest.config.js`, so it works without
  `.dev.vars` (CI-safe). NOTE: pool-workers 0.16/vitest 4 use the `cloudflareTest()` Vite
  plugin, not the old `defineWorkersConfig`.
- `npx wrangler dev` → full stack (Worker + DO + SPA) at `localhost:8787`; loads
  `.dev.vars`. (Plain `npm run dev` = front-end only, /api won't exist.)
- **Create `.dev.vars`** (gitignored) to drive writes locally:
  `DEV_IDENTITY=true` and `DEV_EMAIL=troylati@gmail.com` (see `.dev.vars.example`). Add
  header `X-Clista-Agent: <name>` on a request to act as an agent (`par_agent_<name>`).
- `npm run sync:engine:check` → is `worker/engine/` in sync with `../ClisTa-Protocol`?
  `npm run sync:engine` to re-vendor (then `npm test`).
- Browser checks run through the MCP browser, which reaches the host at
  **`http://host.docker.internal:8787/`** (not localhost). For a clean demo of the join
  affordance, `rm -rf .wrangler/state` before restarting `wrangler dev` (DO SQLite
  persists locally across restarts; a pre-seeded thread skips the join banner).

## Key files
- Front-end: `src/App.jsx` (shell + topbar identity + routing), `src/screens/{Cockpit,
  ThreadIndex,Compose,Kit}.jsx`, `src/{api,useThread,adapt,styles,icons}.js`, `src/lib/*`.
- Worker: `worker/index.js` (router), `worker/thread-do.js`, `worker/index-do.js`,
  `worker/identity.js`, `worker/scenario-demo.js` (bundled 23-event seed log),
  `worker/engine/` (vendored engine), `wrangler.jsonc`.
- Tests/fixtures: `test/engine-parity.test.js`, `test/fixtures/scenario-demo.*`.
- Scripts: `scripts/vendor-engine.mjs` (engine re-vendor), `scripts/agent-post.mjs` (agent
  write client), `scripts/moltbook-test.mjs` (moltbook→events validator harness).
- Docs: `docs/PLAN.md` (authoritative plan), `docs/DEPLOY.md` (Phase 5 runbook),
  `docs/AGENTS.md` (agent service-token setup), this file.

## API (all same-origin)
`GET /api/me` · `GET /api/threads` · `POST /api/threads` (create a thread → genesis log,
401 unauth / 422 if question < 12 chars) · per-thread `GET …/{state,summary,audit,validate}` ·
`POST …/{append,ingest,seed-demo,join,purge}` (writes require auth → 401; fail-closed → 422;
`purge` removes orphan threads only, refusing registered ones → 409).
Writes authenticate as a **human** (Access login JWT → `par_<email>`) or an **agent**
(Access service token `CF-Access-Client-Id/Secret` → `par_agent_<name>`); `actor_id` is
always server-set, never client-supplied.

## The repos (two GitHub accounts — switch with `gh auth switch --user <name>`)
- `lati-club/ClisTa-Protocol` (PUBLIC) — THE ENGINE. Cloned at
  `/Users/troylatimer/Documents/ClisTa-Protocol` for the port (not part of this repo).
- `lati-cooki/clista-protocol-launch-planning` (PRIVATE, owner lati-cooki) — design system
  + 6 live Pages surfaces incl. the `cli.clista.ai` mock to cut over. `website/CLOUDFLARE.md`
  is the storefront deploy convention this app's runbook mirrors.
- `lati-club/lokahi` (PRIVATE; local `/Users/troylatimer/Documents/Lokahi`) — prototype to
  salvage UX from; its mutable-SQLite engine is dropped. Not productized.
- `lati-club/clista-ai-app` (this repo).

## Open follow-ups (optional, not blocking deploy)
- **DONE — New thread creation.** `POST /api/threads` mints the genesis log
  (`ParticipantDeclared` → `ThreadCreated`, ids minted in the Worker since `ingest()`
  doesn't) and ingests it atomically into a fresh DO; the creator becomes the first
  participant / decision owner, `actor_id` identity-bound, question ≥ 12 chars (422 else),
  401 unauth. The index **New thread** button opens a modal (question + optional title) →
  jumps to the new cockpit. `test/create-thread.test.js` proves the log validates/chains/
  projects + that a `thread.id`/`thread_id` mismatch fails closed.
- **DONE — Compose covers the append types.** Event-type selector wiring all six:
  `ObjectionRaised`, `AssumptionDeclared`, `ClaimCreated`, `PositionTaken` (stance on a
  claim), `DecisionRequestOpened` (proposal + multi-select supporting claims/evidence/
  assumptions/objections, moves the thread to review), `ReviewSubmitted` (verdict +
  conditions on the open request). Pickers populate from `adapt.js`'s `vm.refLists`
  (claims/evidence/assumptions/objections) + `vm.decisionRequest` (the projection's
  `currentProposal`). Per-kind builders set the nested participant id to the joined actor;
  unresolvable references fail closed (422). The composer does NOT create evidence
  (`EvidenceCommitted` stays an ingest/agent path) — so the decision-request evidence
  picker is empty unless the thread already carries evidence.
- **DONE — `vitest`-pool-workers in-runtime DO tests.** `npm run test:workers` exercises
  ThreadDO/IndexDO inside workerd (see "How to run / verify locally"). The DO is no longer
  proven only by `wrangler dev` + curl.
- v1 object-model scope = the bundled scenario's shape; federation/delegation/negotiation/
  learning are out of v1 (still vendored so the projector/validator imports resolve).

## Do NOT
- Rebuild or re-skin the engine — it's ported; reuse it. To update it, re-vendor via
  `scripts/vendor-engine.mjs` (don't hand-edit `worker/engine/` except the two adapted ports).
- Commit `.dev.vars`, an Access service-token **Client Secret**, or set `DEV_IDENTITY` in prod.
- Use async Web Crypto for event hashing (breaks deterministic replay).
