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
| `POST /api/intake` | **none (public)** | the gate.clista.ai submission form (`decision` / `run_report`) |
| `GET /api/intake` | human (Access) | the owner triage inbox |
| `POST /api/intake/:id/approve` | human | kind-dispatched: create a thread (proposal/decision) … |
| `POST /api/intake/:id/dismiss` | human | dismiss / mark spam |

`POST /api/intake` is the **only unauthenticated write** in the app. It is guarded
(fail-closed): **Turnstile** → **per-IP rate limit** → **size cap** (16 KB) → **kind +
field validation** → enqueue `pending` and return a **receipt id only**. It registers no
thread and appends no event. CORS is restricted to `INTAKE_ALLOWED_ORIGIN`
(`https://gate.clista.ai`).

## Owner-gated setup (Phase 2 — required before the public route works in prod)

### 1. Cloudflare Access — bypass policy for `/api/intake`
The app.clista.ai Access app currently covers the whole hostname, so it would block the
unauthenticated public route before the Worker runs. Add a **Bypass** (a.k.a. *Service Auth*
/ public) policy **scoped to the path `/api/intake`** on the app.clista.ai Access application
(Zero Trust → Access → Applications → app.clista.ai → Policies → Add a policy, action
**Bypass**, include **Everyone**, with the application path/route limited to `/api/intake`).
Leave every other path gated. Verify afterwards: `POST /api/intake` is reachable without an
Access cookie, while `GET /api/me`, `POST /api/threads`, etc. still redirect/401.

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
