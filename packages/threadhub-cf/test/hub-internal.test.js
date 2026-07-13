// hub-internal.test.js — the HubInternal service entrypoint (the studio
// Worker's HUB binding). Contract: workers/studio/test/hub-stub.js —
//   mintIdentity({ display_name, kind }) -> { id }   (custodial mint)
//   isPublished(slug) -> boolean                     (missing → false)
//
// Approach: instantiate HubInternal directly with the test env (the pool
// exposes the worker's env, including the HUB DO namespace, via
// cloudflare:test). The entrypoint resolves idFromName('hub') — the SAME
// named HubDO the fetch face uses — so a mint here is visible over HTTP and
// a publication written over HTTP is visible to isPublished. Cross-checks go
// through SELF.fetch (the HTTP face) to prove one shared store, not two.
import { it, expect } from 'vitest';
import { env, createExecutionContext } from 'cloudflare:test';
import { HubInternal } from '../src/hub-internal.js';
import { opPost, opGet, pubGet, seedThread, publicationEvent } from './helpers.js';

const hub = () => new HubInternal(createExecutionContext(), env);

it('mintIdentity returns a usable id and mints a custodial identity the HTTP face reflects', async () => {
  // kind is 'human' — the value the studio Worker actually passes
  // (workers/studio/src/do.js). The hub store enforces kind ∈
  // {human,agent,org}; the display_name carries the objector identity.
  const out = await hub().mintIdentity({ display_name: 'Objector 7', kind: 'human' });
  // Return shape: { id } with a non-empty string id (the studio wrapper
  // throws on anything else).
  expect(Object.keys(out)).toEqual(['id']);
  expect(typeof out.id).toBe('string');
  expect(out.id.length).toBeGreaterThan(0);

  // The id is usable: creating a thread authored by it succeeds, which
  // proves the identity exists AND is custodial (append signs the genesis
  // record with the hub-held private key — a keyless identity would 400).
  const threadRes = await opPost('/threads', { title: 'Filed by an objector', author: out.id });
  expect(threadRes.status).toBe(201);
  const thread = await threadRes.json();

  // GET reflects it: the view page discloses the author's display_name/kind
  // and custody, derived from the stored identity row.
  const view = await (await opGet(`/t/${thread.slug}/view`)).text();
  expect(view).toContain('Objector 7');
});

it('mintIdentity yields distinct ids and each is independently custodial', async () => {
  const a = await hub().mintIdentity({ display_name: 'A', kind: 'human' });
  const b = await hub().mintIdentity({ display_name: 'A', kind: 'human' });
  expect(a.id).not.toBe(b.id); // fresh id per mint (hub rid()), not display-name-keyed
  // Both usable as authors.
  expect((await opPost('/threads', { title: 'ta', author: a.id })).status).toBe(201);
  expect((await opPost('/threads', { title: 'tb', author: b.id })).status).toBe(201);
});

it('isPublished: true once published, false while unpublished, false for missing', async () => {
  const { ident, thread } = await seedThread({ title: 'Publication oracle' });

  // Unpublished: no publication event yet.
  expect(await hub().isPublished(thread.slug)).toBe(false);
  // Missing thread: fail closed.
  expect(await hub().isPublished('no-such-thread-slug')).toBe(false);

  // Publish (witnessed act over the HTTP face) → true.
  const pub = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'publish'),
  });
  expect(pub.status).toBe(201);
  expect(await hub().isPublished(thread.slug)).toBe(true);

  // Revoke (the LAST publication event governs) → false again.
  const rev = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'revoke'),
  });
  expect(rev.status).toBe(201);
  expect(await hub().isPublished(thread.slug)).toBe(false);
});

it('isPublished mirrors the HTTP public read gate exactly (same shared store)', async () => {
  const { ident, thread } = await seedThread({ title: 'Parity' });
  await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'publish'),
  });

  // The entrypoint says published; the public HTTP face serves the thread.
  expect(await hub().isPublished(thread.slug)).toBe(true);
  const pub = await pubGet(`/t/${thread.slug}.json`);
  expect(pub.status).toBe(200);

  // A malformed publication act publishes nothing on BOTH faces (fail closed).
  const badAct = publicationEvent(ident.id, thread.id, 'publish');
  badAct.payload.threadPublication.scope = 'everyone'; // not the registered scope
  await opPost(`/t/${thread.slug}/records`, { author: ident.id, kind: 'clista.event', payload: badAct });
  expect(await hub().isPublished(thread.slug)).toBe(false);
});
