// isolation.test.js — THE load-bearing security test. A sandbox thread must
// NEVER be reachable through any production-shaped route, and this Worker must
// have no binding that could reach hub-prod. Isolation here is STRUCTURAL
// (Model A: separate Worker, separate DO class, separate instance, no HUB
// binding) — this test proves the structure holds.
import { env } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { get, seedTry } from './helpers.js';

it('the sandbox Worker has NO binding that can reach the production hub', () => {
  // Only the sandbox DO is bound. No HubDO binding, no HUB service binding —
  // there is no object through which sandbox code could touch hub-prod.
  expect(env.SANDBOX).toBeDefined();
  expect(env.HUB).toBeUndefined();
  expect(env.HubDO).toBeUndefined();
  expect(env.HubInternal).toBeUndefined();
});

it('a sandbox thread is reachable ONLY at /try/* — every production-shaped route 404s', async () => {
  const { slug } = await seedTry('A decision that must stay inside the sandbox.');

  // Reachable at its own sandbox routes.
  expect((await get(`/try/${slug}.json`)).status).toBe(200);
  expect((await get(`/try/${slug}/view`)).status).toBe(200);

  // NONE of the production hub's read/listing/export/admin routes exist here,
  // and none of them expose the sandbox thread. (Byte-for-byte, these are the
  // shapes hub-prod serves; on the sandbox Worker they are all not-found.)
  for (const path of [
    '/',                       // hub JSON listing / prototype front door
    '/threads',                // hub thread list
    `/t/${slug}.json`,         // hub export shape
    `/t/${slug}/view`,         // hub viewer shape
    `/t/${slug}/verify`,       // hub verify shape
    `/t/${slug}`,              // hub raw viewer shape
    `/r/${slug}`,              // hub record-by-hash shape
    '/admin/export',           // hub operator export
  ]) {
    const res = await get(path);
    expect(res.status, `${path} must not exist on the sandbox`).toBe(404);
    const body = await res.text();
    expect(body.includes(slug), `${path} must not leak the sandbox slug`).toBe(false);
  }
});

it('the sandbox listing surface does not exist — there is no way to enumerate live threads', async () => {
  const { slug } = await seedTry('Non-enumerable by design.');
  // No GET /try index, no GET /try/ listing.
  expect((await get('/try')).status).toBe(404);
  expect((await get('/try/')).status).toBe(404);
  const idx = await (await get('/try')).text();
  expect(idx.includes(slug)).toBe(false);
});
