// In-runtime test for the bundled vendor due-diligence decision — the companion
// to scenario-demo. Proves that the canonical NovaPay BaaS log seeds through the
// real Worker route + ThreadDO, validates as a 28-event hash chain, reconstructs
// the scoped approval, and preserves both surviving objections + the minority
// report. Mirrors the seed/ingest coverage in thread-do.test.js.
import { env, SELF, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { vendorDueDiligenceEvents } from '../../worker/vendor-dd.js';

const EMAIL = 'troylati@gmail.com';
const ORIGIN = 'https://app.clista.ai';
const VENDOR_THREAD_ID = 'thd_vendor_dd_baas_partner_eval';
const authGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const authPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

describe('vendor due-diligence decision seeds + reconstructs in-runtime', () => {
  it('bundled log is the expected 28-event vendor-dd thread', () => {
    expect(vendorDueDiligenceEvents).toHaveLength(28);
    expect(vendorDueDiligenceEvents[0].event_type).toBe('ParticipantAdded');
    expect(vendorDueDiligenceEvents.at(-1).event_type).toBe('MinorityReportFiled');
    expect(new Set(vendorDueDiligenceEvents.map((e) => e.thread_id))).toEqual(new Set([VENDOR_THREAD_ID]));
  });

  it('seed-vendor-dd ingests the chain, registers the thread, and validates clean', async () => {
    const seed = await authPost(`/api/threads/${VENDOR_THREAD_ID}/seed-vendor-dd`, {});
    expect(seed.status).toBe(200);
    const seedBody = await seed.json();
    expect(seedBody.ok).toBe(true);
    expect(seedBody.count).toBe(28);

    const validate = await (await authGet(`/api/threads/${VENDOR_THREAD_ID}/validate`)).json();
    expect(validate.ok).toBe(true);
    expect(validate.event_count).toBe(28);
    expect(validate.head_hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const index = await (await authGet('/api/threads')).json();
    expect(index.threads.map((t) => t.id)).toContain(VENDOR_THREAD_ID);

    // A second seed is refused — the thread already has events (append-only).
    const reseed = await authPost(`/api/threads/${VENDOR_THREAD_ID}/seed-vendor-dd`, {});
    expect(reseed.status).toBe(409);
  });

  it('reconstructs the scoped approval with both objections preserved + the dissent', async () => {
    const stub = env.THREAD.get(env.THREAD.idFromName('thd_vendor_state'));
    await runInDurableObject(stub, async (instance) => {
      const ingest = await instance.ingest(vendorDueDiligenceEvents);
      expect(ingest.ok).toBe(true);
      expect(ingest.count).toBe(28);

      const state = await instance.state(VENDOR_THREAD_ID);
      const record = state.decisionStatus.decisionRecord;
      expect(record).toBeTruthy();
      expect(record.status).toBe('approved');
      expect(record.decidedByParticipantId).toBe('par_cro');
      // The two surviving objections are carried into the decision, not dropped.
      expect(record.preservedObjectionIds).toEqual(
        expect.arrayContaining(['obj_pen_test_gap_unresolved', 'obj_cross_border_wire_scope_creep'])
      );
      // The compliance dissent is attached as a minority report.
      expect(record.minorityReportIds).toContain('mnr_compliance_pen_test_dissent');
      expect(state.decisionStatus.minorityReports.map((m) => m.id)).toContain('mnr_compliance_pen_test_dissent');
    });
  });
});
