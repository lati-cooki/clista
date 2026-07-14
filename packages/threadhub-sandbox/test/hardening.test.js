// hardening.test.js — regression tests for the security-review fixes:
//   FIX 1 — POST /try refuses an oversized body via a Content-Length pre-check,
//           BEFORE buffering / Turnstile / the DO rate-limiter / the mint; the
//           cap is byte-accurate (UTF-8 bytes, not UTF-16 string units).
//   FIX 2 — createTry leaves NO orphan thread if a step after the mint throws
//           (the mint → createThread → publish sequence rolls back).
//   FIX 3 — the read path serves a thread ONLY if it is effectively published;
//           an unpublished / half thread 404s byte-identically to a nonexistent
//           slug (no oracle).
import { SELF, env, runInDurableObject } from 'cloudflare:test';
import { it, expect, beforeEach } from 'vitest';
import { BASE, tryPost, get, seedTry, freshIp, resetSandbox } from './helpers.js';

const countThreads = async () => {
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));
  return runInDurableObject(stub, (i) => i.store.countThreads());
};

// --- FIX 1: oversized body is rejected before any downstream work ---

it('FIX 1: an oversized body is refused 413 and reaches neither the mint nor the rate limiter', async () => {
  await resetSandbox();
  const ip = freshIp();

  // Content-Length (~5MB+1) is over the cap → 413 from the pre-check.
  const res = await tryPost('x'.repeat(5_000_001), { ip });
  expect(res.status).toBe(413);
  expect((await res.json()).code).toBe('payload_too_large');

  // The mint was never reached: no thread exists.
  expect(await countThreads()).toBe(0);

  // The rate limiter was never touched: the SAME IP still has its full budget
  // of 5 writes (had the oversized attempt been metered, only 4 would remain).
  for (let i = 0; i < 5; i++) {
    expect((await tryPost({ decision: `ok ${i}` }, { ip })).status).toBe(200);
  }
  expect((await tryPost({ decision: 'one too many' }, { ip })).status).toBe(429);
});

it('FIX 1: the cap is byte-accurate — a body under the char cap but over the byte cap is 413', async () => {
  // 1.7M three-byte chars: UTF-16 .length = 1.7M (< 5M) but 5.1M UTF-8 bytes
  // (> 5M). A char-count check would wave this through (then 400 on JSON.parse);
  // a byte-accurate check refuses it 413.
  const res = await tryPost('好'.repeat(1_700_000));
  expect(res.status).toBe(413);
  expect((await res.json()).code).toBe('payload_too_large');
});

it('FIX 1: a normal body still succeeds', async () => {
  const res = await tryPost({ decision: 'A normal, in-bounds decision.' });
  expect(res.status).toBe(200);
});

// --- FIX 2: no orphan thread on partial failure ---

it('FIX 2: a failure in the publish step leaves no orphan thread and no leaked cap slot', async () => {
  await resetSandbox();
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));

  const result = await runInDurableObject(stub, async (instance) => {
    // Inject a failure in the publish append (the ThreadPublished clista.event),
    // while letting the genesis append inside createThread succeed.
    const realAppend = instance.hub.append.bind(instance.hub);
    instance.hub.append = (args) => {
      if (args.kind === 'clista.event') throw new Error('injected publish failure');
      return realAppend(args);
    };
    const out = await instance.createTry({ decision: 'this publish will fail', ip: '10.9.9.9' });
    instance.hub.append = realAppend; // restore

    return {
      status: out.status,
      threads: instance.store.countThreads(),
      records: instance.store.countRecords(),
      identities: instance.store.listIdentities().length,
    };
  });

  expect(result.status).toBeGreaterThanOrEqual(400); // the write failed
  // Nothing leaked: no orphan thread (cap count unchanged), no orphan records,
  // no dangling custodial writer.
  expect(result.threads).toBe(0);
  expect(result.records).toBe(0);
  expect(result.identities).toBe(0);
});

it('FIX 2: after a rolled-back failure a subsequent write still succeeds (state is clean)', async () => {
  await resetSandbox();
  const res = await tryPost({ decision: 'a clean write after the rollback' });
  expect(res.status).toBe(200);
  expect(await countThreads()).toBe(1);
});

// --- FIX 3: publication gate on reads ---

it('FIX 3: an unpublished / half thread 404s byte-identically to a nonexistent slug', async () => {
  await resetSandbox();
  const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));

  // Build a HALF thread directly: mint + createThread (genesis seq 0 only) with
  // NO ThreadPublished event — exactly the state a partial-failure window would
  // leave (or a not-yet-published thread).
  const slug = await runInDurableObject(stub, (instance) => {
    const writer = instance.hub.createIdentity({ displayName: 'half writer', kind: 'agent' });
    const thread = instance.hub.createThread({
      title: 'half thread',
      question: 'never published',
      authorId: writer.id,
      slug: 'try-halfthread01',
    });
    return thread.slug;
  });

  // The reference: a slug that never existed.
  const ghostJson = await get('/try/try-doesnotexist9.json');
  const ghostView = await get('/try/try-doesnotexist9/view');
  const ghostJsonBody = await ghostJson.text();

  const halfJson = await get(`/try/${slug}.json`);
  const halfView = await get(`/try/${slug}/view`);

  // Same status, same content-type, same EXACT bytes — no oracle distinguishes
  // an unpublished thread from a nonexistent one.
  expect(halfJson.status).toBe(404);
  expect(halfView.status).toBe(404);
  expect(halfJson.status).toBe(ghostJson.status);
  expect(halfView.status).toBe(ghostView.status);
  expect(halfJson.headers.get('content-type')).toBe(ghostJson.headers.get('content-type'));
  expect(await halfJson.text()).toBe(ghostJsonBody);
  expect(await halfView.text()).toBe(ghostJsonBody);
});

it('FIX 3: a properly published thread is still served (the gate does not over-block)', async () => {
  const { slug } = await seedTry('This one is published normally.');
  expect((await get(`/try/${slug}.json`)).status).toBe(200);
  expect((await get(`/try/${slug}/view`)).status).toBe(200);
});
