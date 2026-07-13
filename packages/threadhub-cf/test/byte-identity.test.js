// byte-identity.test.js — the crown jewel. To an unauthenticated observer,
// every negative surface answers the SAME 404: same status, same
// content-type, byte-identical body. A missing route, an unpublished
// thread, a missing record, a token-less write, a wrong-token write, and
// the admin plane must be indistinguishable — no auth oracle, no route
// oracle, no existence oracle. Plus: the write gate must answer BEFORE the
// request body is consumed, /verify.mjs must serve the repo file's exact
// bytes, and every response must carry Cache-Control: no-store.
import { SELF } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { PUBLIC_404_BODY } from '../../threadhub/src/routes.js';
import checkerSource from '../../threadhub/scripts/verify-standalone.mjs?raw';
import { BASE, sha256, opPost, seedThread } from './helpers.js';

const JSON_TYPE = 'application/json; charset=utf-8';

it('PUBLIC_404_BODY is the pinned bytes', () => {
  expect(PUBLIC_404_BODY).toBe(JSON.stringify({ error: 'not found', code: 'not_found' }, null, 2));
});

it('every public-role failure surface answers byte-identical 404s', async () => {
  const { thread } = await seedThread({ title: 'Unpublished secret' }); // exists, never published

  const probes = [
    ['unknown route', () => SELF.fetch(`${BASE}/no/such/route`)],
    ['unpublished /t/:slug.json', () => SELF.fetch(`${BASE}/t/${thread.slug}.json`)],
    ['unpublished /t/:slug/verify', () => SELF.fetch(`${BASE}/t/${thread.slug}/verify`)],
    ['unpublished /t/:slug/view', () => SELF.fetch(`${BASE}/t/${thread.slug}/view`)],
    ['unpublished /t/:slug viewer', () => SELF.fetch(`${BASE}/t/${thread.slug}`)],
    ['missing /r/:hash', () => SELF.fetch(`${BASE}/r/sha256:${'0'.repeat(64)}`)],
    ['existing record on unpublished thread', () => SELF.fetch(`${BASE}/r/${thread.genesisHash}`)],
    ['token-less POST /threads', () => SELF.fetch(`${BASE}/threads`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'probe', author: 'id_x' }),
    })],
    ['wrong-token POST /threads', () => SELF.fetch(`${BASE}/threads`, {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-token', 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'probe', author: 'id_x' }),
    })],
    ['token-less POST /admin/import', () => SELF.fetch(`${BASE}/admin/import`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identities: [], threads: [], records: [] }),
    })],
    ['token-less GET /admin/export', () => SELF.fetch(`${BASE}/admin/export`)],
    ['token-less PUT', () => SELF.fetch(`${BASE}/t/${thread.slug}/records`, { method: 'PUT' })],
    ['token-less DELETE', () => SELF.fetch(`${BASE}/t/${thread.slug}`, { method: 'DELETE' })],
  ];

  const expectedSha = sha256(PUBLIC_404_BODY);
  for (const [name, probe] of probes) {
    const res = await probe();
    expect(res.status, name).toBe(404);
    expect(res.headers.get('content-type'), name).toBe(JSON_TYPE);
    expect(sha256(await res.text()), name).toBe(expectedSha);
  }
});

it('an unauthorized POST answers before the request body is read', async () => {
  // A client-side pull spy cannot see the receiver: the service-binding
  // pump pulls the stream at the SENDER whether or not the Worker reads.
  // So the oracle is behavioral: a body that NEVER ends. If the front door
  // read the body before gating (request.text() awaits the end of the
  // stream), this request could not be answered inside the test timeout.
  // The shared 404 arriving while the body is still open IS the proof.
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"title":'));
      // ...and then nothing, forever. The stream never closes.
    },
    pull() { return new Promise(() => {}); },
  }, { highWaterMark: 0 });

  const res = await SELF.fetch(`${BASE}/threads`, {
    method: 'POST', body, duplex: 'half',
    headers: { 'content-type': 'application/json' },
  });
  expect(res.status).toBe(404);
  expect(await res.text()).toBe(PUBLIC_404_BODY);

  // Control: the same transport WITH operator auth does read the body —
  // the error names the author parsed OUT of the body, proving both that
  // the oracle can distinguish and that only auth changes the behavior.
  const controlBody = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify({ title: 'probe', author: 'id_missing' })));
      controller.close();
    },
  });
  const control = await SELF.fetch(`${BASE}/threads`, {
    method: 'POST', body: controlBody, duplex: 'half',
    headers: { authorization: 'Bearer test-operator-token', 'content-type': 'application/json' },
  });
  expect(control.status).toBe(404);
  expect((await control.json()).error).toContain('id_missing'); // body was parsed
});

it('/verify.mjs serves the repo file bytes, sha256-identical', async () => {
  const res = await SELF.fetch(`${BASE}/verify.mjs`);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
  const served = await res.text();
  expect(sha256(served)).toBe(sha256(checkerSource));
  expect(served.length).toBeGreaterThan(1000); // a real checker, not a stub
});

it('every response carries Cache-Control: no-store (revocation must beat any cache)', async () => {
  const { ident, thread } = await seedThread({ title: 'Cached never' });
  const responses = [
    await SELF.fetch(`${BASE}/`),
    await SELF.fetch(`${BASE}/threads`),
    await SELF.fetch(`${BASE}/verify.mjs`),
    await SELF.fetch(`${BASE}/t/${thread.slug}.json`), // public 404 — headers uniform there too
    await SELF.fetch(`${BASE}/no/such/route`),
    await opPost(`/t/${thread.slug}/records`, { author: ident.id, kind: 'note', payload: { x: 1 } }),
    await SELF.fetch(`${BASE}/threads`, { method: 'POST' }), // gated write
  ];
  for (const res of responses) {
    expect(res.headers.get('cache-control')).toBe('no-store');
  }
});
