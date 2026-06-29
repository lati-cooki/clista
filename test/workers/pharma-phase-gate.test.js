// In-runtime test for the bundled pharma Phase II/III go/no-go decision (LTN-4481)
// — companion to scenario-demo and vendor-dd. Proves the canonical log seeds
// through the real Worker route + ThreadDO, validates as a 35-event hash chain,
// reconstructs the scoped "go" decision, and preserves all three surviving
// objections + the biostatistician's minority report. Mirrors vendor-dd.test.js.
import { env, SELF, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { pharmaPhaseGateEvents } from '../../worker/pharma-phase-gate.js';

const EMAIL = 'troylati@gmail.com';
const ORIGIN = 'https://app.clista.ai';
const PHARMA_THREAD_ID = 'thd_phase2_to_phase3_go_nogo_ltn_4481';
const authGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const authPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

describe('pharma phase-gate decision seeds + reconstructs in-runtime', () => {
  it('bundled log is the expected 35-event phase-gate thread', () => {
    expect(pharmaPhaseGateEvents).toHaveLength(35);
    expect(pharmaPhaseGateEvents[0].event_type).toBe('ParticipantAdded');
    expect(pharmaPhaseGateEvents.at(-1).event_type).toBe('MinorityReportFiled');
    expect(new Set(pharmaPhaseGateEvents.map((e) => e.thread_id))).toEqual(new Set([PHARMA_THREAD_ID]));
  });

  it('seed-pharma-phase-gate ingests the chain, registers the thread, and validates clean', async () => {
    const seed = await authPost(`/api/threads/${PHARMA_THREAD_ID}/seed-pharma-phase-gate`, {});
    expect(seed.status).toBe(200);
    const seedBody = await seed.json();
    expect(seedBody.ok).toBe(true);
    expect(seedBody.count).toBe(35);

    const validate = await (await authGet(`/api/threads/${PHARMA_THREAD_ID}/validate`)).json();
    expect(validate.ok).toBe(true);
    expect(validate.event_count).toBe(35);
    expect(validate.head_hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const index = await (await authGet('/api/threads')).json();
    expect(index.threads.map((t) => t.id)).toContain(PHARMA_THREAD_ID);

    // A second seed is refused — the thread already has events (append-only).
    const reseed = await authPost(`/api/threads/${PHARMA_THREAD_ID}/seed-pharma-phase-gate`, {});
    expect(reseed.status).toBe(409);
  });

  it('reconstructs the scoped go decision with all three objections preserved + the dissent', async () => {
    const stub = env.THREAD.get(env.THREAD.idFromName('thd_pharma_state'));
    await runInDurableObject(stub, async (instance) => {
      const ingest = await instance.ingest(pharmaPhaseGateEvents);
      expect(ingest.ok).toBe(true);
      expect(ingest.count).toBe(35);

      const state = await instance.state(PHARMA_THREAD_ID);
      const record = state.decisionStatus.decisionRecord;
      expect(record).toBeTruthy();
      expect(record.status).toBe('approved');
      expect(record.decidedByParticipantId).toBe('par_cmo');
      // All three reviewer objections are carried into the decision, not dropped.
      expect(record.preservedObjectionIds).toEqual(
        expect.arrayContaining([
          'obj_subgroup_design_risk',
          'obj_hepatotox_stopping_rules_undefined',
          'obj_pkpd_no_external_validation',
        ])
      );
      // The biostatistician's dissent is attached as a minority report.
      expect(record.minorityReportIds).toContain('mnr_biostat_subgroup_discipline');
      expect(state.decisionStatus.minorityReports.map((m) => m.id)).toContain('mnr_biostat_subgroup_discipline');
    });
  });
});
