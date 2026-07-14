# Portfolio Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only cross-thread **Portfolio** dashboard to `clista-ai-app` — an attention-triage banner over a lifecycle pipeline — so a governance overseer sees portfolio health at a glance and drills into any thread's cockpit.

**Architecture:** Approach A (enrich the index card). `ThreadDO.indexCard()` already projects full thread state on every index update; we compute health signals there (via a new pure module) and persist them as nullable columns on `IndexDO`. A single `GET /api/portfolio` returns enriched cards plus a precomputed summary. A new React `Portfolio` screen renders it. No new protocol event types; nothing is written to any ledger.

**Tech Stack:** Cloudflare Workers + Durable Objects (SQLite), the in-repo ClisTa engine (`app/worker/engine`), React 19 (no router — screens are `App.jsx` state), CSS-in-JS (`lib/css.js`). Tests: `node --test` for pure logic, `vitest` + `@cloudflare/vitest-pool-workers` for the in-runtime worker path.

## Global Constraints

- **`OVERDUE_DAYS = 7`** — single named constant; a thread in `in_review` older than this is `overdue`.
- **Read-only** — no new event types, no writes to any thread ledger. The dashboard computes over existing projections.
- **Endpoint path** is **`/api/portfolio`** (not `/api/threads/portfolio`, which would collide with the thread-id route branch).
- **No new dependencies.** Reuse existing engine, `lib/css.js`, `Hoverable`, `Svg`, `icons.js`, `styles.js`.
- **Signals module stays engine-free** (pure functions over an already-projected `state` / stored rows) so it is unit-testable under plain `node --test`.
- New worker files use **ESM** (`import`/`export`), matching `thread-do.js` / `index-do.js`.
- Commit messages end with the repo's `Co-Authored-By` trailer.

## File Structure

- **Create** `app/worker/portfolio-signals.js` — pure module: `OVERDUE_DAYS`, `deriveStage`, `deriveSignals`, `buildCard`, `computeTiming`, `deriveAttention`, `summarize`, `assemblePortfolio`. No engine import. One responsibility: turn a projected state (or stored rows) into health signals / an assembled portfolio.
- **Modify** `app/worker/thread-do.js` — `indexCard()` delegates to `buildCard()` (adds signals + chain-validity).
- **Modify** `app/worker/index-do.js` — nullable signal columns (+ constructor back-fill), `upsert()` persists them, new `portfolio()` read that returns `assemblePortfolio(rows, now)`.
- **Modify** `app/worker/index.js` — route `GET /api/portfolio` → `IndexDO.portfolio()`, and `POST /api/portfolio/rebuild` → one-shot backfill sweep.
- **Modify** `app/src/api.js` — `portfolio()` + `rebuildPortfolio()` client calls.
- **Create** `app/src/screens/Portfolio.jsx` — new screen (presentation only; renders what the server derived).
- **Modify** `app/src/App.jsx` — nav item + render branch for the Portfolio screen.
- **Create** `app/test/portfolio-signals.test.js` — `node --test` unit tests for the pure module.
- **Create** `app/test/workers/portfolio.test.js` — `vitest` in-runtime end-to-end test for `/api/portfolio`.

---

### Task 1: Pure signal module

**Files:**
- Create: `app/worker/portfolio-signals.js`
- Test: `app/test/portfolio-signals.test.js`

**Interfaces:**
- Consumes: nothing (pure; reads plain projected-`state` objects and stored `row` objects).
- Produces (used by Tasks 2–4):
  - `OVERDUE_DAYS: number` (= 7)
  - `deriveStage(state) -> 'active'|'in_review'|'decided'|'decided_with_conditions'|'re_review'|'degraded'|'failed'`
  - `deriveSignals(state, { chainValid }) -> { stage, open_objections, evidence_count, claims_total, claims_grounded, outstanding_conditions, re_review, chain_valid }`
  - `buildCard(state, { chainValid, eventCount, lastTimestamp }) -> card` (lite fields `id,title,question,status,owner,events,last,updated_ms` + the `deriveSignals` bag)
  - `computeTiming(stage, updatedMs, nowMs) -> { staleness_days, overdue }`
  - `deriveAttention(card) -> string[]` (subset/order of `['re_review','contested','overdue','unevidenced','with_conditions']`)
  - `summarize(cards) -> { total, byStage, attention, allChainValid }`
  - `assemblePortfolio(rows, nowMs) -> { summary, threads }`

- [ ] **Step 1: Write the failing test**

Create `app/test/portfolio-signals.test.js`:

```js
// Unit tests for the pure portfolio-signals module. No engine, no DO — plain
// projected-state and stored-row literals in, health signals out.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERDUE_DAYS, deriveStage, deriveSignals, buildCard,
  computeTiming, deriveAttention, summarize, assemblePortfolio,
} from '../worker/portfolio-signals.js';

const state = (over = {}) => ({
  thread: { id: 'thd_x', title: 'T', question: 'Q?', status: 'active', updatedAt: '2026-07-10T00:00:00.000Z', ...(over.thread || {}) },
  identityState: { participants: [{ id: 'par_o', name: 'Owner', role: 'decision owner' }] },
  claims: over.claims || [],
  allEvidence: over.allEvidence || [],
  unresolvedObjections: over.unresolvedObjections || [],
  decisionStatus: { decisionRecord: over.decisionRecord || null },
});

test('deriveStage maps status + conditions to a lifecycle stage', () => {
  assert.equal(deriveStage(state()), 'active');
  assert.equal(deriveStage(state({ thread: { status: 'review' } })), 'in_review');
  assert.equal(deriveStage(state({ thread: { status: 're-review' } })), 're_review');
  assert.equal(deriveStage(state({ thread: { status: 'decided' }, decisionRecord: { conditions: [] } })), 'decided');
  assert.equal(deriveStage(state({ thread: { status: 'decided' }, decisionRecord: { conditions: ['c1'] } })), 'decided_with_conditions');
  assert.equal(deriveStage(state({ thread: { status: 'failed' } })), 'failed');
});

test('deriveSignals counts objections, evidence, grounded claims, conditions', () => {
  const s = state({
    thread: { status: 'decided' },
    claims: [{ id: 'clm_1', evidenceIds: ['evd_1'] }, { id: 'clm_2', evidenceIds: [] }],
    allEvidence: [{ id: 'evd_1' }],
    unresolvedObjections: [{ id: 'obj_1' }],
    decisionRecord: { conditions: ['a', 'b'] },
  });
  const sig = deriveSignals(s, { chainValid: true });
  assert.equal(sig.stage, 'decided_with_conditions');
  assert.equal(sig.open_objections, 1);
  assert.equal(sig.evidence_count, 1);
  assert.equal(sig.claims_total, 2);
  assert.equal(sig.claims_grounded, 1);
  assert.equal(sig.outstanding_conditions, 2);
  assert.equal(sig.re_review, false);
  assert.equal(sig.chain_valid, true);
});

test('buildCard merges lite fields with signals and owner name', () => {
  const card = buildCard(state({ thread: { status: 'review' } }), { chainValid: true, eventCount: 5, lastTimestamp: '2026-07-10T00:00:00.000Z' });
  assert.equal(card.id, 'thd_x');
  assert.equal(card.owner, 'Owner');
  assert.equal(card.events, 5);
  assert.equal(card.stage, 'in_review');
  assert.equal(card.updated_ms, Date.parse('2026-07-10T00:00:00.000Z'));
});

test('computeTiming flags an overdue in-review thread past OVERDUE_DAYS', () => {
  const now = Date.parse('2026-07-20T00:00:00.000Z');
  const old = Date.parse('2026-07-01T00:00:00.000Z'); // 19 days
  assert.equal(computeTiming('in_review', old, now).overdue, true);
  assert.equal(computeTiming('decided', old, now).overdue, false); // only in_review is "overdue"
  assert.equal(computeTiming('in_review', now, now).overdue, false);
  assert.equal(computeTiming('in_review', 0, now).staleness_days, null);
  assert.ok(OVERDUE_DAYS === 7);
});

test('deriveAttention lists every tripped trigger in rank order', () => {
  assert.deepEqual(deriveAttention({ stage: 'in_review', open_objections: 2, overdue: true, claims_grounded: 0, outstanding_conditions: 0, re_review: false }),
    ['contested', 'overdue', 'unevidenced']);
  assert.deepEqual(deriveAttention({ stage: 'decided_with_conditions', open_objections: 0, overdue: false, claims_grounded: 1, outstanding_conditions: 3, re_review: false }),
    ['with_conditions']);
  assert.deepEqual(deriveAttention({ stage: 'active', open_objections: 0, overdue: false, claims_grounded: 1, outstanding_conditions: 0, re_review: false }), []);
});

test('assemblePortfolio adds timing + attention and summarizes', () => {
  const now = Date.parse('2026-07-20T00:00:00.000Z');
  const rows = [
    { id: 'a', stage: 'in_review', status: 'review', updated_ms: Date.parse('2026-07-01T00:00:00.000Z'), open_objections: 1, claims_grounded: 0, outstanding_conditions: 0, re_review: 0, chain_valid: 1 },
    { id: 'b', stage: 'decided', status: 'decided', updated_ms: now, open_objections: 0, claims_grounded: 2, outstanding_conditions: 0, re_review: 0, chain_valid: 1 },
  ];
  const { summary, threads } = assemblePortfolio(rows, now);
  assert.equal(summary.total, 2);
  assert.equal(summary.byStage.in_review, 1);
  assert.equal(summary.byStage.decided, 1);
  assert.equal(summary.attention.contested, 1);
  assert.equal(summary.attention.overdue, 1);   // 'a' is 19 days old in review
  assert.equal(summary.allChainValid, true);
  assert.ok(threads[0].attention.includes('contested'));
  assert.equal(threads[0].chain_valid, true);    // 1 → true
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && node --test test/portfolio-signals.test.js`
Expected: FAIL — `Cannot find module '../worker/portfolio-signals.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/worker/portfolio-signals.js`:

```js
// Pure health-signal derivation for the Portfolio dashboard. No engine, no DO:
// callers pass an already-projected `state` (ThreadDO.indexCard) or stored `rows`
// (IndexDO.portfolio). Kept pure so it unit-tests under plain `node --test`.

export const OVERDUE_DAYS = 7;
const DAY_MS = 86400000;
const STAGES = ['active', 'in_review', 'decided', 'decided_with_conditions', 're_review', 'degraded', 'failed'];
const ATTENTION = ['re_review', 'contested', 'overdue', 'unevidenced', 'with_conditions'];

// Lifecycle stage from the projected thread status (+ conditions splits decided).
export function deriveStage(state) {
  const status = (state.thread && state.thread.status) || 'active';
  if (status === 'failed') return 'failed';
  if (status === 'degraded') return 'degraded';
  if (status === 're-review') return 're_review';
  if (status === 'decided') {
    const d = state.decisionStatus && state.decisionStatus.decisionRecord;
    return d && Array.isArray(d.conditions) && d.conditions.length > 0 ? 'decided_with_conditions' : 'decided';
  }
  if (status === 'review') return 'in_review';
  return 'active';
}

// Time-invariant signals (staleness/overdue are computed at read, see computeTiming).
export function deriveSignals(state, { chainValid }) {
  const stage = deriveStage(state);
  const claims = state.claims || [];
  const decision = state.decisionStatus && state.decisionStatus.decisionRecord;
  return {
    stage,
    open_objections: (state.unresolvedObjections || []).length,
    evidence_count: (state.allEvidence || []).length,
    claims_total: claims.length,
    claims_grounded: claims.filter((c) => (c.evidenceIds || []).length > 0).length,
    outstanding_conditions: decision && Array.isArray(decision.conditions) ? decision.conditions.length : 0,
    re_review: stage === 're_review',
    chain_valid: chainValid,
  };
}

// Full index card: the lite fields (mirrors the pre-existing indexCard) + signals.
export function buildCard(state, { chainValid, eventCount, lastTimestamp }) {
  const thread = state.thread || {};
  const participants = (state.identityState && state.identityState.participants) || [];
  const decision = state.decisionStatus && state.decisionStatus.decisionRecord;
  const ownerId =
    (decision && decision.decidedByParticipantId) ||
    (participants.find((p) => /owner/.test(p.role || '')) || participants[0] || {}).id;
  const ownerName = (participants.find((p) => p.id === ownerId) || {}).name || ownerId || 'unknown';
  const last = lastTimestamp || thread.updatedAt || null;
  return {
    id: thread.id || null,
    title: thread.title || null,
    question: thread.question || null,
    status: thread.status || 'active',
    owner: ownerName,
    events: eventCount,
    last,
    updated_ms: last ? Date.parse(last) : 0,
    ...deriveSignals(state, { chainValid }),
  };
}

// Read-time timing: staleness is a function of "now", so it is never stored.
export function computeTiming(stage, updatedMs, nowMs) {
  const staleness_days = updatedMs ? Math.max(0, (nowMs - updatedMs) / DAY_MS) : null;
  const overdue = stage === 'in_review' && staleness_days != null && staleness_days > OVERDUE_DAYS;
  return { staleness_days, overdue };
}

// Attention triggers a card trips, in rank order.
export function deriveAttention(card) {
  const t = [];
  if (card.re_review) t.push('re_review');
  if ((card.open_objections || 0) > 0) t.push('contested');
  if (card.overdue) t.push('overdue');
  if (['in_review', 'decided', 'decided_with_conditions'].includes(card.stage) && (card.claims_grounded || 0) === 0) t.push('unevidenced');
  if ((card.outstanding_conditions || 0) > 0) t.push('with_conditions');
  return t;
}

export function summarize(cards) {
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0]));
  const attention = Object.fromEntries(ATTENTION.map((a) => [a, 0]));
  let allChainValid = true;
  for (const c of cards) {
    if (byStage[c.stage] != null) byStage[c.stage] += 1;
    for (const a of c.attention || []) attention[a] += 1;
    if (c.chain_valid === false) allChainValid = false;
  }
  return { total: cards.length, byStage, attention, allChainValid };
}

// Stored rows -> the wire shape the Portfolio screen consumes. Normalizes the
// SQLite integer booleans and adds read-time timing + attention.
export function assemblePortfolio(rows, nowMs) {
  const threads = rows.map((r) => {
    const stage = r.stage || r.status || 'active';
    const { staleness_days, overdue } = computeTiming(stage, r.updated_ms || 0, nowMs);
    const card = {
      ...r,
      stage,
      re_review: !!r.re_review,
      chain_valid: r.chain_valid == null ? null : !!r.chain_valid,
      staleness_days,
      overdue,
    };
    return { ...card, attention: deriveAttention(card) };
  });
  return { summary: summarize(threads), threads };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && node --test test/portfolio-signals.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/worker/portfolio-signals.js app/test/portfolio-signals.test.js
git commit -m "feat(portfolio): pure health-signal derivation module

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Wire ThreadDO.indexCard() to buildCard

**Files:**
- Modify: `app/worker/thread-do.js` (imports + `indexCard()` body, ~lines 1-2 and 183-205)

**Interfaces:**
- Consumes: `buildCard(state, { chainValid, eventCount, lastTimestamp })` from Task 1; `engine.{selectThreadState,projectEvents,verifyEventIntegrity,validateEvents}` (already imported).
- Produces: `ThreadDO.indexCard()` now returns the enriched card (lite fields + signals). Same call site (`registerThread`) — additive fields only.

- [ ] **Step 1: Add the import**

In `app/worker/thread-do.js`, directly under the existing engine import (line 2), add:

```js
import { buildCard } from './portfolio-signals.js';
```

- [ ] **Step 2: Replace the `indexCard()` body**

Replace the entire existing `indexCard()` method (currently lines ~183-205) with:

```js
  indexCard() {
    const events = this._readAll();
    if (!events.length) return null;
    const state = engine.selectThreadState(engine.projectEvents(events));
    const integrity = engine.verifyEventIntegrity(events, { strict: events.length > 0 });
    const validation = engine.validateEvents(events);
    const lastTimestamp = (state.thread && state.thread.updatedAt) || events.at(-1)?.timestamp || null;
    return buildCard(state, {
      chainValid: integrity.valid && validation.valid,
      eventCount: events.length,
      lastTimestamp,
    });
  }
```

- [ ] **Step 3: Verify existing tests still pass (no regression)**

Run: `cd app && npm test`
Expected: PASS — all existing `node --test` suites (events, adapt, notify, examples-registry) plus the new `portfolio-signals` suite. (This step has no new node test; `indexCard()` is exercised end-to-end by the Task 3 worker test. `buildCard` itself is covered by Task 1.)

- [ ] **Step 4: Commit**

```bash
git add app/worker/thread-do.js
git commit -m "feat(portfolio): enrich ThreadDO.indexCard with health signals

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: IndexDO columns + portfolio() + API route + client + end-to-end test

**Files:**
- Modify: `app/worker/index-do.js` (import; constructor back-fill; `upsert()`; new `portfolio()`)
- Modify: `app/worker/index.js` (two routes near the `GET /api/threads` list route, ~line 569)
- Modify: `app/src/api.js` (two client methods)
- Test: `app/test/workers/portfolio.test.js`

**Interfaces:**
- Consumes: `assemblePortfolio(rows, nowMs)` from Task 1; `ThreadDO.indexCard()` from Task 2; existing `indexStub(env)`, `threadStub(env, id)`, `resolveIdentity`, `json` in `index.js`.
- Produces:
  - `IndexDO.portfolio() -> { summary, threads }`
  - `GET /api/portfolio -> { summary, threads }`
  - `POST /api/portfolio/rebuild -> { ok, rebuilt }` (authenticated)
  - `api.portfolio()`, `api.rebuildPortfolio()` client calls

- [ ] **Step 1: Write the failing end-to-end test**

Create `app/test/workers/portfolio.test.js`:

```js
// In-runtime end-to-end test for the Portfolio API. Seeds a decided thread and a
// contested thread through the real Worker, then asserts /api/portfolio returns
// enriched cards + summary, and that the rebuild sweep backfills the index.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const ACTOR = 'par_troylati';
const iso = () => new Date().toISOString();
const post = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, { method: 'POST', headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
const get = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const append = (id, event) => post(`/api/threads/${id}/append`, { event });

describe('portfolio dashboard API', () => {
  it('serves enriched cards + summary, and rebuild backfills the index', async () => {
    // A decided thread (bundled canonical log) — real evidence + decision.
    await post('/api/threads/thd_scenario_demo/seed-demo', {});

    // A contested thread: claim + open objection on it.
    const id = (await (await post('/api/threads', { question: 'Is the portfolio contested path visible?' })).json()).id;
    await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: 'clm_pf', object: 'claim', threadId: id, text: 'A claim to contest for the portfolio test.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } });
    await append(id, { event_type: 'ObjectionRaised', payload: { objection: { id: 'obj_pf', object: 'objection', threadId: id, participantId: ACTOR, targetObjectId: 'clm_pf', targetObjectType: 'claim', text: 'A recorded challenge for the portfolio test.', status: 'open', raisedAt: iso() } } });

    const res = await get('/api/portfolio');
    expect(res.status).toBe(200);
    const data = await res.json();

    // Shape.
    expect(data.summary).toBeTruthy();
    expect(Array.isArray(data.threads)).toBe(true);
    expect(data.summary.total).toBeGreaterThanOrEqual(2);
    expect(data.summary.allChainValid).toBe(true);

    // Contested thread carries the right signals + attention trigger.
    const contested = data.threads.find((t) => t.id === id);
    expect(contested).toBeTruthy();
    expect(contested.open_objections).toBeGreaterThanOrEqual(1);
    expect(contested.chain_valid).toBe(true);
    expect(contested.attention).toContain('contested');

    // Decided thread projects to a decided stage with real evidence.
    const decided = data.threads.find((t) => t.id === 'thd_scenario_demo');
    expect(decided).toBeTruthy();
    expect(['decided', 'decided_with_conditions']).toContain(decided.stage);
    expect(decided.evidence_count).toBeGreaterThan(0);

    // Rebuild sweep re-projects every registered thread.
    const rb = await (await post('/api/portfolio/rebuild', {})).json();
    expect(rb.ok).toBe(true);
    expect(rb.rebuilt).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npm run test:workers -- portfolio`
Expected: FAIL — `GET /api/portfolio` returns 404 (route not defined) so `data.summary` is undefined.

- [ ] **Step 3a: Add the IndexDO import + column back-fill**

In `app/worker/index-do.js`, add the import at the top (under the existing `import { DurableObject }` line):

```js
import { assemblePortfolio } from './portfolio-signals.js';
```

In the constructor, immediately AFTER the existing hidden-column back-fill line
(`if (!threadCols.has('hidden')) this.sql.exec('ALTER TABLE threads ADD COLUMN hidden INTEGER DEFAULT 0');`),
add:

```js
    // Portfolio health-signal columns (nullable; back-filled on next append, or
    // in bulk via POST /api/portfolio/rebuild). ADD COLUMN is a no-op once present.
    for (const [name, decl] of [
      ['stage', 'TEXT'],
      ['open_objections', 'INTEGER'],
      ['evidence_count', 'INTEGER'],
      ['claims_total', 'INTEGER'],
      ['claims_grounded', 'INTEGER'],
      ['outstanding_conditions', 'INTEGER'],
      ['re_review', 'INTEGER'],
      ['chain_valid', 'INTEGER'],
    ]) {
      if (!threadCols.has(name)) this.sql.exec(`ALTER TABLE threads ADD COLUMN ${name} ${decl}`);
    }
```

- [ ] **Step 3b: Extend `upsert()` to persist the signals**

Replace the entire existing `upsert(card)` method with:

```js
  upsert(card) {
    if (!card || !card.id) return { ok: false };
    this.sql.exec(
      `INSERT INTO threads (id, title, question, status, owner, events, last, updated_ms,
         stage, open_objections, evidence_count, claims_total, claims_grounded, outstanding_conditions, re_review, chain_valid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, question=excluded.question, status=excluded.status,
         owner=excluded.owner, events=excluded.events, last=excluded.last, updated_ms=excluded.updated_ms,
         stage=excluded.stage, open_objections=excluded.open_objections, evidence_count=excluded.evidence_count,
         claims_total=excluded.claims_total, claims_grounded=excluded.claims_grounded,
         outstanding_conditions=excluded.outstanding_conditions, re_review=excluded.re_review, chain_valid=excluded.chain_valid`,
      card.id,
      card.title ?? null,
      card.question ?? null,
      card.status ?? 'active',
      card.owner ?? null,
      card.events ?? 0,
      card.last ?? null,
      card.updated_ms ?? 0,
      card.stage ?? null,
      card.open_objections ?? null,
      card.evidence_count ?? null,
      card.claims_total ?? null,
      card.claims_grounded ?? null,
      card.outstanding_conditions ?? null,
      card.re_review == null ? null : card.re_review ? 1 : 0,
      card.chain_valid == null ? null : card.chain_valid ? 1 : 0
    );
    return { ok: true };
  }
```

- [ ] **Step 3c: Add the `portfolio()` read method**

In `app/worker/index-do.js`, add this method to the `IndexDO` class (e.g. directly after `list(...)`):

```js
  // The portfolio projection: every visible thread's enriched card + a summary.
  // Time-relative signals (staleness/overdue) and attention are computed at read.
  portfolio() {
    const rows = this.sql
      .exec(
        `SELECT id, title, question, status, owner, events, last, updated_ms,
                stage, open_objections, evidence_count, claims_total, claims_grounded,
                outstanding_conditions, re_review, chain_valid
         FROM threads WHERE COALESCE(hidden, 0) = 0 ORDER BY updated_ms DESC`
      )
      .toArray();
    return assemblePortfolio(rows, Date.now());
  }
```

- [ ] **Step 3d: Add the API routes**

In `app/worker/index.js`, directly AFTER the `GET /api/threads` list route block
(the `if (parts[1] === 'threads' && !parts[2] && request.method === 'GET')` block, ~line 569-571), add:

```js
        // GET /api/portfolio — the cross-thread governance dashboard projection.
        if (parts[1] === 'portfolio' && !parts[2] && request.method === 'GET') {
          return json(await indexStub(env).portfolio());
        }

        // POST /api/portfolio/rebuild — one-shot backfill: re-project every
        // registered thread's index card so pre-existing threads gain signals.
        if (parts[1] === 'portfolio' && parts[2] === 'rebuild' && request.method === 'POST') {
          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          const listed = await indexStub(env).list(true);
          let rebuilt = 0;
          for (const t of listed.threads || []) {
            const card = await threadStub(env, t.id).indexCard();
            if (card && card.id) {
              await indexStub(env).upsert(card);
              rebuilt += 1;
            }
          }
          return json({ ok: true, rebuilt });
        }
```

- [ ] **Step 3e: Add the client methods**

In `app/src/api.js`, add to the `api` object (e.g. after `listThreads`):

```js
  portfolio: () => req('/api/portfolio'),
  rebuildPortfolio: () => req('/api/portfolio/rebuild', { method: 'POST' }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npm run test:workers -- portfolio`
Expected: PASS — the portfolio end-to-end test.

- [ ] **Step 5: Commit**

```bash
git add app/worker/index-do.js app/worker/index.js app/src/api.js app/test/workers/portfolio.test.js
git commit -m "feat(portfolio): IndexDO signals + /api/portfolio endpoint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Portfolio screen + nav wiring

**Files:**
- Create: `app/src/screens/Portfolio.jsx`
- Modify: `app/src/App.jsx` (import, `NAV` entry, render branch)

**Interfaces:**
- Consumes: `api.portfolio()` (Task 3) → `{ summary, threads }`; `openThread(id)` and `me` props from `App.jsx`; existing `css`, `Svg`, `Hoverable`, `ico`, `badgeFor`, `relativeTime`.
- Produces: a `Portfolio` screen mounted at `screen === 'portfolio'`.

- [ ] **Step 1: Create the screen**

Create `app/src/screens/Portfolio.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { css } from '../lib/css.js';
import { Svg } from '../lib/Svg.jsx';
import { Hoverable } from '../lib/Hoverable.jsx';
import { ico } from '../icons.js';
import { api } from '../api.js';
import { relativeTime } from '../adapt.js';

const MONO = "font-family:'JetBrains Mono',monospace;";
const label = MONO + ' font-size:9.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#a5a5a5;';

// Pipeline columns (decided_with_conditions folds into DECIDED, badged on the card).
const COLUMNS = [
  { key: 'active', label: 'Active', stages: ['active'] },
  { key: 'in_review', label: 'In Review', stages: ['in_review'] },
  { key: 'decided', label: 'Decided', stages: ['decided', 'decided_with_conditions'] },
  { key: 're_review', label: 'Re-review', stages: ['re_review'] },
];
const ATTENTION = [
  { key: 're_review', label: 'RE-REVIEW' },
  { key: 'contested', label: 'CONTESTED' },
  { key: 'overdue', label: 'OVERDUE' },
  { key: 'unevidenced', label: 'UNEVIDENCED' },
  { key: 'with_conditions', label: 'W/COND' },
];

export function Portfolio({ openThread }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api.portfolio().then((res) => {
      if (!live) return;
      if (res.ok) setData(res.data);
      else setError(res.data.error || 'failed to load portfolio');
    });
    return () => { live = false; };
  }, []);

  const threads = (data && data.threads) || [];
  const summary = (data && data.summary) || { total: 0, byStage: {}, attention: {}, allChainValid: true };
  const attentionThreads = (key) => threads.filter((t) => (t.attention || []).includes(key));

  return (
    <div className="clista-screen" style={css('max-width:1180px; margin:0 auto; padding:28px 40px 64px;')}>
      {/* header */}
      <div style={css('display:flex; align-items:flex-end; gap:16px; margin-bottom:22px;')}>
        <div>
          <div style={css(MONO + ' font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a9a; margin-bottom:9px;')}>Portfolio</div>
          <h1 style={css("margin:0; font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:600; letter-spacing:-0.015em; color:#0a0a0a;")}>Decision portfolio</h1>
        </div>
        <div style={css('flex:1;')} />
        <span style={css(MONO + ' font-size:12px; color:#9a9a9a; padding-bottom:5px;')}>
          {data ? `${summary.total} threads · chain ${summary.allChainValid ? '✓ all valid' : '✗ INVALID'}` : 'loading…'}
        </span>
      </div>

      {/* integrity alarm — should never fire */}
      {data && !summary.allChainValid && (
        <div style={css('margin-bottom:18px; padding:13px 16px; background:#f8eeee; border:1px solid rgba(179,52,60,0.35); border-left:3px solid #b3343c; border-radius:6px; ' + MONO + ' font-size:12.5px; color:#7a3a3d;')}>
          INTEGRITY ALARM — one or more threads failed chain validation. This is the most important thing on this page.
        </div>
      )}

      {/* attention banner */}
      <div style={css('margin-bottom:22px; padding:16px 18px; background:#fff; border:1px solid #dcdcda; border-radius:8px;')}>
        <div style={css('display:flex; align-items:center; gap:9px; margin-bottom:12px;')}>
          <Svg html={ico('alertTriangle', { size: 15, sw: 1.8 })} style={css('color:#9a6b07;')} />
          <span style={css(MONO + ' font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#9a6b07;')}>Needs attention</span>
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:10px 20px; margin-bottom:12px;')}>
          {ATTENTION.map((a) => (
            <span key={a.key} style={css(MONO + ' font-size:11px; color:' + ((summary.attention[a.key] || 0) > 0 ? '#5a4207' : '#b8b8b6') + ';')}>
              {a.label}(<b>{summary.attention[a.key] || 0}</b>)
            </span>
          ))}
        </div>
        <div style={css('display:flex; flex-wrap:wrap; gap:7px;')}>
          {ATTENTION.flatMap((a) => attentionThreads(a.key).map((t) => (
            <Hoverable
              key={a.key + t.id}
              onClick={() => openThread(t.id)}
              base={css(MONO + ' font-size:10.5px; color:#5a4207; background:#f7f2e8; border:1px solid rgba(154,107,7,0.28); border-radius:5px; padding:4px 9px; cursor:pointer;')}
              hover={css('border-color:#9a6b07;')}
            >
              {a.label.toLowerCase()} · {t.id.replace(/^thd_/, '').slice(0, 22)}
            </Hoverable>
          )))}
          {data && ATTENTION.every((a) => (summary.attention[a.key] || 0) === 0) && (
            <span style={css(MONO + ' font-size:11px; color:#1c7a4f;')}>✓ nothing needs attention</span>
          )}
        </div>
      </div>

      {/* lifecycle pipeline */}
      <div style={css('display:grid; grid-template-columns:repeat(4, 1fr); gap:14px;')}>
        {COLUMNS.map((col) => {
          const cards = threads.filter((t) => col.stages.includes(t.stage));
          return (
            <div key={col.key} style={css('background:#fbfbfa; border:1px solid #e5e5e5; border-radius:8px; padding:12px 12px 16px;')}>
              <div style={css('display:flex; align-items:baseline; gap:7px; margin-bottom:11px; padding:0 2px;')}>
                <span style={css(label)}>{col.label}</span>
                <span style={css(MONO + ' font-size:11px; color:#8a8a8a;')}>({cards.length})</span>
              </div>
              <div style={css('display:flex; flex-direction:column; gap:9px;')}>
                {cards.map((t) => <PortfolioCard key={t.id} t={t} onOpen={() => openThread(t.id)} />)}
                {cards.length === 0 && <span style={css(MONO + ' font-size:10.5px; color:#c0c0be; padding:6px 2px;')}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={css('margin-top:20px; ' + MONO + ' font-size:13px; color:#b3343c;')}>portfolio unavailable — {error}</div>}
      <p style={css('margin:18px 2px 0; ' + MONO + ' font-size:11px; color:#a5a5a5;')}>// read-only projection over every thread’s append-only ledger. conditions counted are those carried, not discharged.</p>
    </div>
  );
}

function PortfolioCard({ t, onOpen }) {
  const glyph = (sym, n, color) => (
    <span style={css(MONO + ' font-size:10.5px; color:' + (n > 0 ? color : '#c0c0be') + ';')}>{sym}{n}</span>
  );
  return (
    <Hoverable
      as="button"
      onClick={onOpen}
      base={css('display:block; width:100%; text-align:left; background:#fff; border:1px solid #e2e2e0; border-radius:6px; padding:11px 12px; cursor:pointer;')}
      hover={css('border-color:#0a0a0a;')}
    >
      <div style={css('display:flex; align-items:baseline; gap:6px; margin-bottom:7px;')}>
        <span style={css('flex:1; min-width:0; font-size:13px; font-weight:500; color:#1a1a1a; line-height:1.35; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;')}>{t.question || t.title || t.id}</span>
        <span title="chain verified" style={css('flex:none; color:' + (t.chain_valid === false ? '#b3343c' : '#1c7a4f') + ';')}>
          <Svg html={ico(t.chain_valid === false ? 'circleX' : 'check', { size: 12, sw: 2.2 })} />
        </span>
      </div>
      <div style={css('display:flex; align-items:center; gap:10px; margin-bottom:6px;')}>
        {glyph('◇', t.open_objections || 0, '#9a6b07')}
        {glyph('▪', t.evidence_count || 0, '#2c5f96')}
        {(t.outstanding_conditions || 0) > 0 && <span style={css(MONO + ' font-size:10.5px; color:#6a4ca5;')}>cond·{t.outstanding_conditions}</span>}
        {(t.claims_total || 0) > 0 && <span style={css(MONO + ' font-size:10.5px; color:' + (t.claims_grounded === 0 ? '#b3343c' : '#8a8a8a') + ';')}>{t.claims_grounded}/{t.claims_total} grnd</span>}
      </div>
      <div style={css('display:flex; align-items:center; gap:8px; ' + MONO + ' font-size:10px; color:#a5a5a5;')}>
        <span style={css('overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{t.owner}</span>
        <span style={css('flex:1;')} />
        <span style={css('color:' + (t.overdue ? '#b3343c' : '#a5a5a5') + ';')}>{relativeTime(t.last)}</span>
      </div>
    </Hoverable>
  );
}
```

- [ ] **Step 2: Wire the screen into App.jsx**

In `app/src/App.jsx`:

(a) Add the import beside the other screen imports (after the `ThreadIndex` import line):

```jsx
import { Portfolio } from './screens/Portfolio.jsx';
```

(b) Add a `NAV` entry directly after the `index` entry:

```jsx
  { key: 'portfolio', label: 'Portfolio', count: '', icon: ico('fileSearch', { size: 18 }) },
```

(c) Add the render branch beside the other `screen === ...` branches (after the `index` branch):

```jsx
        {screen === 'portfolio' && <Portfolio openThread={openThread} me={me} />}
```

- [ ] **Step 3: Build to verify it compiles**

Run: `cd app && npx vite build`
Expected: `✓ built` with no errors (44+ modules transformed).

- [ ] **Step 4: Drive it end-to-end (project verify skill)**

Use the `Projects/clista/app:verify` skill: `npx vite build` → `npx wrangler dev --port 8791`
(ensure `.dev.vars` has `DEV_IDENTITY=true`), then via headless puppeteer-core or the
browser:
1. `POST /api/threads/thd_scenario_demo/seed-demo` and create a contested thread (claim + objection), as in the Task 3 test.
2. `POST /api/portfolio/rebuild` to backfill.
3. Open the app, click the **Portfolio** sidebar item, and confirm: header shows the total + `chain ✓ all valid`, the attention banner shows `CONTESTED(≥1)` with a clickable chip, the pipeline shows the demo thread under **Decided** and the contested thread under **Active**, and clicking a card opens its cockpit.

Expected: the Portfolio screen renders the banner + pipeline; cards are dense and clickable.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/Portfolio.jsx app/src/App.jsx
git commit -m "feat(portfolio): Portfolio dashboard screen + nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Rollout (after all tasks)

1. `cd app && npm run test:all` — node + worker suites green.
2. `npx vite build && npx wrangler deploy` — production (`app.clista.ai`).
3. `curl -X POST https://app.clista.ai/api/portfolio/rebuild` **through an authenticated session** (or the app) — one-shot backfill so the 17 existing threads gain signals immediately (they otherwise backfill on their next append).
4. `npx wrangler deploy --env staging` — staging parity.
5. Verify the Portfolio screen on both.

## Self-Review Notes (checked against the spec)

- **Spec §Data model (10 signals):** Task 1 `deriveSignals` + `computeTiming` cover all — `stage, open_objections, evidence_count, claims_total, claims_grounded, outstanding_conditions, staleness_days, overdue, re_review, chain_valid`. ✔
- **Spec §Stage derivation (precedence):** Task 1 `deriveStage`. ✔
- **Spec §Attention model (5 triggers + integrity alarm):** Task 1 `deriveAttention` + Task 4 banner + alarm block. ✔
- **Spec §API shape:** Task 3 `portfolio()` / route return `{ summary: { total, byStage, attention, allChainValid }, threads[] }`. ✔
- **Spec §Approach A (enrich indexCard, IndexDO columns, one fetch):** Tasks 2–3. ✔
- **Spec §UI (new Portfolio screen, triage banner + pipeline, dense cards, click→cockpit):** Task 4. ✔
- **Spec §Migration (backfill sweep):** Task 3 `/api/portfolio/rebuild` + Rollout step 3. ✔
- **Spec open question (endpoint path):** resolved to `/api/portfolio` (Global Constraints) to avoid the `/api/threads/:id` collision. ✔
- **Spec open question (`degraded`/`failed` reachable):** handled defensively — `deriveStage` maps them if `thread.status` ever carries them, and `summarize` counts them; no badge assumed to fire.
- **Spec note (conditions = carried, not discharged):** surfaced in the Portfolio footer copy. ✔
