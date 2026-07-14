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
