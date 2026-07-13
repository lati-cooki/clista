// store-contract.test.js — the FULL Store contract (packages/threadhub/src/
// store.js) exercised against DOStore inside the real Durable Object, plus
// the append-only triggers and the constraint/error semantics Hub relies on.
// hub.js's duck test only checks getThread/insertRecord; this file holds the
// DO store to the whole surface.
import { env, runInDurableObject } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { SCHEMA } from '../src/store-do.js';
import storeSource from '../../threadhub/src/store.js?raw';

it('DOStore SCHEMA is byte-identical to the store.js DDL (copy cannot drift)', () => {
  const m = /const SCHEMA = `([\s\S]*?)`;/.exec(storeSource);
  expect(m).not.toBeNull();
  expect(SCHEMA).toBe(m[1]);
});

it('every Store method, every constraint, both append-only triggers', async () => {
  const stub = env.HUB.get(env.HUB.idFromName('hub'));
  await runInDurableObject(stub, (instance) => {
    const store = instance.store;

    // --- identities ---
    store.insertIdentity({
      id: 'id_a', displayName: 'Alice', kind: 'human',
      publicKey: 'aa'.repeat(32), privateKey: 'PEM-A', createdAt: '2026-01-01T00:00:00.000Z',
    });
    store.insertIdentity({ // privateKey omitted → NULL (non-custodial)
      id: 'id_b', displayName: 'Bot', kind: 'agent',
      publicKey: 'bb'.repeat(32), createdAt: '2026-01-02T00:00:00.000Z',
    });
    expect(store.getIdentity('id_a')).toEqual({
      id: 'id_a', display_name: 'Alice', kind: 'human',
      public_key: 'aa'.repeat(32), private_key: 'PEM-A', created_at: '2026-01-01T00:00:00.000Z',
    });
    expect(store.getIdentity('id_b').private_key).toBeNull();
    expect(store.getIdentity('id_missing')).toBeNull();

    const idents = store.listIdentities();
    expect(idents.map((r) => r.id)).toEqual(['id_a', 'id_b']); // created_at order
    expect(Object.keys(idents[0]).sort()).toEqual(
      ['created_at', 'display_name', 'id', 'kind', 'public_key'] // private_key never listed
    );

    expect(() => store.insertIdentity({ // duplicate PK
      id: 'id_a', displayName: 'X', kind: 'human',
      publicKey: 'cc'.repeat(32), createdAt: '2026-01-03T00:00:00.000Z',
    })).toThrow();
    expect(() => store.insertIdentity({ // UNIQUE public_key
      id: 'id_c', displayName: 'X', kind: 'human',
      publicKey: 'aa'.repeat(32), createdAt: '2026-01-03T00:00:00.000Z',
    })).toThrow();
    expect(() => store.insertIdentity({ // CHECK(kind)
      id: 'id_d', displayName: 'X', kind: 'robot',
      publicKey: 'dd'.repeat(32), createdAt: '2026-01-03T00:00:00.000Z',
    })).toThrow();

    // --- threads ---
    store.insertThread({
      id: 'thd_1', slug: 'first', title: 'First',
      createdBy: 'id_a', createdAt: '2026-01-05T00:00:00.000Z', // genesisHash omitted → NULL
    });
    store.insertThread({
      id: 'thd_2', slug: 'second', title: 'Second',
      createdBy: 'id_b', createdAt: '2026-01-06T00:00:00.000Z', genesisHash: 'sha256:' + '11'.repeat(32),
    });
    expect(store.getThread('thd_1')).toEqual(store.getThread('first')); // id OR slug
    expect(store.getThread('thd_1').genesis_hash).toBeNull();
    expect(store.getThread('nope')).toBeNull();
    expect(store.listThreads().map((t) => t.id)).toEqual(['thd_1', 'thd_2']); // created_at order

    store.setGenesis('thd_1', 'sha256:' + '22'.repeat(32));
    expect(store.getThread('thd_1').genesis_hash).toBe('sha256:' + '22'.repeat(32));

    expect(() => store.insertThread({ // FK created_by
      id: 'thd_3', slug: 'third', title: 'T', createdBy: 'id_missing', createdAt: '2026-01-07T00:00:00.000Z',
    })).toThrow();
    expect(() => store.insertThread({ // UNIQUE slug
      id: 'thd_4', slug: 'first', title: 'T', createdBy: 'id_a', createdAt: '2026-01-07T00:00:00.000Z',
    })).toThrow();

    // --- records ---
    expect(store.headOf('thd_1')).toBeNull(); // empty thread has no head

    const rec = (seq, hash, prev) => ({
      recordHash: hash, threadId: 'thd_1', seq, prevHash: prev,
      authorId: 'id_a', authorKey: 'aa'.repeat(32), kind: seq === 0 ? 'genesis' : 'note',
      recordedAt: `2026-01-0${8 + seq}T00:00:00.000Z`, body: `{"seq":${seq}}`, signature: 'f0'.repeat(32),
    });
    const h0 = 'sha256:' + 'a0'.repeat(32);
    const h1 = 'sha256:' + 'a1'.repeat(32);
    store.insertRecord(rec(0, h0, null));
    store.insertRecord(rec(1, h1, h0));

    expect(store.headOf('thd_1').record_hash).toBe(h1);
    expect(store.recordsOf('thd_1').map((r) => r.seq)).toEqual([0, 1]);
    expect(store.recordsOf('thd_2')).toEqual([]);
    expect(store.getRecord(h0)).toMatchObject({
      record_hash: h0, thread_id: 'thd_1', seq: 0, prev_hash: null,
      author_id: 'id_a', author_key: 'aa'.repeat(32), kind: 'genesis',
      recorded_at: '2026-01-08T00:00:00.000Z', body: '{"seq":0}', signature: 'f0'.repeat(32),
    });
    expect(store.getRecord('sha256:' + '00'.repeat(32))).toBeNull();
    expect(store.countRecords()).toBe(2);

    expect(() => store.insertRecord(rec(1, 'sha256:' + 'a9'.repeat(32), h0))).toThrow(); // UNIQUE (thread_id, seq)
    expect(() => store.insertRecord(rec(2, h0, h1))).toThrow();                          // duplicate PK record_hash
    expect(() => store.insertRecord({ ...rec(2, 'sha256:' + 'a2'.repeat(32), h1), threadId: 'thd_missing' })).toThrow(); // FK thread
    expect(() => store.insertRecord({ ...rec(2, 'sha256:' + 'a3'.repeat(32), h1), authorId: 'id_missing' })).toThrow();  // FK author
    expect(() => store.insertRecord({ ...rec(2, 'sha256:' + 'a4'.repeat(32), h1), kind: 'blob' })).toThrow();            // CHECK(kind)

    // --- append-only is a property of the DATABASE, not the calling code ---
    expect(() => store.sql.exec(`UPDATE records SET body = 'tampered' WHERE record_hash = ?`, h0))
      .toThrow(/append-only/);
    expect(() => store.sql.exec(`DELETE FROM records WHERE record_hash = ?`, h0))
      .toThrow(/append-only/);
    expect(store.getRecord(h0).body).toBe('{"seq":0}'); // row untouched
    expect(store.countRecords()).toBe(2);
  });
});
