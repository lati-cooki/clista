// turnstile.test.js — the pluggable bot-protection seam. Its posture is a pure
// function of whether a secret is configured:
//   • unset  → allow (test / pre-widget), so POST /try works with no widget;
//   • set    → fail closed on a missing/invalid token;
//   • set + valid token → siteverify verdict honored.
// The seam is verified both as a unit (verifyTurnstile) and through POST /try.
import { env } from 'cloudflare:test';
import { it, expect, afterEach } from 'vitest';
import { verifyTurnstile } from '../src/turnstile.js';
import { tryPost } from './helpers.js';

afterEach(() => { delete env.TURNSTILE_SECRET; });

// --- unit: the seam function ---
it('unset secret → allow (no-op), no siteverify call', async () => {
  let called = false;
  const spy = async () => { called = true; return { success: true }; };
  const r = await verifyTurnstile({ secret: undefined, token: undefined }, spy);
  expect(r.ok).toBe(true);
  expect(r.reason).toBe('turnstile-disabled');
  expect(called).toBe(false);
});

it('set secret + missing token → fail closed, no siteverify call', async () => {
  let called = false;
  const spy = async () => { called = true; return { success: true }; };
  const r = await verifyTurnstile({ secret: 'S', token: '' }, spy);
  expect(r.ok).toBe(false);
  expect(r.reason).toBe('missing-token');
  expect(called).toBe(false);
});

it('set secret + present token → honors siteverify verdict', async () => {
  const pass = await verifyTurnstile({ secret: 'S', token: 'tok' }, async () => ({ success: true }));
  expect(pass.ok).toBe(true);
  const fail = await verifyTurnstile({ secret: 'S', token: 'tok' }, async () => ({ success: false }));
  expect(fail.ok).toBe(false);
  expect(fail.reason).toBe('siteverify-fail');
});

it('set secret + siteverify transport error → fail closed (outage is not an open door)', async () => {
  const r = await verifyTurnstile({ secret: 'S', token: 'tok' }, async () => { throw new Error('down'); });
  expect(r.ok).toBe(false);
  expect(r.reason).toBe('siteverify-error');
});

// --- integration: through the Worker's POST /try ---
it('with TURNSTILE_SECRET set, POST /try without a token is refused 403 (fail closed)', async () => {
  env.TURNSTILE_SECRET = 'a-configured-secret';
  const res = await tryPost({ decision: 'no token supplied' });
  expect(res.status).toBe(403);
  expect((await res.json()).code).toBe('turnstile_failed');
});

it('with TURNSTILE_SECRET unset (default), POST /try succeeds without a token', async () => {
  const res = await tryPost({ decision: 'no widget yet, allowed' });
  expect(res.status).toBe(200);
});
