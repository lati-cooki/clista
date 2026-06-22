# clista-ai-app

The live **ClisTa Protocol** cockpit — the human-facing surface for the
accountability engine at
[`lati-club/ClisTa-Protocol`](https://github.com/lati-club/ClisTa-Protocol),
deployed to **app.clista.ai**.

> Here's a yes — now trace its shape.

## Status: Phase 1 — engine ported, trust anchor proven

Phase 0 (the surface) and Phase 1 (the real engine) are both in place.

**Front-end** — Vite + React 19 renders the full cockpit design (imported from the
`app.clista.ai` Claude Design project, `ClisTa Cockpit.dc.html`). Four screens are
live: **Thread Cockpit** (decided + degraded, surviving-objection panel, provenance
traces, collapsible audit terminal), **Thread Index** (filterable ledger),
**Compose / Append** (fail-closed objection form), and the **Component Kit**.

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

Next: Phase 2/3 — wire the cockpit screens to the DO's projected state and real
appended events (replacing `src/data.js`), then Phase 4 identity.

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
- `src/data.js` — sample "support-assistant beta" thread (Phase 2/3 replaces with DO state)
- `src/styles.js` / `src/icons.js` / `src/lib/` — design tokens, icons, `css()`/`<Svg>`/`<Hoverable>`
- `worker/index.js` — Worker router (`/api/threads/:id/{state,summary,audit,validate,append,ingest}`)
- `worker/thread-do.js` — `ThreadDO`: SQLite event store, validate-before-trust append, projection
- `worker/engine/` — vendored ClisTa engine (pure modules; `integrity.js` + `events.js` adapted)
- `test/engine-parity.test.js` — scenario-demo parity + integrity proof
- `wrangler.jsonc` — DO binding, SQLite migration, static-asset (SPA) serving

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/threads/:id/ingest` | Seed an empty thread with a chained event batch |
| `POST` | `/api/threads/:id/append` | Append one event (validate-before-trust; 422 fail-closed) |
| `GET` | `/api/threads/:id/state` | Projected thread state (`clista.threadState.v0`) |
| `GET` | `/api/threads/:id/summary` | Decision answer-view (`clista.decisionSummary.v0`) |
| `GET` | `/api/threads/:id/audit` | Append-only audit view (`clista.audit.v0`) |
| `GET` | `/api/threads/:id/validate` | Re-validate stored chain (integrity + validation) |

## What this becomes

A Cloudflare-native web app (Vite + React front-end; Worker + Durable Objects
back-end) where real people drive ClisTa: create a decision thread, commit
evidence, raise objections that survive a yes, request/review/record a decision,
and file a minority report — every action a validated, hash-chained ClisTa event.
One Durable Object per Thread holds that thread's append-only event log as the
source of truth.

See [`docs/PLAN.md`](docs/PLAN.md) for architecture, phases, and verification.
