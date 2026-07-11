---
name: verify
description: Build, run, and drive the clista-ai-app cockpit locally to verify UI/worker changes end-to-end.
---

# Verify clista-ai-app

The Worker serves the API **and** the built frontend from `dist/` — always
`npx vite build` before `wrangler dev`, or you'll be driving stale UI.

## Build + run

```bash
npx vite build                      # frontend → dist/
npx wrangler dev --port 8791        # worker + assets + DOs (state persists in .wrangler/state)
curl -s localhost:8791/api/me -H 'x-clista-email: troylati@gmail.com'   # dev identity via .dev.vars DEV_IDENTITY
```

All API calls need the `x-clista-email` header locally (Access replaces it in prod).

## Seed data

Create threads / append events straight through the API (see `src/events.js`
for event shapes — `ClaimCreated` is the smallest useful append):

```bash
curl -s -X POST localhost:8791/api/threads -H 'x-clista-email: troylati@gmail.com' \
  -H 'content-type: application/json' -d '{"question":"A question of at least 12 chars?"}'
# append bumps the thread's updated_ms → moves it to the top of the index
```

## Drive the UI

The claude-in-chrome browser is cloud-hosted and CANNOT reach localhost (and
binding wrangler to 0.0.0.0 is permission-denied). Use headless system Chrome
via puppeteer-core instead:

```bash
npm i --no-save puppeteer-core     # no browser download; uses /Applications/Google Chrome.app
```

Script from the scratchpad must resolve modules via
`createRequire('<repo>/package.json')`. The app has NO routing — screens are
React state; navigate by clicking sidebar buttons
(`aside nav button` innerText: "Thread Cockpit", "Thread Index", …).
Filter/status button text is CSS-uppercased — match case-insensitively.

## Gotchas

- If esbuild/workerd fail with "installed for another platform" and
  `node_modules/@esbuild/darwin-arm64/bin/` (or
  `@cloudflare/workerd-darwin-arm64/bin/`) is empty, `npm install` won't
  restore it (allow-scripts config). Fix: `npm pack <pkg>@<version>` in the
  scratchpad, untar, copy `package/bin/*` into the package's `bin/`, chmod +x.
- Tests: `npm run test:all` (node --test + vitest/workers) — CI's job, not
  verification.
