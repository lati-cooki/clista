# Portfolio Dashboard — Design Spec

**Date:** 2026-07-14
**Status:** Approved (design), pending implementation plan
**Scope:** A cross-thread governance dashboard for `clista-ai-app` (app.clista.ai)

## Problem

Every decision thread in ClisTa is an append-only, hash-chained event log with
rich, typed structure (claims, evidence, objections, assumptions, positions,
reviews, decisions). The protocol ships strong *per-thread* analysis, but there
is no *cross-thread* view. A governance stakeholder (risk committee, decision
owners) cannot see portfolio health at a glance: what is blocked, contested,
overdue, or decided-with-conditions across all threads.

Today the only cross-thread surface is the **Thread Index** — a flat list of
lite cards (`id, title, question, status, owner, events, last`). It answers
"what threads exist," not "what needs oversight."

## Goal

A read-only **Portfolio** screen: an **attention-triage banner** on top of a
**lifecycle pipeline**, with dense per-thread cards, that lets a governance
overseer understand portfolio health in ~5 seconds and drill into any thread's
existing cockpit.

Non-goals for v1: historical trend charts, search/filter beyond lifecycle
stage, CSV/PDF export, per-owner rollups, any write path. This surface computes
over the ledger and writes nothing.

## Key insight (why this is cheap)

`ThreadDO.indexCard()` (`app/worker/thread-do.js`) **already projects the full
thread state** on every index update — `engine.selectThreadState(engine.projectEvents(events))`
— then discards everything except 8 lite fields. The health signals this
dashboard needs are already computed; they are simply thrown away. Enriching the
card is therefore near-zero added cost, and it benefits the existing Thread Index
as well.

## Architecture — Approach A (enrich the index card)

```
ThreadDO.indexCard()  ──enriched card──►  IndexDO.upsert (threads table + new cols)
      │ (full projection, already computed)                      │
      │                                                          ▼
      └──────────────────────────────────────►  GET /api/portfolio  ──►  Portfolio screen (React)
                                                 { summary, threads[] }        (one fetch)
```

- **Signals computed server-side** in `indexCard()`, where the full projection
  already exists — no second projection, no fan-out per request.
- **IndexDO** stores the signals as nullable columns; populated on every append
  (the existing `registerThread` write path). Existing threads backfill on their
  next append; a one-shot re-register sweep populates them immediately.
- **One client fetch** (`GET /api/portfolio`) returns all enriched cards plus a
  precomputed summary. Scales without N+1.

Rejected alternatives:
- **C — aggregate-on-read** (fan out to all ThreadDOs per request): no schema
  migration, always fresh, but fan-out cost grows with thread count and adds
  worker plumbing. Kept as the fallback if touching the index write path proves
  risky.
- **B — client-side aggregation** (browser fetches each `/state`): N+1 fetches
  that grow, logic stuck in the client. Throwaway-prototype only.

## Data model — enriched card

Each thread's card gains these fields, all **derived from the existing
projection** (no new event types, no protocol change):

| Field | Type | Source | Governance meaning |
|---|---|---|---|
| `stage` | enum | `thread.status` + `decisionStatus.decisionRecord` | `active` / `in_review` / `decided` / `decided_with_conditions` / `re_review` / `degraded` / `failed` |
| `open_objections` | int | objections with status `open` or `preserved` | dissent that survived |
| `evidence_count` | int | `state.allEvidence.length` | is any evidence committed? |
| `claims_total` | int | `state.claims.length` | reasoning surface |
| `claims_grounded` | int | claims with non-empty `evidenceIds` | claims actually backed by evidence (catches "evidence exists but unlinked") |
| `outstanding_conditions` | int | `decisionRecord.conditions.length` (when decided-with-conditions) | how many conditions ride on the call |
| `staleness_days` | number | `now − last_event_ms` | age of last activity |
| `overdue` | bool | `stage === in_review && staleness_days > OVERDUE_DAYS` | stuck-in-review detector |
| `re_review` | bool | IndexDO re-review flag / `stage === re_review` | a decided thread got a post-decision objection |
| `chain_valid` | bool | `engine.verifyEventIntegrity` + `validateEvents` | trust anchor; should be true everywhere |

`OVERDUE_DAYS` default: **7** (single named constant, easy to tune).

### Stage derivation (precedence, first match wins)
1. `failed` / `degraded` — if projection surfaces an invalid or degraded state.
2. `re_review` — re-review flag set (post-decision objection on a decided thread).
3. `decided_with_conditions` — decisionRecord exists and `conditions.length > 0`.
4. `decided` — decisionRecord exists, no conditions.
5. `in_review` — an open decision request exists, no decision record.
6. `active` — otherwise.

## Attention model

A thread appears in the top banner if it trips any trigger. Triggers, in rank
order (a thread lists under every trigger it trips; ranking decides banner
ordering and the "primary" chip):

1. **Re-review** — `re_review === true`.
2. **Contested** — `open_objections > 0`.
3. **Overdue** — `overdue === true`.
4. **Unevidenced** — `stage ∈ {in_review, decided, decided_with_conditions}` and
   `claims_grounded === 0` (no claim is backed by evidence).
5. **With-conditions** — `outstanding_conditions > 0`.

Anything tripping no trigger is **healthy**. A special banner state: if
`chain_valid === false` for any thread, that is an **integrity alarm** shown
above all triage groups (this should never fire; if it does, it is the most
important thing on the page).

## API

`GET /api/portfolio` (authenticated; same identity gate as `/api/threads`):

```json
{
  "summary": {
    "total": 17,
    "byStage": { "active": 3, "in_review": 5, "decided": 7, "decided_with_conditions": 4, "re_review": 0, "degraded": 0, "failed": 0 },
    "attention": { "re_review": 0, "contested": 2, "overdue": 1, "unevidenced": 3, "with_conditions": 4 },
    "allChainValid": true
  },
  "threads": [ /* enriched cards, see data model */ ]
}
```

- Served from IndexDO stored columns (no per-request fan-out).
- `summary` counts computed from the stored cards at read time (cheap; N≈tens).
- The existing `GET /api/threads` list endpoint continues to work; it MAY return
  the same enriched cards (the extra fields are additive and ignorable by the
  current Thread Index).

## UI — new Portfolio screen

New sidebar item **Portfolio** (above or beside Thread Index; Thread Index
stays as the plain list). No routing — screen is React state, consistent with
the existing app (navigate by sidebar button).

```
┌ PORTFOLIO ─────────────────────────────── 17 threads · chain ✓ all ─┐
│ ⚠ NEEDS ATTENTION                                                    │
│  RE-REVIEW(0)  CONTESTED(2)  OVERDUE(1)  UNEVIDENCED(3)  W/COND(4)   │
│  [thd_csv_cli · 2 obj]  [thd_mrm · review 11d]  [thd_decide · 0 evd] │
├─ PIPELINE ──────────────────────────────────────────────────────────┤
│  ACTIVE(3)   │  IN REVIEW(5) │  DECIDED(7)      │  RE-REVIEW(0)       │
│  ┌─────────┐ │  ┌─────────┐  │  ┌─────────┐     │                    │
│  │title    │ │  │title    │  │  │title  ✓ │     │                    │
│  │◇1 ⚠0 ▪2 │ │  │◇0 ⚠1 ▪5 │  │  │cond·4   │     │                    │
│  │owner 2d │ │  │owner 11d│  │  │owner    │     │                    │
│  └─────────┘ │  └─────────┘  │  └─────────┘     │                    │
└──────────────┴───────────────┴──────────────────┴────────────────────┘
```

- **Header:** total threads + global chain-valid indicator.
- **Attention banner:** the five triggers with counts; clickable chips for the
  specific threads under each. Integrity alarm renders here (red) if any chain
  is invalid.
- **Pipeline:** columns by lifecycle stage (Active, In Review, Decided,
  Re-review; decided-with-conditions rendered within Decided, badged). Each
  card is dense: title, objection/evidence/condition glyphs, owner, staleness,
  chain tick.
- **Interaction:** click a card or an attention chip → existing cockpit for that
  thread. Read-only; no inline mutation.
- **Styling:** reuse the existing app's CSS-in-JS conventions (`lib/css.js`,
  `styles.js`, mono/Inter type scale) so it matches the cockpit/index.

## Components & boundaries

- `app/worker/thread-do.js` — extend `indexCard()` to compute + return the new
  signals. Single responsibility unchanged (project → card); it just keeps more
  of what it already computed. This is the only place signals are derived.
- `app/worker/index-do.js` — add nullable columns to the `threads` table and to
  `upsert`; add a `portfolio()` read that returns stored cards + summary. Schema
  migration follows the existing back-fill-columns pattern already in the file.
- `app/worker/index.js` — route `GET /api/threads/portfolio` (or `/api/portfolio`)
  to `IndexDO.portfolio()`.
- `app/src/screens/Portfolio.jsx` — new screen; presentation only, consumes
  `/api/portfolio`. No signal logic in the client (it renders what the server
  derived).
- `app/src/api.js`, `app/src/App.jsx`, sidebar — wire the new screen + fetch.

Each unit is independently testable: signal derivation (pure, over a projected
state), the endpoint (returns stored shape), the screen (renders a fixture).

## Testing

- **Signal derivation** (`indexCard` enrichment): unit tests over crafted event
  logs — a contested thread, an unevidenced decided thread, a decided-with-
  conditions thread, an overdue in-review thread — assert each signal + derived
  `stage`. Mirror `app/test/events.test.js` style (build logs via the shared
  builders, project through the real engine).
- **Attention model:** table-driven test mapping a card → expected trigger set.
- **Endpoint:** worker test (vitest) asserting `/api/portfolio` returns
  `{ summary, threads }` with correct counts for a seeded multi-thread fixture
  (the examples registry already provides multi-thread logs, e.g.
  `pharma-phase-gate-multithreaded`).
- **Screen:** render against a fixture payload; assert triage counts and
  pipeline columns. (Follows the project verify skill for end-to-end drive.)

## Migration & rollout

1. Ship enriched `indexCard()` + IndexDO columns (backward-compatible; new
   fields nullable).
2. One-shot re-register sweep to backfill existing threads' signals (re-project
   each and upsert). Existing threads otherwise backfill on their next append.
3. Ship `/api/portfolio` + Portfolio screen.
4. Deploy to staging → verify → production (same flow used for the evidence
   feature).

## Open questions (resolve during planning, not blockers)

- Exact endpoint path (`/api/portfolio` vs `/api/threads/portfolio`) — align
  with existing routing conventions in `index.js`.
- Whether `degraded` / `failed` are reachable stages in the current projection
  or aspirational — confirm against `decisionStatus` before wiring the badge.
- Condition **discharge** is not modeled by the protocol today, so
  `outstanding_conditions` counts *carried* conditions, not *undischarged* ones.
  Acceptable for v1; note it in the UI copy so overseers aren't misled.
