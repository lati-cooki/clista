// e2e.test.js — THE payoff path, end to end, exactly as a stranger runs it:
// POST /try → the pasted decision is a real, signed, hash-chained genesis
// record → GET /try/<slug>/view renders it (with the sandbox banner) → GET
// /try/<slug>.json is the SIGNED export → the REAL, unmodified verify-standalone
// .mjs returns PASS with signatures verified n/n (not 0/n).
import { SELF } from 'cloudflare:test';
import { it, expect } from 'vitest';
import checkerRaw from '../../threadhub/scripts/verify-standalone.mjs?raw';
import { BASE, tryPost, get, seedTry } from './helpers.js';

const DECISION = 'Adopt the new deployment gate: no release without a green anchor check.';

it('POST /try mints a real signed genesis record and returns { slug, headHash, viewUrl }', async () => {
  const res = await tryPost({ decision: DECISION });
  expect(res.status).toBe(200);
  const out = await res.json();
  expect(out.slug).toMatch(/^try-[a-z2-7]{12}$/); // random, non-enumerable
  expect(out.headHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(out.viewUrl).toBe(`/try/${out.slug}/view`);
});

it('the pasted decision is carried verbatim in genesis (seq 0) and the thread is published (seq 1)', async () => {
  const { slug } = await seedTry(DECISION);
  const records = await (await get(`/try/${slug}.json`)).json();
  expect(records.map((r) => r.seq)).toEqual([0, 1]);
  expect(records[0].kind).toBe('genesis');
  expect(records[0].payload.question).toBe(DECISION); // verbatim
  expect(records[1].payload.event_type).toBe('ThreadPublished');
});

it('GET /try/<slug>/view renders the decision behind the sandbox disclosure banner', async () => {
  const { slug } = await seedTry(DECISION);
  const res = await get(`/try/${slug}/view`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  const body = await res.text();
  expect(body).toContain('SANDBOX — ephemeral demonstration');
  expect(body).toContain('not a governance record');
  expect(body).toContain('expires and is deleted within 24 hours');
  expect(body).toContain(DECISION); // the pasted decision is shown
  // The verify panel is repointed to the sandbox's own paths.
  expect(body).toContain(`/try/${slug}.json`);
  expect(body).toContain("import('/try/verify.mjs')");
});

it('the DO serves a SIGNED export (signature + record_hash sidecar on every record)', async () => {
  const { slug, headHash } = await seedTry(DECISION);
  const records = await (await get(`/try/${slug}.json`)).json();

  // Every exported record carries the sidecar (the sandbox's stronger demo —
  // prod exportThread is bare). This sidecar is exactly what makes the real
  // checker report signatures verified n/n rather than 0/n; that the real
  // checker PASSes n/n on such an export is proven in
  // test-node/verify-real-checker.test.js (the checker can't be imported as a
  // module in-pool — it's a Text import in the Worker bundle).
  expect(records.length).toBe(2);
  expect(records.every((r) => /^sha256:[0-9a-f]{64}$/.test(r.record_hash))).toBe(true);
  expect(records.every((r) => typeof r.signature === 'string' && r.signature.length > 0)).toBe(true);
  expect(records[records.length - 1].record_hash).toBe(headHash);
});

it('the view page shows the hub-verified chain badge for the signed thread', async () => {
  const { slug } = await seedTry(DECISION);
  const body = await (await get(`/try/${slug}/view`)).text();
  expect(body).toContain('chain verified · 2 records');
});

it('GET /try/verify.mjs serves the byte-identical repo checker (the same file the stranger saves)', async () => {
  const res = await SELF.fetch(`${BASE}/try/verify.mjs`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
  expect(await res.text()).toBe(checkerRaw);
});
