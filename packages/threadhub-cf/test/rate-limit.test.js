// rate-limit.test.js — the 120-writes/min sliding window lives in the DO
// (per-IP via CF-Connecting-IP, faithful port of routes.rateLimiter). The
// operator hits it; the public role can NEVER reach it on a POST, because
// the byte-identical 404 gate answers first — a 429 to an unauthenticated
// prober would itself be a write-route oracle.
import { SELF } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { PUBLIC_404_BODY } from '../../threadhub/src/routes.js';
import { BASE, OPERATOR } from './helpers.js';

const JSON_TYPE = 'application/json; charset=utf-8';
const RATE_LIMITED_BODY = JSON.stringify({ error: 'rate limit exceeded', code: 'rate_limited' }, null, 2);

const post = (ip, headers = {}) => SELF.fetch(`${BASE}/threads`, {
  method: 'POST',
  headers: { 'cf-connecting-ip': ip, 'content-type': 'application/json', ...headers },
  body: JSON.stringify({ title: 'probe', author: 'id_missing' }),
});

it('operator writes hit the 120/min per-IP limiter; the public role never can', async () => {
  const ip = '203.0.113.7';

  // 120 operator POSTs are admitted by the limiter (they 404 on the
  // unknown author — the limiter charges the attempt either way).
  for (let i = 0; i < 120; i++) {
    const res = await post(ip, OPERATOR);
    expect(res.status).toBe(404);
  }

  // The 121st is rate limited, with today's exact bytes.
  const limited = await post(ip, OPERATOR);
  expect(limited.status).toBe(429);
  expect(limited.headers.get('content-type')).toBe(JSON_TYPE);
  expect(await limited.text()).toBe(RATE_LIMITED_BODY);

  // Another IP is a separate window: the operator writes on.
  const otherIp = await post('198.51.100.9', OPERATOR);
  expect(otherIp.status).toBe(404); // unknown author, NOT 429

  // A public POST from the exhausted IP answers the shared 404 bytes —
  // the write gate fires before the limiter is ever consulted.
  const publicPost = await post(ip);
  expect(publicPost.status).toBe(404);
  expect(await publicPost.text()).toBe(PUBLIC_404_BODY);

  // And the gate consumed no limiter budget: the operator's next request
  // from the exhausted IP is still 429 (the window did not move for the
  // public probe, it is simply still exhausted).
  const stillLimited = await post(ip, OPERATOR);
  expect(stillLimited.status).toBe(429);
  expect(await stillLimited.text()).toBe(RATE_LIMITED_BODY);

  // Reads stay unmetered: the viewer and verification are the product
  // surface even under write pressure.
  const read = await SELF.fetch(`${BASE}/`, { headers: { 'cf-connecting-ip': ip } });
  expect(read.status).toBe(200);
});
