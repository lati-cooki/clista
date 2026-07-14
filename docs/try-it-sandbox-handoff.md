# Handoff: Public "Try It" sandbox — a stranger pastes a decision and gets a real, verifiable, ephemeral witnessed thread

**Status:** not started. This is a spec + handoff for a fresh session to build. It is the design system's
original "twenty-minute prospect run" vision (see the Genesis screen in the design prompt) made real.

**Read first:** `.superpowers/sdd/progress.md` (the authoritative project ledger) top to bottom. This
document assumes that context.

---

## The goal, in one sentence

Let an unauthenticated stranger, from the live front door at `consensusprotocol.ai`, paste a decision and
receive a **real hash-chained genesis record** they can open and independently verify with the real
`verify.mjs` — **without** that write path being able to touch, pollute, or weaken the production audit
records.

Today the front door (`/` for browsers) is the **connected prototype** — a self-contained React
click-through with sample data. Its Genesis screen ("Paste the decision you need to defend" → "Cross the
threshold" → "Seal genesis record") is a **mockup**: the seal is a `setTimeout`, no real record is created.
This project makes that one screen genuinely produce a real, verifiable record — in an isolated sandbox.

## Why this is a real project, not a wiring pass

The system is deliberately split into two planes and that split is a **security property**, not an accident:

- **Public plane (Cloudflare Workers):** read + tokenized-objection only. `POST` from a non-operator is
  walled to a byte-identical 404 *before the body is read* (`worker.js` "write gate"). Unpublished threads
  are byte-identical to nonexistent ones. The public web **cannot create or seal records.**
- **Operator plane (local Python at `~/DevSwarmProjects/Clista`):** all writes — genesis, seal, Challenge
  Run, FCP controls, anchoring — run locally and drive the cloud over HTTPS with a bearer token.

"Try it" **introduces a new, bounded, public write path.** That is exactly the thing the architecture was
built to not have, so it must be added as a **separate, sandboxed, abuse-controlled, ephemeral** surface
that shares no state with production. Get the isolation wrong and you compromise the whole "no signup, the
record is the interface, unpublished==nonexistent" model that the product's credibility rests on.

---

## HARD INVARIANTS — must not break (verify each before merge)

1. **`hub-prod` DO is untouched.** Sandbox records live in a *different* DO instance (or a separate Worker).
   A sandbox thread must NEVER appear in the production hub's `GET /` JSON listing, `/admin/export`, anchor
   log, or any `/t/<prod-slug>/view`.
2. **`GET /` JSON stays byte-identical** for API clients (`*/*`) — operator plane, anchor gate, export all
   depend on it. Only browser/HTML surfaces may change.
3. **`/verify.mjs` stays byte-identical** (`packages/threadhub/scripts/verify-standalone.mjs`, currently
   7978 B, golden). The sandbox's payoff is that this *same* checker PASSES on a sandbox thread's export.
4. **The prototype's operator screens stay demonstrations.** Only **Genesis** becomes real. Challenge Run
   and Registry/FCP are operator-plane acts and must NOT be exposed as public writes.
5. **No sandbox data is git-anchored** into the public `ANCHORS.md` (prompt-studio repo). Sandbox threads
   are ephemeral demos, not governance records — they must not enter the production anchor chain.
6. **Design-project source stays canonical.** The live prototype is built from
   `templates/consensus-prototype/ConsensusApp.jsx` in the Claude Design project (id
   `0d24922c-ca70-4b53-9506-61af0219b125`). Any Genesis-screen change must be pushed back there via the
   design MCP (DesignSync) in lockstep, or a future re-pull silently reverts it. See the ledger's
   "DESIGN-PROJECT SOURCE SYNCED" entry for the flow.

## Existing building blocks to reuse (do not reinvent)

- **Hub Worker + DO:** `packages/threadhub-cf/src/worker.js` (front door: role, write gate, `/verify.mjs`,
  `/prototype`, browser `/`) → `src/hub-do.js` (HubDO, instance `idFromName('hub-prod')`) → shared route
  table `packages/threadhub/src/routes.js` `handle(hub, {...}) → {status,contentType,body}`.
- **Record creation + signing:** `packages/threadhub/src/hub.js`. Records are hash-chained and **signed with
  the author's custodial private key on append** (hub.js ~line 110: "no custodial key for <id>; submit
  signed record instead"). So a sandbox writer must be a **custodial identity the sandbox hub mints and
  holds the key for** — exactly the pattern the studio uses to mint objectors
  (`workers/studio/.../hub-internal.js` `mintIdentity` = keyless/custodial `createIdentity`). Reuse it.
- **Thread/record/publication routes:** `POST /threads`, `POST /t/:slug/records`, `POST /identities`,
  publication events, and `effectivePublication` (public reads serve only *published* threads) already
  exist in routes.js — but are operator-gated in public mode. The sandbox needs its own public-but-bounded
  entrypoint that internally performs the same create → append(genesis) → publish steps.
- **Rate limiter:** `routes.js` `rateLimiter({max,windowMs})` (fixed-window per-IP, in-DO memory). Reuse
  and tighten for the write path.
- **Viewer + tokens CSS:** `packages/threadhub/src/view.js` `threadViewHTML` + the exported `CP_STYLE`
  design tokens. A sandbox viewer can reuse these with a prominent sandbox-disclosure banner.
- **The prototype build pipeline** (this session's scratchpad `proto-build/`, and the recipe in the ledger):
  esbuild transpiles `ConsensusApp.jsx` → inline React UMD + `_ds_bundle.js` + `tokens/*.css` → one
  self-contained `packages/threadhub-cf/prototype/consensus-prototype.html`, served at browser `/` and
  `/prototype`. Wiring Genesis means editing `GenesisScreen` in `ConsensusApp.jsx`, rebuilding, and
  redeploying — plus the DesignSync push-back (invariant 6).

## Skills the new session should load

- **`turnstile-spin`** (or `cloudflare:turnstile-spin`) — a public write path MUST have bot protection;
  this skill sets Turnstile up end-to-end (widget + siteverify Worker + frontend snippet).
- **`durable-objects`** — DO best practices, SQLite storage, **alarms** (needed for TTL sweeps).
- **`wrangler`**, **`workers-best-practices`**, **`cloudflare`** — deploy/config/idioms.
- **`superpowers:brainstorming`** FIRST (this is new feature design), then **`superpowers:writing-plans`**,
  and the review discipline: **`superpowers:requesting-code-review`** / an independent subagent review per
  the project's established pattern before any merge.

---

## Proposed architecture (a direction — brainstorm/validate it, don't treat as final)

**Isolation (pick one; recommend A for maximum safety):**
- **A. Separate sandbox Worker + DO** in the monorepo (e.g. `packages/threadhub-sandbox`), reusing
  `hub.js`/`view.js`/`verify-standalone.mjs` as libraries but with its **own** DO class + instance, own
  Turnstile secret, own limits, own deploy. Zero code path can reach `hub-prod`. Cleanest blast-radius.
- **B. Same hub Worker, separate DO instance** `idFromName('try-it')` behind a distinct `POST /try` route.
  Less infra, but shares the Worker with production — one routing mistake and sandbox data could reach a
  prod surface. If chosen, every prod read path must be provably filtered to `hub-prod` only.

**The write endpoint:** `POST /try` (or on the sandbox Worker) — **Turnstile-gated, per-IP rate-limited,
body-capped, content-length-capped**. Internally: mint an ephemeral custodial writer → create a thread →
append the pasted text as the genesis record (seq 0) → publish it → return `{ slug, headHash, viewUrl }`.
v1 is **genesis-only**: the honest minimum is "your pasted decision is now a real, signed, hash-chained
record you can verify." (A lightweight witnessed maker/checker deliberation would need an LLM call from the
Worker — real cost + abuse surface; **defer to v2**, flag explicitly.)

**Read surface:** a distinct path, e.g. `GET /try/<slug>/view` and `GET /try/<slug>.json`, rendered with
`threadViewHTML`/`CP_STYLE` **plus a prominent, unmissable disclosure banner**: "Sandbox demonstration —
ephemeral, expires in <N>, not a governance record, not anchored." Honest-limits doctrine (rule 3) applies
harder here than anywhere.

**Verification:** the real `/verify.mjs` must PASS on `GET /try/<slug>.json`. That is the entire payoff —
"you pasted this 60 seconds ago and a stranger's 30-line checker already proves it's intact." Wire the
sandbox viewer's "Verify this thread" button to the same import-`/verify.mjs` flow the real viewer uses.

**Ephemerality:** DO **alarm** sweeps sandbox threads older than a TTL (propose 24–72h) and enforces a hard
cap on total live sandbox threads (propose a few hundred). No anchoring, ever.

**Front-end wiring:** `GenesisScreen` in `ConsensusApp.jsx` — the `seal()` action calls `POST /try` (with a
Turnstile token), and on success the "What becomes permanent" echo shows the **real** returned `sha256` +
seq and a real link to `/try/<slug>/view` + a "verify it now" affordance. Add the Turnstile widget to the
Genesis screen. Keep the reduced-motion / doctrine treatment. Rebuild the bundle; push `ConsensusApp.jsx`
back to the design project (invariant 6).

## Open design decisions to resolve during brainstorming/planning

1. Isolation A (separate Worker+DO) vs B (separate DO instance). **Lean A.**
2. v1 genesis-only vs v2 lightweight witnessed deliberation (LLM cost/abuse). **v1 genesis-only.**
3. TTL length + total-thread cap + per-IP write rate.
4. Turnstile keys (need Troy to create the widget, or use `turnstile-spin`), and the siteverify topology.
5. Slug scheme (avoid collision + avoid enumeration/harvesting; sandbox slugs should look distinct).
6. Does the sandbox DO reuse the `effectivePublication` publish-gate, or serve unconditionally (it's a demo)?
7. Cost/abuse ceilings and what happens at the cap (queue? refuse with an honest message?).
8. How the wired Genesis screen degrades if Turnstile/JS fails (it must fail closed and honestly).

## Suggested phases

0. **Brainstorm** (superpowers:brainstorming) → write a **Design Decision Record** for the sandbox
   (isolation model, TTL, abuse controls, disclosure copy) and get Troy's sign-off. Seal it via the studio
   DR flow if following project discipline.
1. **Phase-0 spike** (like the CF port's spike): prove in a throwaway DO that the sandbox can mint a
   custodial writer, create+append+publish a genesis record, export it, and that the real `verify.mjs`
   returns PASS on that export. De-risks the core before building UI.
2. **Build the sandbox Worker + DO** (isolation, `POST /try`, `/try/<slug>/view` + `.json`, TTL alarm,
   rate limit, body caps) with a full vitest-pool-workers suite. NO Turnstile yet if it slows the spike;
   add in 3.
3. **Turnstile** via `turnstile-spin` on `POST /try`.
4. **Wire `GenesisScreen`** → `POST /try`; rebuild the prototype bundle; **push `ConsensusApp.jsx` back to
   the design project**; redeploy the prototype.
5. **Independent review** (subagent, per project discipline) of each repo's branch; fix; merge with
   `--no-ff`; **Troy-gated `wrangler deploy`**; live verification incl. all HARD INVARIANTS above.

## Definition of done

A stranger at `consensusprotocol.ai` pastes a decision, crosses the threshold, and lands on a **real**
`/try/<slug>/view` showing their words as a signed, hash-chained genesis record; clicking "verify" runs the
**real** `verify.mjs` and it PASSES; the thread is clearly marked sandbox/ephemeral and auto-expires; and
**every HARD INVARIANT is verified intact** — `hub-prod` untouched, `GET /` JSON byte-identical,
`/verify.mjs` unchanged, no sandbox data in any production listing/export/anchor, design-project source in
sync. Then the front door doesn't just *show* the loop — a prospect can *run* it, which is the whole
distribution thesis.

## Where things live / how to operate

- **Monorepo (hub + prototype):** `~/Projects/clista` — `main` at the CF-port + prototype state (see
  ledger for the exact HEAD). `packages/threadhub-cf` (hub Worker+DO), `packages/threadhub` (shared
  routes/view/verify), `packages/threadhub-cf/prototype/consensus-prototype.html` (deployed prototype).
- **Studio repo:** `~/DevSwarmProjects/Clista` — `workers/studio` (studio Worker+DO), `objections.py`,
  operator plane. Reference for the objector-mint / custodial-key pattern.
- **Design project:** Claude Design `0d24922c-ca70-4b53-9506-61af0219b125`, file
  `templates/consensus-prototype/ConsensusApp.jsx`. Edit via DesignSync (get_file / finalize_plan /
  write_files).
- **Tests:** `cd packages/threadhub-cf && npx vitest run`; `cd packages/threadhub && npm test`.
- **Deploy:** `wrangler deploy` — **permission-gated; Troy runs it** and must name the target explicitly.
- **Discipline:** branch → build+test → independent subagent review → merge `--no-ff` (keep branch refs) →
  Troy-gated deploy → live verification → update the ledger. Never push/deploy without Troy's go.

## Do NOT

- Do not add any public path that can write to `hub-prod`, mutate production records, or expose seal /
  Challenge-Run / FCP acts to unauthenticated callers.
- Do not anchor sandbox threads. Do not let sandbox slugs enter `GET /` JSON, `/admin/export`, or the real
  `/t/<slug>/view`.
- Do not change `/verify.mjs` or the `GET /` JSON branch.
- Do not edit the deployed prototype without also updating the design-project `ConsensusApp.jsx`.
- Do not deploy yourself — hand the deploy to Troy.
