// demo.test.js — the pinned demo: a persistent, curated sandbox record with a
// fixed, recognizable slug (/try/demo/view) that self-seeds idempotently, is
// EXEMPT from the 24h TTL sweep, and renders the persistent-banner variant
// (no "expires within 24h" line) while staying honestly a sandbox record
// (never anchored, not a governance record). It is created exactly like a
// normal /try thread, so its signed export verifies with the real checker
// (proven n/n in test-node/verify-real-checker.test.js).
import { env, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { get, seedTry } from './helpers.js';

// The demo's decision text, verbatim (mirrors DEMO_DECISION in sandbox-do.js).
const DEMO_DECISION =
  'Raise the auto-approval limit for personal loans from $10,000 to $25,000.';

const stub = () => env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));
const demoCount = () =>
  runInDurableObject(stub(), (i) =>
    i.store.sql.exec("SELECT COUNT(*) AS n FROM threads WHERE slug = 'demo'").one().n);

it('the demo self-seeds idempotently on first access — published, decision verbatim, signed', async () => {
  // No demo exists until first access.
  expect(await demoCount()).toBe(0);

  const view = await get('/try/demo/view');
  expect(view.status).toBe(200);
  expect(await demoCount()).toBe(1);

  const records = await (await get('/try/demo.json')).json();
  expect(records.map((r) => r.seq)).toEqual([0, 1]);          // genesis + publish
  expect(records[0].kind).toBe('genesis');
  expect(records[0].payload.question).toBe(DEMO_DECISION);    // verbatim
  expect(records[1].payload.event_type).toBe('ThreadPublished');
  // The signed-export sidecar is present on every record → real checker n/n.
  expect(records.every((r) => /^sha256:[0-9a-f]{64}$/.test(r.record_hash))).toBe(true);
  expect(records.every((r) => typeof r.signature === 'string' && r.signature.length > 0)).toBe(true);

  // Idempotent: repeated access does NOT create a second demo thread.
  await get('/try/demo/view');
  await get('/try/demo.json');
  expect(await demoCount()).toBe(1);
});

it('the TTL sweep NEVER deletes the pinned demo, even when older than the TTL, while a normal old thread is swept', async () => {
  await get('/try/demo/view'); // ensure the demo is materialized
  const normal = await seedTry('This normal sandbox thread will be swept.');

  expect((await get('/try/demo.json')).status).toBe(200);
  expect((await get(`/try/${normal.slug}.json`)).status).toBe(200);

  // Backdate BOTH the demo and the normal thread well past the TTL, so the
  // demo's survival is proven to come from the slug exemption, not its age.
  await runInDurableObject(stub(), async (instance, state) => {
    const old = new Date(Date.now() - 72 * 3600_000).toISOString();
    instance.store.sql.exec('UPDATE threads SET created_at = ?', old);
    await state.storage.setAlarm(Date.now() + 60_000);
  });

  expect(await runDurableObjectAlarm(stub())).toBe(true);

  // Demo survives everywhere; the normal old thread is gone.
  expect((await get('/try/demo/view')).status).toBe(200);
  expect((await get('/try/demo.json')).status).toBe(200);
  expect((await get(`/try/${normal.slug}.json`)).status).toBe(404);
  expect((await get(`/try/${normal.slug}/view`)).status).toBe(404);

  // The demo thread + its 1:1 custodial writer are intact.
  await runInDurableObject(stub(), (instance) => {
    const demo = instance.store.getThread('demo');
    expect(demo).not.toBeNull();
    expect(instance.store.getIdentity(demo.created_by)).not.toBeNull();
    expect(instance.store.recordsOf(demo.id).length).toBe(2);
  });
});

it('the demo view renders the PERSISTENT banner (no 24h-expiry line); a normal thread keeps the 24h banner', async () => {
  const demoBody = await (await get('/try/demo/view')).text();
  // Persistent variant: keeps the honest limits, drops the expiry line.
  expect(demoBody).toContain('persistent demonstration');
  expect(demoBody).toContain('not a governance record');
  expect(demoBody).toContain('never anchored');
  expect(demoBody).toContain('a real, signed, hash-chained record you can verify below');
  expect(demoBody).not.toContain('expires and is deleted within');

  // A normal (non-pinned) sandbox thread still shows the unchanged 24h banner.
  const normal = await seedTry('A normal thread that still expires.');
  const normalBody = await (await get(`/try/${normal.slug}/view`)).text();
  expect(normalBody).toContain('SANDBOX — ephemeral demonstration');
  expect(normalBody).toContain('expires and is deleted within 24 hours');
});
