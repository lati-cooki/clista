# Transfer / Handoff — app.clista.ai (the ClisTa Protocol cockpit)

Paste this into a fresh session to resume without replaying the history.

## One-liner
The live, interactive human cockpit OVER the real ClisTa engine: event log = source
of truth, UI projects state and emits validated ClisTa events, wearing the clista.ai
design system. "Here's a yes — now trace its shape." Replaces the mock at cli.clista.ai.

## Where we are (as of this handoff)
Phases 0–4 are **built, tested, and committed**; Phase 5 is **prepped, not executed**.
Everything lives on branch **`phase-0-cockpit-scaffold`** → **open PR #1**
(https://github.com/lati-club/clista-ai-app/pull/1). Nothing is deployed; no Cloudflare
account changes have been made. Local repo: `/Users/troylatimer/Documents/clista-ai-app`
(git user Troy Latimer; remote `lati-club/clista-ai-app`, private).

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

## Immediate next step — execute Phase 5 (the runbook), then cut over
Authoritative runbook: **`docs/DEPLOY.md`**. The owner will do this. Sequence:
1. **[you/owner]** Create a Cloudflare **Access** self-hosted app for `app.clista.ai`;
   copy the **AUD tag** and team domain.
2. Set `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` in `wrangler.jsonc` `vars` (or `--var` at
   deploy). NEVER set `DEV_IDENTITY` in prod.
3. `npm ci && npm run build && npx wrangler deploy` (config already has the
   `app.clista.ai` custom-domain route; `--dry-run` passes). Or push to `main` with repo
   secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` → `.github/workflows/deploy-app.yml`.
4. Verify per `docs/DEPLOY.md §4` (sign-in, auto-seed, `/validate`, 401-when-anon, join).
5. **Cut over** (separate repo `lati-cooki/clista-protocol-launch-planning`): point
   `website/cli.clista.ai`'s mock at `https://app.clista.ai`, link from `clista.ai` hero,
   redeploy that surface per its own `website/CLOUDFLARE.md`.
Safety: until the Access app + vars exist, prod writes 401 (read-only) — safe by default.

## How to run / verify locally
- `npm install`
- `npm test` → engine parity + integrity (6/6; proves scenario-demo projects identically
  to the ClisTa CLI / `test/fixtures/scenario-demo.expected-state.json`, and js-sha256 is
  byte-identical, tamper breaks the chain).
- `npx wrangler dev` → full stack (Worker + DO + SPA) at `localhost:8787`; loads
  `.dev.vars`. (Plain `npm run dev` = front-end only, /api won't exist.)
- **Create `.dev.vars`** (gitignored) to drive writes locally:
  `DEV_IDENTITY=true` and `DEV_EMAIL=troylati@gmail.com` (see `.dev.vars.example`).
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
- Docs: `docs/PLAN.md` (authoritative plan), `docs/DEPLOY.md` (Phase 5 runbook), this file.

## API (all same-origin)
`GET /api/me` · `GET /api/threads` · per-thread `GET …/{state,summary,audit,validate}` ·
`POST …/{append,ingest,seed-demo,join}` (writes require auth → 401; fail-closed → 422).

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
- More Compose event types (AssumptionDeclared, ClaimCreated, ReviewSubmitted,
  DecisionRequested/Recorded) — currently only ObjectionRaised is wired.
- Wire the index's **New thread** button (ThreadCreated + first ParticipantDeclared).
- A `vitest`-pool-workers integration test exercising the DO in-runtime (today's DO proof
  is via `wrangler dev` + curl/browser; engine proof is the Node parity test).
- v1 object-model scope = the bundled scenario's shape; federation/delegation/negotiation/
  learning are out of v1 (still vendored so the projector/validator imports resolve).

## Do NOT
- Rebuild or re-skin the engine — it's ported; reuse it.
- Commit `.dev.vars` or set `DEV_IDENTITY` in production.
- Use async Web Crypto for event hashing (breaks deterministic replay).
