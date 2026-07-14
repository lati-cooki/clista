// store-parity.test.js — the trigger-free store variant. Two things are
// pinned: (1) the ONLY divergence from the production store schema is the two
// removed append-only triggers (the disclosed relaxation cannot silently
// widen), and (2) DELETE actually works here (it is RAISE(ABORT)-blocked on
// the prod store), which is what makes the 24h TTL sweep possible.
import { env, runInDurableObject } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { SCHEMA } from '../src/sandbox-store.js';
import storeSource from '../../threadhub/src/store.js?raw';

// The two trigger blocks the sandbox deliberately omits, verbatim as they
// appear in store.js's DDL.
const TRIGGERS = `CREATE TRIGGER IF NOT EXISTS records_no_update
BEFORE UPDATE ON records BEGIN
  SELECT RAISE(ABORT, 'records are append-only');
END;

CREATE TRIGGER IF NOT EXISTS records_no_delete
BEFORE DELETE ON records BEGIN
  SELECT RAISE(ABORT, 'records are append-only');
END;

`;

it('sandbox SCHEMA == production store.js DDL MINUS exactly the two append-only triggers', () => {
  const m = /const SCHEMA = `([\s\S]*?)`;/.exec(storeSource);
  expect(m).not.toBeNull();
  const prodDDL = m[1];
  // Removing the trigger blocks from the prod DDL must yield the sandbox DDL —
  // proving triggers are the whole and only difference.
  expect(prodDDL.includes(TRIGGERS)).toBe(true);
  expect(prodDDL.replace(TRIGGERS, '')).toBe(SCHEMA);
});

it('records are DELETE-able here (the prod trigger would RAISE(ABORT)) — TTL sweep is possible', async () => {
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('store-parity'));
  await runInDurableObject(stub, (instance) => {
    const store = instance.store;
    store.insertIdentity({
      id: 'id_x', displayName: 'W', kind: 'agent',
      publicKey: 'ab'.repeat(32), privateKey: 'PEM', createdAt: '2026-01-01T00:00:00.000Z',
    });
    store.insertThread({
      id: 'thd_x', slug: 'sx', title: 'T', createdBy: 'id_x', createdAt: '2026-01-01T00:00:00.000Z',
    });
    store.insertRecord({
      recordHash: 'sha256:' + 'a0'.repeat(32), threadId: 'thd_x', seq: 0, prevHash: null,
      authorId: 'id_x', authorKey: 'ab'.repeat(32), kind: 'genesis',
      recordedAt: '2026-01-01T00:00:00.000Z', body: '{"seq":0}', signature: 'f0'.repeat(32),
    });
    expect(store.countRecords()).toBe(1);

    // The exact operation the prod store forbids.
    expect(() => store.sql.exec('DELETE FROM records WHERE thread_id = ?', 'thd_x')).not.toThrow();
    expect(store.countRecords()).toBe(0);
  });
});

it('deleteThreadCascade removes the thread, its records, and its 1:1 writer identity', async () => {
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('store-cascade'));
  await runInDurableObject(stub, (instance) => {
    const store = instance.store;
    store.insertIdentity({
      id: 'id_w', displayName: 'W', kind: 'agent',
      publicKey: 'cd'.repeat(32), privateKey: 'PEM', createdAt: '2026-01-01T00:00:00.000Z',
    });
    store.insertThread({
      id: 'thd_w', slug: 'sw', title: 'T', createdBy: 'id_w', createdAt: '2026-01-01T00:00:00.000Z',
    });
    store.insertRecord({
      recordHash: 'sha256:' + 'b0'.repeat(32), threadId: 'thd_w', seq: 0, prevHash: null,
      authorId: 'id_w', authorKey: 'cd'.repeat(32), kind: 'genesis',
      recordedAt: '2026-01-01T00:00:00.000Z', body: '{"seq":0}', signature: 'f0'.repeat(32),
    });

    expect(store.deleteThreadCascade('thd_w')).toBe(true);
    expect(store.getThread('thd_w')).toBeNull();
    expect(store.recordsOf('thd_w')).toEqual([]);
    expect(store.getIdentity('id_w')).toBeNull(); // writer is 1:1 with the thread
    expect(store.deleteThreadCascade('thd_w')).toBe(false); // idempotent
  });
});
