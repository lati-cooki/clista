# Transfer / Handoff — building app.clista.ai (the ClisTa Protocol cockpit)

Paste this into a fresh session to resume without replaying the whole history.

## What we're doing
Building the missing UI for the ClisTa Protocol. Three repos are one system; the
owner kept re-deriving the engine because no attempt united rigor + a human surface.
Decision made: build a new app that is the live, interactive human cockpit OVER the
real ClisTa engine (event log = source of truth, UI projects state and emits ClisTa
events), wearing the existing clista.ai design system. It replaces the non-live mock
at cli.clista.ai. One-liner: "Here's a yes — now trace its shape."

## The repos (note: two GitHub accounts)
Both authenticated via gh; switch with `gh auth switch --user <name>`.
- lati-club/ClisTa-Protocol  (PUBLIC, owner: lati-club) — THE ENGINE. Append-only,
  hash-chained NDJSON events; deterministic projection; validation-before-trust
  (fail-closed). Key files to port: src/integrity.js (hash chain), src/events.js
  (event builders, minus fs), src/projector.js (projection), schemas/v0/*.json
  (thread/participant/evidence/claim/decision/audit_event), and the canonical sample
  log examples/scenario-demo/events.ndjson. Also src/cli.js, src/mcp_server.js.
- lati-cooki/clista-protocol-launch-planning  (PRIVATE, owner: lati-cooki — must
  `gh auth switch --user lati-cooki` to read) — THE DESIGN SYSTEM + 6 live Cloudflare
  Pages surfaces (clista.ai, cli/gate/runs/docs/learn). Reuse: website/shared/styles.css
  + site.css (tokens + components), DESIGN-SPEC.md, website/README.md,
  website/CLOUDFLARE.md. Monochrome by conviction; color only as protocol signal
  (verified/evidence/degraded/failed); fonts Jost / IBM Plex Sans / IBM Plex Mono;
  8 primitives Button/Badge/Card/Eyebrow/RuleDot/IconMedallion/NumberedStep/Terminal;
  octopus mark. cli.clista.ai is the mock the new app replaces.
- lati-club/lokahi  (PRIVATE, owner: lati-club; local /Users/troylatimer/Documents/Lokahi,
  branch master) — the prototype to SALVAGE UX from (StatusStepper, AuditTrail,
  DraftDecision/ConfirmationBar, the feedback-driven revision loop in src/main.jsx) but
  its engine (mutable SQLite status column) is dropped. Not productized standalone.
- lati-club/clista-ai-app  (PRIVATE, owner: lati-club; local
  /Users/troylatimer/Documents/clista-ai-app, branch main) — THE NEW APP REPO (this one),
  already created. Currently a placeholder: README.md + docs/PLAN.md + this HANDOFF.

## The plan (authoritative)
Full plan is docs/PLAN.md in this repo (also at
/Users/troylatimer/.claude/plans/playful-wobbling-otter.md). Read it first.
Architecture: Vite + React SPA -> Worker (router/auth, identity->actor_id) -> one
Durable Object PER THREAD holding that thread's append-only event log in its SQLite;
project()/validate()/summary() run in the Worker. A separate IndexDO (or KV) maps
thread_id -> {title,status,owner} for the list view. Phases 0-5 in the doc.

Key technical notes / risks:
- Engine is CommonJS using fs/path/node:crypto. Extract the PURE logic (integrity,
  events builders, projector, validators); strip filesystem; storage shell becomes DO
  SQLite (one row per event, append-only).
- Keep hashing SYNCHRONOUS (bundle a sync sha256, e.g. js-sha256 — NOT Web Crypto
  subtle.digest which is async) to preserve byte-identical deterministic replay.
- Trust anchor / first proof: ingest examples/scenario-demo/events.ndjson into a
  ThreadDO and assert its projection/summary equals ClisTa CLI `state show` /
  `decision summary` for the same log.
- v1 object-model scope = the bundled scenario's shape: thread, evidence/assumption/
  claim, SURVIVING objection, decision request->review->record, minority report,
  provenance, audit chain. Federation/delegation/negotiation/learning are out of v1.
- Deploy as app.clista.ai (new Cloudflare Pages/Worker project + custom domain, one
  more *.clista.ai wildcard; follow launch-planning/website/CLOUDFLARE.md §2-3).
- Skills to use: durable-objects, cloudflare, wrangler, workers-best-practices,
  frontend-design.

## Where we are / immediate next step
A UI design brief was written for Claude's design tool (claude.ai/design); the owner is
bringing back the generated design. WAIT for that design, THEN start Phase 0: scaffold
Vite + React + Worker + Durable Objects in this repo, port the clista.ai design system +
the returned components (build the 8 primitives as React components), stand up a
hello-world at app.clista.ai. Then Phase 1: port the engine into the ThreadDO and prove
scenario-demo parity. Do NOT rebuild the engine or re-skin from scratch — port and reuse.

The design brief covers: monochrome + signal palette, the three type voices, the 8
primitives, and the hero "Thread Cockpit" screen that renders a decision's
accountability structure (evidence, assumptions, claims, SURVIVING objections, decision
record, minority report, provenance, audit-chain Terminal with validate/replay badges) —
plus Thread Index and Compose flows, using the concrete "support-assistant beta" sample
decision. Must feel like an instrument / verifiable record, not a SaaS dashboard.
Ask the owner for the design output before scaffolding.
