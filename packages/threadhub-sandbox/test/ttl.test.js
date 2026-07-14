// ttl.test.js — the ephemeral 24h TTL sweep, driven by the DO alarm. A thread
// aged past the TTL is deleted on the next alarm; a fresh thread survives.
// (This is only possible because of the trigger-free store — the prod store's
// records_no_delete trigger would abort the sweep.)
import { env, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { get, seedTry } from './helpers.js';

it('alarm sweeps threads older than the TTL and keeps fresh ones', async () => {
  const stale = await seedTry('This decision is a day old.');
  const fresh = await seedTry('This one was just made.');

  // Both are live and readable now.
  expect((await get(`/try/${stale.slug}.json`)).status).toBe(200);
  expect((await get(`/try/${fresh.slug}.json`)).status).toBe(200);

  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));

  // Backdate the "stale" thread to 25h ago (threads have no append-only
  // trigger, so this UPDATE is allowed), then arm and run the alarm.
  await runInDurableObject(stub, async (instance, state) => {
    const old = new Date(Date.now() - 25 * 3600_000).toISOString();
    instance.store.sql.exec('UPDATE threads SET created_at = ? WHERE slug = ?', old, stale.slug);
    // A near-future time so miniflare doesn't auto-fire it before we force it.
    await state.storage.setAlarm(Date.now() + 60_000);
  });

  const ran = await runDurableObjectAlarm(stub);
  expect(ran).toBe(true);

  // Stale thread is gone everywhere; fresh thread untouched.
  expect((await get(`/try/${stale.slug}.json`)).status).toBe(404);
  expect((await get(`/try/${stale.slug}/view`)).status).toBe(404);
  expect((await get(`/try/${fresh.slug}.json`)).status).toBe(200);

  // Its custodial writer identity was swept too (1:1 with the thread).
  await runInDurableObject(stub, (instance) => {
    expect(instance.store.getThread(stale.slug)).toBeNull();
    expect(instance.store.countThreads()).toBe(1);
  });
});

it('POST /try arms the sweep alarm', async () => {
  await seedTry('arm the alarm');
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));
  await runInDurableObject(stub, async (_instance, state) => {
    expect(await state.storage.getAlarm()).not.toBeNull();
  });
});
