# Plan — `app.clista.ai`: the live ClisTa cockpit (evolve Lokahi)

## Context

Three repos are one system with a hole in the middle:

- **`lati-club/ClisTa-Protocol`** — the engine. Append-only, hash-chained NDJSON event log as the *source of truth*; deterministic projection; validation-before-trust (fail-closed); a rich object model (Thread / Evidence / Assumption / Claim / Objection → Decision Request → Review → Decision Record, Minority Report, Provenance, Attribution). Rigorous, but **agent/CLI-only — a human can't feel it.**
- **`lati-cooki/clista-protocol-launch-planning`** — the storefront. A full design system (monochrome + signal palette; Jost / IBM Plex Sans / IBM Plex Mono; 8 primitives `Button` `Badge` `Card` `Eyebrow` `RuleDot` `IconMedallion` `NumberedStep` `Terminal`) and **six live Cloudflare Pages surfaces** (`clista.ai`, `cli.`, `gate.`, `runs.`, `docs.`, `learn.`). `cli.clista.ai` is an explicit **non-live mock** of the cockpit.
- **`lati-club/lokahi`** — a React+Vite+Express prototype of the same thesis, but with a **re-derived, weaker engine** (mutable SQLite status column; events are a side log, not truth).

The owner keeps re-deriving the engine because no attempt unites **rigor + a human surface**. The fix is to stop building a second engine: **Lokahi becomes `app.clista.ai`, the real interactive cockpit that `cli.clista.ai` only mocks**, sitting *on top of* the actual ClisTa engine — event log as truth, UI projects state and emits ClisTa events — wearing the existing clista.ai design system so it reads as a surface, not a separate product.

**Decided:** Cloudflare-native runtime. **One Durable Object per Thread** holds that thread's append-only event log in its SQLite; projection + validation run in a Worker; deploys as `app.clista.ai` beside the existing Pages surfaces. One DO = one accountable thread is the protocol-native mapping and avoids a later migration.

**Outcome:** a published, multi-user web app where real people drive ClisTa — create a thread, commit evidence, raise objections that *survive* a yes, request/review/record a decision, file a minority report — and every action is a validated, hash-chained ClisTa event that replays byte-identically.

## Architecture

```
Browser (Vite React SPA, clista.ai design system)
        │  /api/threads/:id/...
        ▼
Worker (router, auth, identity → actor_id)
        │  getDurableObjectStub(thread_id)
        ▼
ThreadDO  ── SQLite: events (append-only, hash-chained)
        ├─ append(event): validate-before-trust → fail-closed (event_id + reason)
        ├─ project(): deterministic state from events (no transcript memory)
        └─ summary()/validate()/replay(): parity with ClisTa CLI
Thread index: a single IndexDO (or KV) mapping thread_id → title/status/owner for the list view.
```

The engine's **pure** logic is reused; only its storage/runtime shell is replaced.

## Approach

### Phase 0 — Scaffold the surface (skeleton, deployed)
- **Create a new dedicated repo** (first action on execution): **`lati-club/clista-ai-app`, private** (flip to public at launch) — a clean repo, independent deploy per the design-spec, deploys to `app.clista.ai`. Lokahi is *not* renamed or reused as the repo; its salvageable UI components are copied in, its engine dropped. `git init`, scaffold, first commit, push.
- Vite + React 19 front-end; Worker + Durable Objects back-end via `wrangler.jsonc`.
- Port the **design system** in first so it's a clista.ai surface from day one: copy tokens/components from `launch-planning/website/shared/styles.css` + `site.css`, the 8 primitives, the octopus mark, and the three fonts. Build the React primitive components (`Badge` for protocol status, `Terminal` for the event-log/CLI view, `RuleDot`, etc.) as the component library.
- Stand up `app.clista.ai` (new Pages/Worker project + custom domain; follows `website/CLOUDFLARE.md` §2–3, one more wildcard subdomain) serving a hello-world. Use the `cloudflare`, `durable-objects`, and `wrangler` skills.

### Phase 1 — Port the engine into the ThreadDO (the trust anchor)
- Extract ClisTa's **pure** modules — `src/integrity.js` (hash chain: `contentHash`, `prepareEventForAppend`, `stableStringify`, `EVENT_HASH_VERSION`/`PROTOCOL_VERSION`), `src/events.js` (event builders/append, minus `fs`), `src/projector.js` (projection), and the validators — into a runtime-agnostic package consumed by the DO.
- Replace storage shell: `.clista/events.ndjson` file I/O → DO SQLite (one row per event, append-only); `node:crypto` → a **sync** sha256 (bundle e.g. `js-sha256`) so hashing stays synchronous and replay stays **byte-identical** (Web Crypto `subtle.digest` is async — avoid to preserve the determinism guarantee). Keep server-generated IDs in the DO.
- **Parity proof:** ingest the bundled `examples/scenario-demo/events.ndjson` into a ThreadDO and assert its `project()` / `summary()` equal ClisTa CLI `state show` / `decision summary` on the same log. This is the anchor that proves the cockpit consumes the *real* engine, not a new one.
- Validators: schemas live in `ClisTa-Protocol/schemas/v0/*.json` (`thread`, `participant`, `evidence`, `claim`, `decision`, `audit_event`) — reuse them for append validation; reject invalid events fail-closed with `event_id` + `reason`.

### Phase 2 — Read cockpit (render the *shape*)
Read-only views of a thread's projected accountable state, built from the primitives:
- Thread header (question, status, participants/roles).
- Evidence / Assumptions / Claims panels.
- **Objections — with a "survived approval" badge** (the signature value the prototype lacks).
- Decision Request → Review → **Decision Record**; **Minority Report**; residual risks with owners/triggers.
- **Provenance trace / attribution** per contribution.
- **Audit chain** in the `Terminal` primitive, with `validate` / `replay` status badges (verified / degraded / failed signal colors).

### Phase 3 — Write cockpit (emit ClisTa events)
UI actions append validated events: `ThreadCreated`, `ParticipantAdded`, `EvidenceCommitted`, `AssumptionDeclared`, `ClaimMade`, `ObjectionRaised`, `DecisionRequested`, `ReviewSubmitted`, `DecisionRecorded`, `MinorityReportFiled`. Each append is validated-before-trust; the UI reflects fail-closed rejections inline. **Salvage Lokahi UX** (status stepper, audit trail, draft/review panels, the feedback-driven revision loop from `lokahi/src/main.jsx`) but rebind it from the flat draft/confirm to the protocol's Decision Request → Review → Decision Record objects, re-skinned to the design system.

### Phase 4 — Identity + multi-user
- Real participant identity on every event's `actor_id` (resolves Lokahi's hardcoded confirmer). **Sub-decision to confirm at this phase:** Cloudflare Access (fastest for a team), OAuth, or magic-link. Default recommendation: **Cloudflare Access** for the initial team-facing release, since the infra is already Cloudflare.
- An `IndexDO` (or KV) maintains the `thread_id → {title,status,owner}` map for the thread list and routing.

### Phase 5 — Cut over
- Point `cli.clista.ai`'s "this is a mock" toward the live `app.clista.ai`; link from `clista.ai` hero. Add `app` to the deploy pipeline beside the six surfaces (`website/deploy.sh` pattern / `deploy-website.yml`).

## Reuse (don't rebuild)
- **Engine:** `ClisTa-Protocol/src/{integrity,events,projector}.js` + `schemas/v0/*.json` — port, don't reimplement.
- **Design:** `launch-planning/website/shared/{styles,site}.css`, the 8 primitives, octopus marks, fonts — consume, don't redraw.
- **UX:** Lokahi `src/main.jsx` components (StatusStepper, AuditTrail, DraftDecision/ConfirmationBar, revision loop) — salvage and rebind.
- **Skills:** `durable-objects`, `cloudflare`, `wrangler`, `workers-best-practices`, `frontend-design`.

## Verification
- **Engine parity (anchor):** scenario-demo log ingested into a ThreadDO projects identically to ClisTa CLI `state show` / `decision summary`.
- **Validation:** an invalid event is rejected fail-closed with `event_id` + `reason`.
- **Integrity:** tampering a stored event breaks the hash chain and `validate` fails loudly.
- **Determinism:** re-projecting the same events yields identical state (clean-room replay parity).
- **E2E (browser MCP, like the Lokahi run):** `wrangler dev`, then drive `app.clista.ai` locally — create a thread, walk evidence → surviving objection → decision request → review → decision record → minority report, and confirm the audit chain validates and replays. Capture desktop + mobile snapshots.

## Open risks / notes
- **CJS → Workers bundle:** ClisTa is CommonJS with `fs`/`path`/`node:crypto`. Extract pure logic; strip filesystem; bundle a sync hash. Budget time for this port — it's the hardest part.
- **Determinism vs Web Crypto:** must keep hashing synchronous to preserve byte-identical replay (hence bundled sha256, not `subtle.digest`).
- **DO SQLite as event store** is a natural fit for append-only logs, but cross-thread reads (the index/list) need the separate IndexDO/KV — don't fan out across per-thread DOs for listing.
- **Scope of v1 object model:** target the bundled scenario's shape (the spine: thread, evidence/assumption/claim, surviving objection, decision request→review→record, minority report, provenance, audit chain). Federation / delegation / negotiation / learning are out of v1.
- This supersedes the prior "prototype → MVP" framing of Lokahi: Lokahi is not productized standalone; it is absorbed into `app.clista.ai`.
