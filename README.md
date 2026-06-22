# clista-ai-app

The live **ClisTa Protocol** cockpit — the human-facing surface for the
accountability engine at
[`lati-club/ClisTa-Protocol`](https://github.com/lati-club/ClisTa-Protocol),
deployed to **app.clista.ai**.

> Here's a yes — now trace its shape.

## Status: Phase 4 — participant identity

Phases 0–4 are in place: the design renders from **real projected event-log state**,
the UI emits real validated ClisTa events, and every event's `actor_id` is a real,
server-resolved participant identity.

**Identity (Phase 4)** — `worker/identity.js` resolves the caller:
- **Production:** Cloudflare Access. The edge injects a signed `Cf-Access-Jwt-Assertion`
  that the Worker verifies against the team JWKS (RS256, issuer + audience checks).
  Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.jsonc`.
- **Local dev:** an `X-Clista-Email` header, honored only when `DEV_IDENTITY=true`
  (`.dev.vars`, gitignored — see `.dev.vars.example`). Off by default in production.

The resolved `actor_id` (`par_<email-slug>`) is **server-authoritative** — clients
never set their own. Writes require authentication (401 otherwise). A signed-in user
who isn't yet a participant of a thread sees a fail-closed **Join thread** affordance
that appends a `ParticipantDeclared` event; only then do their contributions validate.
`GET /api/me` backs the topbar identity.

**Front-end** — Vite + React 19 renders the cockpit design (imported from the
`app.clista.ai` Claude Design project, `ClisTa Cockpit.dc.html`), now **sourced from
the Durable Object**, not fixtures:
- **Thread Cockpit** projects a thread's state from `/state` + `/audit` + `/validate`
  (question, participants, decision record, surviving objection, evidence with real
  confidence/hashes, assumptions, claims, reviews, minority report, residual risks
  derived from preserved objections, and the audit terminal showing the real chained
  events + head hash). Verified/degraded is driven by the real validation result.
- **Thread Index** lists threads from the `IndexDO` ledger.
- **Compose / Append** posts a real `ObjectionRaised` event to `/append` — validated
  before trust, hash-chained, and reflected back (server-minted `event_id`, or a
  fail-closed rejection with the reason).
- **Component Kit** documents the primitives.

The projection→view-model mapping lives in `src/adapt.js`; data loading in
`src/useThread.js`; the API client in `src/api.js`.

**Back-end** — the real ClisTa engine, ported. The pure modules from
[`lati-club/ClisTa-Protocol`](https://github.com/lati-club/ClisTa-Protocol) are
vendored verbatim into `worker/engine/`; only the hashing (`node:crypto` →
synchronous `js-sha256`, byte-identical) and the storage shell (`.clista/events.ndjson`
→ **Durable Object SQLite**) were adapted. **One Durable Object per thread** holds
that thread's append-only, hash-chained event log; projection + validation run in the
DO. Appends are **validate-before-trust, fail-closed** (rejections return `event_id` +
reasons, HTTP 422).

**Trust anchor (proven):** the bundled `scenario-demo` log projects identically to the
ClisTa CLI / `expected-state.json` — same decision, object IDs, preserved objection,
minority report, and 23-event audit — both in the Node parity test and live in `workerd`.
Tampering a stored event breaks the chain. The full plan: [`docs/PLAN.md`](docs/PLAN.md).

Next: Phase 5 — deploy `app.clista.ai` (Worker + custom domain + Cloudflare Access
app), then cut `cli.clista.ai`'s mock over to it. **Runbook ready:**
[`docs/DEPLOY.md`](docs/DEPLOY.md) — config (`wrangler.jsonc` route) and CI
(`.github/workflows/deploy-app.yml`) are in place; the remaining steps need
Cloudflare account access (Access app + deploy).

## Run it

```sh
npm install
npm run dev                  # front-end only → http://localhost:5173
npm run build                # SPA build → dist/
npm test                     # engine parity + integrity tests (Node)
npx wrangler dev             # full stack (Worker + DO + SPA) → http://localhost:8787
```

Ingest the canonical sample log into a thread and read it back:

```sh
# (with `wrangler dev` running)
curl -X POST localhost:8787/api/threads/thd_scenario_demo/ingest \
  -H 'content-type: application/json' \
  -d "{\"events\":[$(paste -sd, test/fixtures/scenario-demo.ndjson)]}"
curl localhost:8787/api/threads/thd_scenario_demo/state
curl localhost:8787/api/threads/thd_scenario_demo/validate
```

## Layout

- `src/App.jsx` — app shell (topbar, sidebar nav, screen routing)
- `src/screens/` — `Cockpit`, `ThreadIndex`, `Compose`, `Kit`
- `src/api.js` / `src/useThread.js` / `src/adapt.js` — API client, thread loader, projection→view-model
- `src/styles.js` / `src/icons.js` / `src/lib/` — design tokens, icons, `css()`/`<Svg>`/`<Hoverable>`
- `worker/index.js` — Worker router (`/api/threads`, `/api/threads/:id/{state,summary,audit,validate,append,ingest,seed-demo}`)
- `worker/thread-do.js` — `ThreadDO`: SQLite event store, validate-before-trust append, projection
- `worker/index-do.js` — `IndexDO`: thread_id → card ledger for the index
- `worker/identity.js` — Cloudflare Access JWT verification + gated dev fallback → `actor_id`
- `worker/engine/` — vendored ClisTa engine (pure modules; `integrity.js` + `events.js` adapted)
- `test/engine-parity.test.js` — scenario-demo parity + integrity proof
- `wrangler.jsonc` — DO binding, SQLite migration, static-asset (SPA) serving

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/me` | — | Resolved caller identity (Access or dev) |
| `POST` | `/api/threads/:id/join` | ✓ | Declare the caller as a participant |
| `GET` | `/api/threads` | — | List threads from the index ledger |
| `POST` | `/api/threads/:id/seed-demo` | ✓ | Seed an empty thread with the bundled scenario log |
| `POST` | `/api/threads/:id/ingest` | ✓ | Seed an empty thread with a chained event batch |
| `POST` | `/api/threads/:id/append` | ✓ | Append one event (validate-before-trust; 422 fail-closed) |
| `GET` | `/api/threads/:id/state` | — | Projected thread state (`clista.threadState.v0`) |
| `GET` | `/api/threads/:id/summary` | — | Decision answer-view (`clista.decisionSummary.v0`) |
| `GET` | `/api/threads/:id/audit` | — | Append-only audit view (`clista.audit.v0`) |
| `GET` | `/api/threads/:id/validate` | — | Re-validate stored chain (integrity + validation) |

## What this becomes

A Cloudflare-native web app (Vite + React front-end; Worker + Durable Objects
back-end) where real people drive ClisTa: create a decision thread, commit
evidence, raise objections that survive a yes, request/review/record a decision,
and file a minority report — every action a validated, hash-chained ClisTa event.
One Durable Object per Thread holds that thread's append-only event log as the
source of truth.

See [`docs/PLAN.md`](docs/PLAN.md) for architecture, phases, and verification.
