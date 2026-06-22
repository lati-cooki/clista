# clista-ai-app

The live **ClisTa Protocol** cockpit — the human-facing surface for the
accountability engine at
[`lati-club/ClisTa-Protocol`](https://github.com/lati-club/ClisTa-Protocol),
deployed to **app.clista.ai**.

> Here's a yes — now trace its shape.

## Status: Phase 0 — surface scaffolded

The Vite + React 19 front-end is up and renders the full cockpit design
(imported from the `app.clista.ai` Claude Design project, `ClisTa Cockpit.dc.html`).
Four screens are live against sample data: **Thread Cockpit** (decided + degraded
states, surviving-objection panel, provenance traces, collapsible audit terminal),
**Thread Index** (filterable ledger), **Compose / Append** (fail-closed objection
form), and the **Component Kit**. The full build plan lives in
[`docs/PLAN.md`](docs/PLAN.md).

Next: Phase 1 — port the ClisTa engine into a per-thread Durable Object and prove
`scenario-demo` parity, then wire these screens to projected state + real events.

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Layout

- `src/App.jsx` — app shell (topbar, sidebar nav, screen routing)
- `src/screens/` — `Cockpit`, `ThreadIndex`, `Compose`, `Kit`
- `src/data.js` — the sample "support-assistant beta" thread (Phase 1 replaces with projected event-log state)
- `src/styles.js` / `src/icons.js` — design tokens, status badges, line-icon set
- `src/lib/` — `css()` style helper, `<Svg>`, `<Hoverable>`

## What this becomes

A Cloudflare-native web app (Vite + React front-end; Worker + Durable Objects
back-end) where real people drive ClisTa: create a decision thread, commit
evidence, raise objections that survive a yes, request/review/record a decision,
and file a minority report — every action a validated, hash-chained ClisTa event.
One Durable Object per Thread holds that thread's append-only event log as the
source of truth.

See [`docs/PLAN.md`](docs/PLAN.md) for architecture, phases, and verification.
