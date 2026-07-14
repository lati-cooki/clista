# DRAFT Decision Record — Public "Try It" Sandbox (Phase 0 output)

**Status: PROPOSED / DRAFT — not sealed. Phase 1/2 BUILT (branch `sandbox-worker`,
`packages/threadhub-sandbox`, full test suite green, no merge/deploy). The owner rulings of 2026-07-13
are folded in below as RESOLVED (see §4); D-TURNSTILE (widget) and the `wrangler deploy` remain
owner-gated (Phases 3/5).** This document is the Phase-0 deliverable from
`docs/try-it-sandbox-handoff.md`: reuse confirmation, the de-risking spike result, concrete
recommendations for the handoff's open design decisions (each marked SAFE DEFAULT or NEEDS TROY), and a
phased implementation plan. It resolves nothing unilaterally.

Author: Phase-0 build session. Date: 2026-07-13.

---

## 1. Spike result — PASS (the load-bearing risk is retired)

**Claim proven:** a freshly-minted custodial writer can create a thread whose genesis (seq 0) carries a
stranger's pasted text, publish it, export it over the public read surface, and the **real, unmodified
`packages/threadhub/scripts/verify-standalone.mjs` returns PASS** on that export.

**Evidence (two isolated, throwaway harnesses, both green, both since deleted / scratchpad-only — nothing
merged, no production code touched):**

1. **Real DO path** — a throwaway `vitest-pool-workers` test drove the *actual* `threadhub-cf` HubDO in
   the local miniflare simulator (never the deployed `hub-prod` instance): `POST /identities` (custodial
   mint) → `POST /threads` (genesis seq 0 carrying the pasted decision in its payload) → `POST
   /t/:slug/records` (`ThreadPublished`) → `GET /t/:slug.json` (public export). Asserted: pre-publish the
   public face 404s; post-publish the export is `[seq 0, seq 1]`; `records[0].kind === 'genesis'` and
   `records[0].payload.question` equals the pasted text verbatim; `GET /t/:slug/verify` → `valid: true`.
   All assertions passed inside the real DO.
2. **Real checker path** — because `verify-standalone.mjs` is a **Text import** in `threadhub-cf`
   (`wrangler.jsonc` rule → the Worker serves its bytes at `/verify.mjs`), it is not callable *as a module*
   inside the worker pool. So a second throwaway Node harness reproduced the identical steps with the same
   `hub.js`/`Store`/`identity.js` code, wrote the export to a file, and ran the **real checker two ways**:
   `verifyExport(records)` in-process AND the CLI exactly as a stranger would
   (`node verify-standalone.mjs sandbox-export.json`). Both printed:

   ```
   PASS: 2 records, head sha256:e8e28886679f13c6b272bb2f1b74607f48972a693a7c9a02c533ceb87b8e949a,
   signatures verified 0/2 (unsigned records are held by the hash chain only)
   ```

   CLI exit code 0. The checker's `head` byte-matched `hub.verifyThread(...).head` (the independent
   cross-check the DR-rule-1.3 citation flow depends on).

**Consequence for the design:** the mechanics work exactly as the handoff assumed. No blocker. The
sandbox's `POST /try` performs these same four internal hub calls; only the caller changes (an unauth
stranger + Turnstile instead of an operator token).

**Two facts the spike surfaced that the DR must decide (see §4):**

- **(a) Bare export ⇒ `signatures verified 0/2`.** `GET /t/:slug.json` (`hub.exportThread`) emits *bare*
  envelopes — no `signature`/`record_hash` sidecar — so the checker verifies the **hash chain only** and
  honestly discloses `0/n` signatures. This is the same documented limitation as production (ledger:
  "GET /t/:slug.json exports bare envelopes without signatures"). The record *is* signed on the hub; the
  export just doesn't ship the sidecar. For the sandbox's "your record is real and signed" payoff this is
  a **weaker demo than it could be** — decision D-EXPORT below.
- **(b) The append-only trigger blocks TTL deletion.** `store-do.js` carries `records_no_delete`
  (`RAISE(ABORT)`). A TTL alarm that `DELETE`s expired sandbox records would be **rejected by the
  trigger** — the exact "can't wipe records in place" wall the cutover hit. The sandbox store must be a
  variant *without* those triggers, or shard one-DO-per-thread and reset. Decision D-TTLSTORE below.

---

## 2. Reuse confirmation (verified by reading the real code)

Every reusable piece named in the handoff was read and traced. Anchors:

- **Custodial mint** — `packages/threadhub/src/hub.js:69` `createIdentity({displayName, kind})` with no
  `publicKey` → `identity.generateKeypair()`, stores the PEM private key, returns `custodial: true`. The
  studio face wraps this verbatim: `packages/threadhub-cf/src/hub-internal.js:28` `mintIdentity` →
  `hub-do.js:96` → `this.hub.createIdentity({displayName, kind})`. **The sandbox writer mint is this exact
  call.**
- **Signing on append** — `hub.js:105` `append(...)`; `hub.js:110` fails `bad_request` "no custodial key
  for <id>" unless `author.private_key` exists; `hub.js:126` `signature = identity.sign(record_hash, priv)`.
  So the writer **must** be custodial (confirmed) — the sandbox mints it, so this holds.
- **Create → genesis** — `hub.js:83` `createThread(...)` inserts the thread then `append({kind:'genesis',
  payload:{title, question, created_by}})` at `hub.js:94`, sets `genesis_hash`. **The pasted decision maps
  into the genesis payload** (`title` truncated + `question` full). No separate append needed for v1.
- **Publish act** — pure function `packages/threadhub/src/publication.js:23` `effectivePublication` — the
  LAST `ThreadPublished`/`ThreadPublicationRevoked` `clista.event` governs; must be
  `action:'publish', scope:'public-read'` or it fails closed. Event shape mirrored in
  `packages/threadhub-cf/test/helpers.js:38` `publicationEvent`.
- **Shared route table** — `packages/threadhub/src/routes.js:141` `handle(hub, {method, path, bodyJson,
  publicMode, gateWrites, ip, allowWrite, checkerSource, accept})`. Public reads (`publicMode:true`) serve
  only published threads and answer the byte-pinned `PUBLIC_404_BODY` (`routes.js:60`) for
  unpublished==nonexistent. `rateLimiter({max,windowMs})` at `routes.js:66` (fixed-window per-IP, in-DO
  memory, resets on eviction).
- **Front door + DO** — `packages/threadhub-cf/src/worker.js` (role from bearer at `:49`; pre-body write
  gate at `:101`; `/verify.mjs` Text bytes at `:68`; DO hop at `:130` to `idFromName('hub-prod')`) →
  `src/hub-do.js` (`HubDO`, schema in `blockConcurrencyWhile`, `handle()` RPC, admin import/export) →
  `src/store-do.js` (`DOStore` over `ctx.storage.sql`, the SCHEMA with the append-only triggers).
- **Viewer + tokens** — `packages/threadhub/src/view.js` `threadViewHTML` + exported `CP_STYLE`; the raw
  viewer + `landingHTML` also live via `routes.js`. A sandbox viewer reuses these + a disclosure banner.
- **Checker** — `packages/threadhub/scripts/verify-standalone.mjs` `verifyExport(records)` at `:76`;
  bare-vs-sidecar handling at `:90`; honest `signatures verified k/n` disclosure at `:108`.

**Create → append-genesis → publish → export path (as the spike mirrored it):**
`createIdentity` → `createThread` (genesis seq 0) → `append(clista.event ThreadPublished)` →
`GET /t/:slug.json` (`exportThread`) → `verifyExport` PASS.

---

## 3. Recommended architecture (validated, not final)

**Isolation Model A — a separate `packages/threadhub-sandbox` Worker + its own DO class + its own DO
instance**, reusing `hub.js`/`view.js`/`routes.js`/`verify-standalone.mjs` as libraries. It fits the
*already-live* apex path-split topology exactly: the hub owns `consensusprotocol.ai` as a `custom_domain`
catch-all, the studio owns more-specific `/object/*` + `/api/*` routes that override it. The sandbox
becomes a **third, more-specific route owner**: `consensusprotocol.ai/try/*` → sandbox Worker. Zero code
path can reach `hub-prod`; the blast radius is a distinct Worker, distinct DO, distinct secret. The
browser prototype served at the apex by the hub can `fetch('/try', ...)` same-origin and the more-specific
route carries it to the sandbox Worker. This is the same mechanism studio's `/object/*` already proves
live.

**Write endpoint `POST /try`** on the sandbox Worker — Turnstile-gated, per-IP rate-limited, body-capped
(reuse the Worker's `MAX_BODY_CHARS` + `hub.js` `MAX_RECORD_BYTES`), total-thread-capped. Internally:
verify Turnstile token server-side → mint ephemeral custodial writer → `createThread` (pasted text = genesis
seq 0, **random slug**) → `append(ThreadPublished)` → return `{ slug, headHash, viewUrl }`. **v1 is
genesis-only** (no LLM deliberation — deferred to v2, flagged).

**Read surface** `GET /try/<slug>/view` + `GET /try/<slug>.json` + `GET /try/verify.mjs`, rendered with
`threadViewHTML`/`CP_STYLE` **plus an unmissable sandbox-disclosure banner**: "Sandbox demonstration —
ephemeral, expires in <N>h, not a governance record, not anchored." The `.json` + `verify.mjs` wire the
same import-`/verify.mjs` verifier the real viewer uses.

**Ephemerality** — a DO **alarm** sweeps threads older than the TTL and enforces a hard live-thread cap.
**No anchoring, ever.** Requires the trigger-free store variant (D-TTLSTORE).

---

## 4. Decisions

### SAFE DEFAULTS (recommended; proceed unless Troy objects)

- **D-ISOLATION — Model A (separate Worker + DO).** *Rationale:* maximum blast-radius isolation, and it
  slots into the live apex path-split (`/try/*` route) with zero risk to the hub apex or studio routes.
- **D-V1SCOPE — genesis-only.** *Rationale:* the honest minimum ("your pasted decision is now a real,
  signed, hash-chained, independently-verifiable record"); LLM deliberation is real cost + abuse surface,
  defer to v2.
- **D-PUBGATE — reuse the real publish gate.** `POST /try` appends a real `ThreadPublished` event and the
  sandbox reads run through `routes.js` `publicMode:true`. *Rationale:* the record carries its own
  publication act (doctrine-consistent), and reads reuse the byte-identical published-only machinery
  rather than a bespoke unconditional mode.
- **D-SLUG — random, namespaced, non-enumerable slug** (e.g. `try-<10-14 char base32 random>`), passed as
  `createThread({slug})` to override the title-derived `slugify`. *Rationale:* title-derived slugs are
  guessable, collision-prone, and harvestable; a random slug avoids enumeration and visibly marks sandbox
  threads distinct from prod slugs.
- **D-VERIFY-IDENTITY — the sandbox serves its own `/try/verify.mjs` Text-imported from the same repo file**
  (`verify-standalone.mjs`), byte-identical by construction. *Rationale:* one source of truth; the whole
  payoff is "the *same* checker passes."
- **D-FAILCLOSED — the wired Genesis screen fails closed and honestly** if Turnstile/JS fails: no token ⇒
  `POST /try` refuses; the UI says so plainly (no silent fake seal). *Rationale:* honest-limits doctrine
  applies hardest at a public write path.

### NEEDS TROY (owner-gated — do not resolve unilaterally)

- **D-TURNSTILE — widget creation + siteverify topology.** Creating the Turnstile widget needs Troy (owner
  of the Cloudflare account) or an authorized `turnstile-spin` run — it is an irreversible account action.
  *Recommended topology:* browser (Genesis screen widget) → **`POST /try` on the sandbox Worker, which
  calls siteverify server-side itself** (inline, using a `TURNSTILE_SECRET` wrangler secret) → mint. This
  is one fewer hop than the skill's default separate managed-siteverify Worker and keeps the secret on the
  sandbox Worker only. Never call siteverify from the browser. **Troy must: create the widget (domains:
  `consensusprotocol.ai`, `localhost`, `127.0.0.1`), hand over the sitekey, and set the
  `TURNSTILE_SECRET`.** SEAM BUILT (Phase 1/2): `src/turnstile.js` `verifyTurnstile()` — unset secret →
  allow (pre-widget/test), set secret → fail-closed on missing/invalid token, set + token → server-side
  siteverify (never from the browser). NOT a shipped bypass: production sets the secret, which flips the
  posture to fail-closed. Phase 3 is just `wrangler secret put TURNSTILE_SECRET` + the widget on the
  Genesis screen — no change to this file's logic.
- **D-TTL / D-CAP / D-RATE — RESOLVED (owner-ratified 2026-07-13).** TTL **24h**, live-thread hard cap
  **300**, per-IP write rate **5 / 10 min**. Implemented: TTL + cap are wrangler `vars`
  (`SANDBOX_TTL_HOURS` / `SANDBOX_MAX_THREADS`, cheap to retune); the rate limit reuses `routes.js`
  `rateLimiter({ max: 5, windowMs: 600000 })`. Tests pin each boundary.
- **D-TTLSTORE — RESOLVED (owner-ratified 2026-07-13): the trigger-free variant.** Implemented as
  `packages/threadhub-sandbox/src/sandbox-store.js` — the production DDL with EXACTLY the two append-only
  triggers (`records_no_update`, `records_no_delete`) removed; `test/store-parity.test.js` pins that the
  removed triggers are the *only* divergence, so the disclosed relaxation cannot silently widen. A DO
  **alarm** sweeps threads (and their 1:1 custodial writers) older than the TTL. Deliberate, disclosed:
  sandbox ≠ governance, never anchored, every view carries the ephemerality banner.
- **D-EXPORT — RESOLVED (owner-ratified 2026-07-13): Option B, signed export.** `GET /try/<slug>.json`
  emits each record's envelope PLUS the `signature` + `record_hash` sidecar, so the real checker prints
  `signatures verified n/n`. Prod's `exportThread` stays bare — this is a sandbox-only export path.
  Proven end-to-end: `test-node/verify-real-checker.test.js` runs the REAL, unmodified
  `verify-standalone.mjs` on the signed export → PASS, `signatures verified 2/2`.
- **D-ATCAP — behavior at the thread cap (owner copy-tone still open).** Implemented as an honest refusal
  at capacity. NOTE: shipped as HTTP **503** with `{ code: "at_capacity" }` (not the DR's floated 200) so
  programmatic clients see a proper "unavailable" status; the JSON message is honest ("the sandbox is at
  capacity … a demo with a small live footprint; try again shortly"). **Owner to confirm** status code +
  copy tone before Phase 5.
- **D-COSTCEILING — abuse/cost ceilings.** With v1 genesis-only there is no LLM spend; cost is bounded by
  DO storage (capped by D-CAP) + request volume (bounded by Turnstile + D-RATE). No hard $ ceiling needed
  for v1; **revisit at v2** when an LLM call is added. Flag to Troy that v2 changes this materially.

---

## 5. Phased implementation plan (Phases 1–5)

**Phase 1 — Sandbox skeleton (no Turnstile).** New `packages/threadhub-sandbox` Worker + `SandboxDO` +
trigger-free store variant (D-TTLSTORE). `POST /try` (mint → createThread(genesis, random slug) →
publish), `GET /try/<slug>/view` + `.json` + `/try/verify.mjs`. Reuse `hub.js`, `routes.js` (with
`publicMode:true`, `gateWrites` off for `/try` only), `view.js`, `verify-standalone.mjs`. Turnstile behind
a test-mode env bypass. **Full `vitest-pool-workers` suite** mirroring the spike: mint→genesis→publish→
export→**assert `verifyExport` PASS** (run the checker in a Node-side step or import it in a non-Text
sibling package to keep it callable), TTL-alarm deletion actually removes an expired thread (proves the
trigger-free store), rate-limit + body-cap + thread-cap refusals, disclosure banner present, and an
**isolation test proving no sandbox write can reach `hub-prod`**.

**Phase 2 — TTL + caps + abuse controls hardening.** DO alarm sweep (one alarm, reschedule on each pass);
live-thread cap enforcement + D-ATCAP refusal; per-IP D-RATE limiter; body/record caps. Tests for each
boundary. Confirm no anchoring path exists.

**Phase 3 — Turnstile (needs Troy: D-TURNSTILE).** Troy creates the widget + sets `TURNSTILE_SECRET`. Wire
inline server-side siteverify into `POST /try` (fail closed on missing/invalid token). Describe-only here
per Phase-0 rules; execution waits on the owner.

**Phase 4 — Wire `GenesisScreen`.** In the design project's `templates/consensus-prototype/ConsensusApp.jsx`,
`seal()` calls `POST /try` with the Turnstile token; on success the "What becomes permanent" echo shows the
**real** returned `sha256` + seq + a link to `/try/<slug>/view` + a "verify it now" affordance; add the
Turnstile widget; keep reduced-motion/doctrine treatment. Rebuild the prototype bundle, redeploy, **and
push `ConsensusApp.jsx` back to the design project via DesignSync in lockstep** (HARD INVARIANT 6 — else a
re-pull reverts it).

**Phase 5 — Independent review + Troy-gated deploy + live invariant verification.** Independent subagent
review of the sandbox branch; fix; merge `--no-ff` (keep branch refs). **Troy-gated `wrangler deploy`** of
the sandbox Worker + its `/try/*` route. Live-verify **every HARD INVARIANT**: `hub-prod` untouched; `GET /`
JSON byte-identical (API `*/*`); `/verify.mjs` unchanged (7978 B golden); no sandbox slug in any prod
listing/export/anchor; a real `/try/<slug>/view` renders + its `verify` PASSes; auto-expiry works;
design-project source in sync.

---

## 6. HARD INVARIANTS carried forward (unchanged from the handoff — verify each before merge)

`hub-prod` DO untouched · `GET /` JSON byte-identical for API clients · `/verify.mjs` byte-identical ·
operator screens stay demonstrations (only Genesis becomes real) · **no sandbox data git-anchored** ·
design-project `ConsensusApp.jsx` kept canonical. Model A + the `/try/*` route + a separate DO make the
first four structural rather than vigilance-dependent, which is why Model A is recommended.

---

## 7. Security-review hardening (branch `sandbox-worker`, pre-Phase-3)

The independent review verdict was "Ready for Phase 3 with hardening before deploy" — all HARD INVARIANTS
hold. The confirmed findings below were fixed on `sandbox-worker` (sandbox-only diff; no
`threadhub/**` or `threadhub-cf/**` changes), each with a regression test. Isolation, the fail-closed
Turnstile seam, trigger-free store scope, TTL, and the signed export are unregressed.

- **FINDING 1 — MEDIUM — ADDRESSED.** `POST /try` buffered the body (`await request.text()`) *before* the
  size check, Turnstile, and the rate limiter, letting an unauthenticated caller force the isolate to buffer
  up to the platform limit unmetered. `src/worker.js` now pre-checks `Content-Length` and returns 413
  *before* `request.text()` and any downstream work; the post-read fallback (absent/lying Content-Length) is
  now **byte-accurate** — it measures UTF-8 bytes via `TextEncoder`, not `bodyText.length` (UTF-16 units) —
  against the intended `5e6` cap. *Regression:* `test/hardening.test.js` — oversized body → 413 with no
  thread minted and the rate-limiter budget intact (proves the DO/limiter/mint were never reached); a
  multi-byte body under the char cap but over the byte cap → 413; a normal body still succeeds.

- **FINDING 2 — LOW — ADDRESSED.** `sandbox-do.js` `createTry`'s mint → `createThread`(genesis) →
  `append`(ThreadPublished) had no rollback, so a failure after `createThread` left a genesis-only thread
  permanently occupying a 300-cap slot. The sequence is now wrapped: on any post-mint throw the thread id
  (pre-generated so it is known even if `createThread` throws mid-way) is cleaned up via
  `deleteThreadCascade` (thread + records + the 1:1 custodial writer), and the writer identity is dropped
  explicitly for the create-before-insert case. DO SQL is synchronous, so the cleanup is atomic to the call.
  *Regression:* `test/hardening.test.js` injects a publish-step failure and asserts zero threads, zero
  records, zero identities remain (cap count unchanged).

- **FINDING 3 — LOW — ADDRESSED (defense-in-depth, aligns with D-PUBGATE).** The read path served
  `getThread()` unconditionally. `handle()` now enforces effective publication on both `/try/<slug>/view`
  and `/try/<slug>.json` by reusing `packages/threadhub/src/publication.js` `effectivePublication`; an
  unpublished/half thread returns the same `PUBLIC_404_BODY` bytes as a nonexistent slug (no oracle). This
  closes the window where a half-thread (e.g. from FINDING 2's failure path) would still render. *Regression:*
  `test/hardening.test.js` — a half (genesis-only, unpublished) thread 404s byte-identically to a nonexistent
  slug on both surfaces, while a properly published thread is still served 200.

- **FINDING 5 — LOW — NOTED (accepted v1 limitation / later-hardening item).** `src/turnstile.js`
  `verifyTurnstile()` checks the siteverify response's `success` field ONLY; it does not additionally assert
  the returned `hostname` or `action` match the expected sandbox origin/action. A stolen/replayed token from
  another Turnstile-protected surface on the same account could therefore pass. Accepted for v1 (the seam is
  still fail-closed on missing/invalid/errored tokens and the write path is rate- and cap-bounded regardless).
  **Later-hardening item:** when the widget is created in Phase 3, pin `hostname` to `consensusprotocol.ai`
  and `action` to the Genesis-screen action in `verifyTurnstile`.
