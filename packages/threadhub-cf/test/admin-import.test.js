// admin-import.test.js — the cutover path. The committed fixture is a
// --strip-private-keys export of the REAL hub.db (private PEMs never land
// in git; stripping is safe because every record embeds author_key, so
// signature verification needs no private key). Import must land rows
// VERBATIM, every imported thread must verify valid:true, every head must
// match the golden list generated from the same database, and re-import
// must be a no-op.
import { SELF } from 'cloudflare:test';
import { it, expect } from 'vitest';
import fixture from './fixtures/hub-export.json';
import goldenHeads from './fixtures/golden-heads.json';
import { opPost, opGet } from './helpers.js';

it('imports the real hub.db fixture: verbatim rows, golden heads, idempotent re-import', async () => {
  // The fixture is the stripped real thing.
  expect(fixture.identities.length).toBeGreaterThan(0);
  expect(fixture.identities.every((i) => i.private_key === null)).toBe(true);
  expect(goldenHeads.length).toBe(fixture.threads.length);

  // The two witnessed publication-act heads the plan pins by name.
  for (const prefix of ['sha256:01add139', 'sha256:fb388e31']) {
    expect(goldenHeads.some((h) => h.head.startsWith(prefix)), prefix).toBe(true);
  }

  // --- import ---
  const res = await opPost('/admin/import', fixture);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    imported: {
      identities: fixture.identities.length,
      threads: fixture.threads.length,
      records: fixture.records.length,
    },
    skipped: { identities: 0, threads: 0, records: 0 },
  });

  // --- every thread verifies, every head matches gold ---
  for (const gold of goldenHeads) {
    const verify = await (await opGet(`/t/${encodeURIComponent(gold.slug)}/verify`)).json();
    expect(verify.valid, gold.slug).toBe(true);
    expect(verify.trusted, gold.slug).toBe(false);
    expect(verify.records, gold.slug).toBe(gold.records);
    expect(verify.head, gold.slug).toBe(gold.head);
  }

  // The instance total is exactly the imported record count.
  const summary = await (await opGet('/')).json();
  expect(summary.records).toBe(fixture.records.length);

  // --- rows landed VERBATIM: /admin/export round-trips the payload ---
  // (same pinned ordering on both sides — this is the cutover byte-diff.)
  const exported = await (await opGet('/admin/export')).json();
  expect(exported).toStrictEqual(fixture);

  // --- idempotent: re-import skips everything, duplicates nothing ---
  const again = await opPost('/admin/import', fixture);
  expect(again.status).toBe(200);
  expect(await again.json()).toEqual({
    imported: { identities: 0, threads: 0, records: 0 },
    skipped: {
      identities: fixture.identities.length,
      threads: fixture.threads.length,
      records: fixture.records.length,
    },
  });
  const after = await (await opGet('/')).json();
  expect(after.records).toBe(fixture.records.length);
});

it('import surfaces malformed bodies exactly like any matched POST route', async () => {
  const bad = await opPost('/admin/import', null, {}); // JSON null body
  // null body → routes-style body semantics: {} would import nothing; null is rejected
  expect(bad.status).toBe(400);
  expect((await bad.json()).code).toBe('bad_request');

  const notJson = await SELF.fetch('https://hub.example/admin/import', {
    method: 'POST',
    headers: { authorization: 'Bearer test-operator-token', 'content-type': 'application/json' },
    body: '{nope',
  });
  expect(notJson.status).toBe(400);
  expect((await notJson.json()).code).toBe('bad_request');
});
