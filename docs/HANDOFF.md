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
  `DEV_IDENTITY` is unset in prod (correct). Redeploy: `npm run build && npx wrangler deploy`.
  Edge verification passed (`/`→302 Access login, JWKS 200, advertised AUD matches deployed).
- **Post-launch — DONE:** (a) authenticated browser smoke **passed** (verified server-side
  via `wrangler tail`: `/api/me` 200 with Access JWT, auto-seed, `POST /join` 200, every
  request ok — proved the AUD fix). (b) Phase 6 **cut-over shipped**: `cli.clista.ai` now
  shows a "guided preview → Open the live cockpit" banner → `app.clista.ai`, and `clista.ai`'s
  hero primary CTA is "Open the live cockpit"; both Pages projects (`clista-cli`, `clista-ai`)
  redeployed and live (commit `f7f42fb` + merge `41730d9` in the launch-planning repo).
- **Two capabilities added after launch (both merged to `main`, agent path deployed):**
  see the "Engine sync" and "Agent write path" sections below.

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
- `npm test` → engine parity + integrity (6/6; proves scenario-demo projects identically
  to the ClisTa CLI / `test/fixtures/scenario-demo.expected-state.json`, and js-sha256 is
  byte-identical, tamper breaks the chain).
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
- **DONE — more Compose event types.** Compose has an event-type selector wiring
  `ObjectionRaised` (existing) + `AssumptionDeclared` + `ClaimCreated`; per-kind builders
  set the nested participant id to the joined actor. Still unwired (need reference pickers):
  `ReviewSubmitted` (→ a decisionRequest), `DecisionRequestOpened`, `PositionTaken` (→ a
  claim/decision target like objections already use `composeTargets`).
- A `vitest`-pool-workers integration test exercising the DO in-runtime (today's DO proof
  is via `wrangler dev` + curl/browser; engine proof is the Node parity test).
- v1 object-model scope = the bundled scenario's shape; federation/delegation/negotiation/
  learning are out of v1 (still vendored so the projector/validator imports resolve).

## Do NOT
- Rebuild or re-skin the engine — it's ported; reuse it. To update it, re-vendor via
  `scripts/vendor-engine.mjs` (don't hand-edit `worker/engine/` except the two adapted ports).
- Commit `.dev.vars`, an Access service-token **Client Secret**, or set `DEV_IDENTITY` in prod.
- Use async Web Crypto for event hashing (breaks deterministic replay).
