// In-runtime test for GET /api/threads/:id/export — the raw, chained event
// log, verbatim (the archival feed scripts/archive-thread.mjs ships to
// ThreadHub). The export must be the source of truth as stored: same events,
// same order, chain fields (content_hash/prev_hash) intact, so an external
// archive is independently re-verifiable.
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

describe('GET /api/threads/:id/export', () => {
  it('returns the raw chained log verbatim, in append order', async () => {
    const id = (await (await post('/api/threads', { question: 'Does the export return the raw chained log verbatim?' })).json()).id;
    const claim = await (await append(id, { event_type: 'ClaimCreated', payload: { claim: { id: 'clm_ex', object: 'claim', threadId: id, text: 'The export mirrors the stored log exactly.', status: 'proposed', createdByParticipantId: ACTOR, createdAt: iso() } } })).json();
    expect(claim.ok).toBe(true);

    const events = await (await get(`/api/threads/${id}/export`)).json();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(3); // ParticipantDeclared, ThreadCreated, ClaimCreated
    expect(events.map((e) => e.event_type)).toEqual(['ParticipantDeclared', 'ThreadCreated', 'ClaimCreated']);
    // Chain fields present and linked — verbatim storage, not a projection.
    expect(events.every((e) => /^sha256:[0-9a-f]{64}$/.test(e.content_hash))).toBe(true);
    expect(events[1].previous_hash).toBe(events[0].content_hash);
    expect(events[2].previous_hash).toBe(events[1].content_hash);
    // The appended event round-trips byte-identical.
    expect(events[2]).toEqual(claim.event);

    // An empty/unknown thread exports as an empty array (nothing to archive).
    const empty = await (await get('/api/threads/thd_nope/export')).json();
    expect(empty).toEqual([]);
  });
});
