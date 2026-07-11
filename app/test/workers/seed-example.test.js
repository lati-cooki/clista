// In-runtime test for the generic example-mirror routes (GET /api/examples,
// POST /api/examples/:id/seed). Proves a MULTI-thread example seeds every thread
// (parent + arms) into its own DO through the real Worker route, and that the
// parent reconstructs the scoped go decision with its propagated objections and
// minority report intact. Companion to pharma-phase-gate.test.js (which covers
// the older single-thread seed-* action).
import { env, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { examples as exampleRegistry } from '../../worker/examples/index.js';

const EMAIL = 'troylati@gmail.com';
const ORIGIN = 'https://app.clista.ai';
const EXAMPLE_ID = 'pharma-phase-gate-multithreaded';
const PARENT_THREAD = 'thd_phase2_to_phase3_go_nogo_ltn4481_r2';
const authGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const authPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

const example = exampleRegistry.find((e) => e.id === EXAMPLE_ID);

describe('generic example-mirror routes', () => {
  it('GET /api/examples lists the published example without event logs', async () => {
    const body = await (await authGet('/api/examples')).json();
    const entry = body.examples.find((e) => e.id === EXAMPLE_ID);
    expect(entry).toBeTruthy();
    expect(entry.kind).toBe('multi-thread');
    expect(entry.entryThreadId).toBe(PARENT_THREAD);
    expect(entry.threadCount).toBe(5);
    expect('threads' in entry).toBe(false); // listing omits the embedded events
  });

  it('POST /api/examples/:id/seed seeds the parent + all four arms', async () => {
    const res = await authPost(`/api/examples/${EXAMPLE_ID}/seed`, {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.entryThreadId).toBe(PARENT_THREAD);
    expect(body.threads).toHaveLength(5);
    expect(body.threads.every((t) => t.ok)).toBe(true);
    // Per-thread counts match the vendored registry exactly.
    for (const t of example.threads) {
      const seeded = body.threads.find((s) => s.threadId === t.threadId);
      expect(seeded.count).toBe(t.events.length);
    }

    // Every thread is now registered in the index.
    const index = await (await authGet('/api/threads')).json();
    const ids = index.threads.map((t) => t.id);
    for (const t of example.threads) expect(ids).toContain(t.threadId);

    // The parent validates as a clean hash chain.
    const validate = await (await authGet(`/api/threads/${PARENT_THREAD}/validate`)).json();
    expect(validate.ok).toBe(true);
    expect(validate.head_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('parent reconstructs the scoped go decision with propagated objections + dissent', async () => {
    const state = await (await authGet(`/api/threads/${PARENT_THREAD}/state`)).json();
    const record = state.decisionStatus.decisionRecord;
    expect(record).toBeTruthy();
    expect(record.status).toBe('approved');
    // Objections that propagated from the arm threads survive the parent decision.
    expect(record.preservedObjectionIds).toEqual(
      expect.arrayContaining(['obj_stopping_rules_propagated', 'obj_subgroup_discipline_propagated'])
    );
    // The biostatistician's minority report, traceable to the subgroup arm.
    expect(record.minorityReportIds).toContain('mnr_parent_biostat_discipline');
  });

  it('re-seeding refuses (append-only) and an unknown id is 404', async () => {
    const reseed = await authPost(`/api/examples/${EXAMPLE_ID}/seed`, {});
    expect(reseed.status).toBe(409);
    const missing = await authPost('/api/examples/no-such-example/seed', {});
    expect(missing.status).toBe(404);
  });
});
