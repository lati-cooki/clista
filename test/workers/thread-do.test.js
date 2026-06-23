// In-runtime integration tests: the real Worker router + ThreadDO/IndexDO SQLite
// + ported engine, executed inside workerd by @cloudflare/vitest-pool-workers.
// Where the node parity test proves the engine, this proves the Durable Objects —
// validate-before-trust append, hash-chained append-only storage, index
// registration, and the orphan-only purge guard — in the actual runtime.
import { env, SELF, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const EMAIL = 'troylati@gmail.com';
const ORIGIN = 'https://app.clista.ai';
const authGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const authPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

async function createThread(question) {
  const res = await authPost('/api/threads', { question });
  return { res, data: await res.json() };
}
const objectionEvent = (threadId, targetId, id = 'obj_t') => ({
  event: {
    event_type: 'ObjectionRaised',
    payload: {
      objection: {
        id, object: 'objection', threadId, participantId: 'par_troylati',
        targetObjectId: targetId, targetObjectType: 'claim',
        text: 'A precisely stated challenge.', status: 'open', raisedAt: '2026-06-23T12:00:00.000Z',
      },
    },
  },
});
const claimEvent = (threadId, id = 'clm_t') => ({
  event: {
    event_type: 'ClaimCreated',
    payload: {
      claim: {
        id, object: 'claim', threadId, text: 'An interpretation worth challenging.',
        status: 'proposed', createdByParticipantId: 'par_troylati', createdAt: '2026-06-23T12:00:00.000Z',
      },
    },
  },
});

describe('thread lifecycle through the Worker + DOs in-runtime', () => {
  it('creates a thread, validates the chain, and registers it in the index', async () => {
    const { res, data } = await createThread('Should the in-runtime DO test cover the create path?');
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.id).toMatch(/^thd_/);
    expect(data.count).toBe(2);

    const validate = await (await authGet(`/api/threads/${data.id}/validate`)).json();
    expect(validate.ok).toBe(true);
    expect(validate.event_count).toBe(2);
    expect(validate.head_hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const state = await (await authGet(`/api/threads/${data.id}/state`)).json();
    expect(state.thread.status).toBe('active');
    const owner = state.identityState.participants[0];
    expect(owner.id).toBe('par_troylati');
    expect(owner.role).toBe('decision owner');

    const index = await (await authGet('/api/threads')).json();
    expect(index.threads.map((t) => t.id)).toContain(data.id);
  });

  it('validate-before-trust: an objection to a nonexistent claim fails closed (422), log unchanged', async () => {
    const { data } = await createThread('Does the DO reject an append that references nothing?');
    const res = await authPost(`/api/threads/${data.id}/append`, objectionEvent(data.id, 'clm_nope'));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reasons.some((r) => /does not exist/.test(r.reason))).toBe(true);

    // The rejected event was not stored — the log is still the 2-event genesis.
    const validate = await (await authGet(`/api/threads/${data.id}/validate`)).json();
    expect(validate.event_count).toBe(2);
  });

  it('append-only: a valid claim then an objection on it extend the hash chain', async () => {
    const { data } = await createThread('Does a valid append extend the chain and re-validate?');
    const head0 = (await (await authGet(`/api/threads/${data.id}/validate`)).json()).head_hash;

    const c = await authPost(`/api/threads/${data.id}/append`, claimEvent(data.id, 'clm_chain'));
    expect(c.status).toBe(200);
    const o = await authPost(`/api/threads/${data.id}/append`, objectionEvent(data.id, 'clm_chain', 'obj_chain'));
    expect(o.status).toBe(200);

    const validate = await (await authGet(`/api/threads/${data.id}/validate`)).json();
    expect(validate.ok).toBe(true);
    expect(validate.event_count).toBe(4);
    expect(validate.head_hash).not.toBe(head0); // the head moved as the chain grew
  });

  it('ingest refuses a thread that already has events', async () => {
    const { data } = await createThread('Can ingest clobber an existing thread? It must not.');
    const res = await authPost(`/api/threads/${data.id}/ingest`, { events: [claimEvent(data.id).event] });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reasons.some((r) => /already has events/.test(r.reason))).toBe(true);
  });

  it('purge removes an orphan (join-only) thread but refuses a registered one', async () => {
    // Registered thread → purge refused (409), keeping legitimate logs append-only.
    const { data } = await createThread('Is a registered thread protected from purge?');
    const refused = await authPost(`/api/threads/${data.id}/purge`, {});
    expect(refused.status).toBe(409);

    // Orphan: a join on a never-created thread writes a ParticipantDeclared but no
    // ThreadCreated, so it is never registered. That junk DO can be purged.
    const orphanId = 'thd_orphan_join_only';
    const joined = await authPost(`/api/threads/${orphanId}/join`, { role: 'contributor' });
    expect(joined.status).toBe(200);
    const indexBefore = await (await authGet('/api/threads')).json();
    expect(indexBefore.threads.map((t) => t.id)).not.toContain(orphanId);

    const purged = await authPost(`/api/threads/${orphanId}/purge`, {});
    expect(purged.status).toBe(200);
    expect((await purged.json()).purged).toBe(true);
  });
});

describe('ThreadDO methods directly in the runtime', () => {
  it('ingest + validate run against the real DO instance via runInDurableObject', async () => {
    const stub = env.THREAD.get(env.THREAD.idFromName('thd_direct'));
    const genesis = [
      {
        event_id: 'evt_d1', event_type: 'ParticipantDeclared', thread_id: 'thd_direct',
        actor_id: 'par_troylati', timestamp: '2026-06-23T00:00:00.000Z',
        payload: { participant: { id: 'par_troylati', object: 'participant', kind: 'human', name: 'Troylati', role: 'decision owner' } },
      },
      {
        event_id: 'evt_d2', event_type: 'ThreadCreated', thread_id: 'thd_direct',
        actor_id: 'par_troylati', timestamp: '2026-06-23T00:00:01.000Z',
        payload: { thread: { id: 'thd_direct', object: 'thread', title: 'Direct', question: 'Does the DO run in-runtime under vitest?', status: 'active', participantIds: ['par_troylati'], createdAt: '2026-06-23T00:00:00.000Z', updatedAt: '2026-06-23T00:00:01.000Z' } },
      },
    ];

    await runInDurableObject(stub, async (instance) => {
      const ingest = await instance.ingest(genesis);
      expect(ingest.ok).toBe(true);
      expect(ingest.count).toBe(2);

      const validate = await instance.validate();
      expect(validate.ok).toBe(true);
      expect(validate.event_count).toBe(2);

      const card = await instance.indexCard();
      expect(card.id).toBe('thd_direct');
      expect(card.owner).toBe('Troylati');
    });
  });
});
