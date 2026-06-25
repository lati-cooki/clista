# The intake subsystem — triage inbox + public submission

A typed, strictly-quarantined inbox. The autonomous seeder and outside submitters *propose*
into it; **a human triages every item and is the accountable creator/owner** of anything
promoted to the ledger — mirroring the protocol boundary *"agent stages, human merges"* as
*"agent/public propose, human approves & owns."*

## The model
- **`IndexDO.intake`** is DO metadata — **not** a protocol event and **not** in the threads
  index — so a `pending` item is **quarantined** (invisible as ledger state) until approved.
  Approval runs the normal `POST /api/threads` create path, so the **approving human** is the
  new thread's `decision owner`.
- Rows are typed by `source` (`agent` | `public`) × `kind` (`thread_proposal` | `decision` |
  `contribution` | `run_report`).

## Routes
| Route | Auth | Purpose |
|---|---|---|
| `POST /api/agent/intake` | agent service token | the emergent seeder proposes a `thread_proposal` |
| `POST /api/intake/submit` | **none (public, Access-bypassed)** | submissions: `decision` / `run_report` (gate.clista.ai form) · `contribution` (API / deep-link, needs `targetThreadId`) |
| `GET /api/intake` | human (Access) | the owner triage inbox |
| `POST /api/intake/:id/approve` | human | kind-dispatched (see below) |
| `POST /api/intake/:id/dismiss` | human | dismiss / mark spam |

> **Path split (important for the Access bypass):** Cloudflare Access matches by **path, not
> method**, and a Bypass policy *strips identity* from that path. The public submission therefore
> lives on its **own** path, `POST /api/intake/submit`, which is the ONLY path the bypass covers.
> The owner routes (`GET /api/intake`, `POST /api/intake/:id/...`) stay on `/api/intake` under the
> main gated app, so the owner's identity is intact. A bypass scoped to bare `/api/intake` would
> also bypass the owner's `GET` → 401 → the cockpit Triage inbox would render empty.

### Approve dispatch by kind
- **`thread_proposal` / `decision`** → create a thread via the normal create path
  (approving human = `decision owner`); **seed the proposal's `payload.useCases` as starting
  substrate** — each becomes a `ClaimCreated` (status `proposed`, committed by the approver) so
  the thread opens pre-grounded (response carries `seededClaims`). Optional `{flag:true}` hands it
  to the deliberation cron.
- **`run_report`** → create a new human-owned thread and attest the report as
  `EvidenceCommitted` (`source: "public run report <receipt>"`), the external origin preserved.
- **`contribution`** → append the input as `EvidenceCommitted` onto the existing
  `targetThreadId` (`source: "public submission <receipt>"`); the approver joins that thread as a
  contributor to vouch for it. Creates no new thread.

All approvals are by a human; the submitter's stated handle is display-only and never an
`actor_id` — the approving human is always the committing participant.

`POST /api/intake/submit` is the **only unauthenticated write** in the app. It is guarded
(fail-closed): **Turnstile** → **per-IP rate limit** → **size cap** (16 KB) → **kind +
field validation** → enqueue `pending` and return a **receipt id only**. It registers no
thread and appends no event. CORS is restricted to `INTAKE_ALLOWED_ORIGIN`
(`https://gate.clista.ai`).

## Owner-gated setup (Phase 2 — required before the public route works in prod)

### 1. Cloudflare Access — bypass app scoped to `/api/intake/submit`
The app.clista.ai Access app covers the whole hostname, so it would block the unauthenticated
public route before the Worker runs. Add a **separate self-hosted application** scoped to the
exact path **`app.clista.ai/api/intake/submit`** with a **Bypass** policy (include **Everyone**):
Zero Trust → Access → Applications → **Add an application** → Self-hosted → domain `app` ·
`clista.ai` · path `api/intake/submit` → Add policy: action **Bypass**, Include **Everyone**.
The more-specific path shadows the broader gated app for just that route.

> **Do NOT scope the bypass to bare `/api/intake`.** Access matches by path, not method, and a
> Bypass strips identity — so it would also bypass the owner's `GET /api/intake` (the cockpit
> Triage inbox), which would then 401 and render empty. Keep the bypass on `/api/intake/submit`
> only; the owner routes on `/api/intake` stay under the main gated app.

Verify afterwards: `POST /api/intake/submit` is reachable without an Access cookie (→ Worker
403 `human-verification` on a bad token), while `GET /api/intake`, `GET /api/me`,
`POST /api/threads`, etc. still redirect/401.

### 2. Turnstile widget + secret
Create a Turnstile widget (managed mode) for `gate.clista.ai` (Cloudflare dash → Turnstile →
Add widget, or via the `turnstile-spin` skill — we only need the **keys**, not its managed
siteverify Worker, because the app Worker verifies the token itself). Then:
- **Secret key** → set on the Worker (never commit it):
  ```sh
  echo "<turnstile-secret>" | npx wrangler secret put TURNSTILE_SECRET
  ```
  (When `TURNSTILE_SECRET` is unset — local dev / CI tests — verification is **skipped** so the
  route stays drivable; production always has it set, so real submissions are gated.)
- **Site key** (public) → paste into the gate form: replace `REPLACE_WITH_TURNSTILE_SITEKEY`
  in `website/gate.clista.ai/index.html` (launch-planning repo) with the widget's site key.

### 3. Deploy
- App Worker: merge to `main` → `deploy-app.yml` (touches `worker/**`). Or
  `npm run build && npx wrangler deploy`.
- Gate page: in the launch-planning repo, merge to `main` → `deploy-website.yml` (touches
  `website/**`) redeploys the `clista-gate` Pages project. Or `./website/build.sh &&
  wrangler pages deploy website/dist/gate.clista.ai --project-name clista-gate`.

## Verify end-to-end (after setup)
1. Load `https://gate.clista.ai/` → the Turnstile widget renders (no `400020` console error).
2. Submit a decision → a receipt id is shown.
3. As the owner, open `app.clista.ai` → Thread Index → the **Triage inbox** shows the
   `public` item → **Approve → create thread** → a thread you own appears, chain valid.
4. Abuse checks: a missing/invalid Turnstile token → 403; >5 submissions from one IP in the
   window → 429; a >16 KB body → 413.

## Config reference
- `wrangler.jsonc` `vars.INTAKE_ALLOWED_ORIGIN` — CORS allow-list (comma-separated).
- `TURNSTILE_SECRET` — Worker secret (`wrangler secret put`), not in source.
- Rate limit: 5 submissions / 10 min / IP (`IndexDO.rateLimitIntake`).
