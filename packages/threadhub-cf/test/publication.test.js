// publication.test.js — publication filtering parity on the Worker. The
// public role sees only effectively-published threads (the LAST publication
// event wins, malformed acts fail closed) on every read surface: /, /threads,
// /t/:slug.json, /t/:slug/verify, /t/:slug/view, /t/:slug, /r/:hash. The
// operator role always sees everything.
import { it, expect } from 'vitest';
import { PUBLIC_404_BODY } from '../../threadhub/src/routes.js';
import { opPost, opGet, pubGet, seedThread, publicationEvent } from './helpers.js';

const expectShared404 = async (res) => {
  expect(res.status).toBe(404);
  expect(await res.text()).toBe(PUBLIC_404_BODY);
};

it('publish → visible everywhere; revoke → gone everywhere; operator unaffected', async () => {
  const { ident, thread } = await seedThread({ title: 'Publish me' });
  const { thread: shadow } = await (async () => {
    const r = await opPost('/threads', { title: 'Never published', author: ident.id });
    return { thread: await r.json() };
  })();

  // --- unpublished: invisible on every public surface ---
  let summary = await (await pubGet('/')).json();
  expect(summary.threads).toEqual([]);
  expect(summary.records).toBe(0); // even the count moves only with published records
  expect(await (await pubGet('/threads')).json()).toEqual([]);
  await expectShared404(await pubGet(`/t/${thread.slug}.json`));
  await expectShared404(await pubGet(`/t/${thread.slug}/verify`));
  await expectShared404(await pubGet(`/t/${thread.slug}/view`));
  await expectShared404(await pubGet(`/t/${thread.slug}`));
  await expectShared404(await pubGet(`/r/${thread.genesisHash}`));

  // --- the witnessed publication act ---
  const pub = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'publish'),
  });
  expect(pub.status).toBe(201);

  // --- published: visible on every public surface ---
  summary = await (await pubGet('/')).json();
  expect(summary.threads.map((t) => t.id)).toEqual([thread.id]);
  expect(summary.records).toBe(2); // genesis + publication act, nothing else
  expect((await (await pubGet('/threads')).json()).map((t) => t.id)).toEqual([thread.id]);

  const chain = await (await pubGet(`/t/${thread.slug}.json`)).json();
  expect(chain.map((e) => e.seq)).toEqual([0, 1]);

  const verify = await (await pubGet(`/t/${thread.slug}/verify`)).json();
  expect(verify).toMatchObject({ valid: true, trusted: false, records: 2 });

  const view = await pubGet(`/t/${thread.slug}/view`);
  expect(view.status).toBe(200);
  expect(view.headers.get('content-type')).toBe('text/html; charset=utf-8');
  expect(await view.text()).toContain('Publish me');

  expect((await pubGet(`/t/${thread.slug}`)).status).toBe(200);

  const rec = await pubGet(`/r/${thread.genesisHash}`);
  expect(rec.status).toBe(200);
  expect((await rec.json()).kind).toBe('genesis');

  // The sibling thread stays invisible: publication is per-thread.
  await expectShared404(await pubGet(`/t/${shadow.slug}.json`));
  await expectShared404(await pubGet(`/r/${shadow.genesisHash}`));

  // --- a malformed act publishes nothing (fail closed) ---
  const badAct = publicationEvent(ident.id, shadow.id, 'publish');
  badAct.payload.threadPublication.scope = 'everyone'; // not the registered scope
  await opPost(`/t/${shadow.slug}/records`, { author: ident.id, kind: 'clista.event', payload: badAct });
  await expectShared404(await pubGet(`/t/${shadow.slug}.json`));

  // --- revoke: the LAST publication event wins ---
  const rev = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'revoke'),
  });
  expect(rev.status).toBe(201);

  summary = await (await pubGet('/')).json();
  expect(summary.threads).toEqual([]);
  expect(summary.records).toBe(0);
  await expectShared404(await pubGet(`/t/${thread.slug}.json`));
  await expectShared404(await pubGet(`/t/${thread.slug}/verify`));
  await expectShared404(await pubGet(`/t/${thread.slug}/view`));
  await expectShared404(await pubGet(`/t/${thread.slug}`));
  await expectShared404(await pubGet(`/r/${thread.genesisHash}`)); // record reads are thread reads

  // --- the operator role was never filtered ---
  const opChain = await (await opGet(`/t/${thread.slug}.json`)).json();
  expect(opChain.length).toBe(3); // genesis + publish + revoke, all witnessed
  expect((await opGet(`/t/${shadow.slug}.json`)).status).toBe(200);
  const opSummary = await (await opGet('/')).json();
  expect(opSummary.records).toBe(5); // total moves with every write for the operator
});
