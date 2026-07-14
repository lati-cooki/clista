// limits.test.js — the abuse controls on POST /try: per-IP rate limit
// (5 / 10 min), the Worker body cap, the decision-size cap, and the honest
// refusal at the thread cap.
import { env } from 'cloudflare:test';
import { it, expect, beforeEach, afterEach } from 'vitest';
import { tryPost, freshIp, resetSandbox } from './helpers.js';

beforeEach(resetSandbox); // clean slate so the cap test isn't polluted by prior threads
afterEach(() => { delete env.SANDBOX_MAX_THREADS; });

it('rate limit: 5 writes succeed on one IP, the 6th is refused 429', async () => {
  const ip = freshIp();
  for (let i = 0; i < 5; i++) {
    const res = await tryPost({ decision: `decision ${i}` }, { ip });
    expect(res.status).toBe(200);
  }
  const sixth = await tryPost({ decision: 'one too many' }, { ip });
  expect(sixth.status).toBe(429);
  expect((await sixth.json()).code).toBe('rate_limited');
});

it('a different IP is not affected by another IP hitting the limit', async () => {
  const res = await tryPost({ decision: 'fresh ip is fine' });
  expect(res.status).toBe(200);
});

it('body cap: an over-ceiling request body is refused 413 (before any work)', async () => {
  const huge = 'x'.repeat(5_000_001);
  const res = await tryPost(huge); // raw oversized string body
  expect(res.status).toBe(413);
  expect((await res.json()).code).toBe('payload_too_large');
});

it('decision cap: a decision beyond the paste ceiling is refused 413', async () => {
  const res = await tryPost({ decision: 'y'.repeat(100_001) });
  expect(res.status).toBe(413);
  expect((await res.json()).code).toBe('payload_too_large');
});

it('empty / missing decision is a 400', async () => {
  expect((await tryPost({ decision: '   ' })).status).toBe(400);
  expect((await tryPost({ title: 'no decision' })).status).toBe(400);
});

it('thread cap: at capacity, POST /try refuses honestly (503 at_capacity)', async () => {
  env.SANDBOX_MAX_THREADS = '2';
  // Distinct IPs so the rate limiter never masks the cap under test.
  expect((await tryPost({ decision: 'one' }, { ip: freshIp() })).status).toBe(200);
  expect((await tryPost({ decision: 'two' }, { ip: freshIp() })).status).toBe(200);
  const third = await tryPost({ decision: 'three' }, { ip: freshIp() });
  expect(third.status).toBe(503);
  expect((await third.json()).code).toBe('at_capacity');
});
