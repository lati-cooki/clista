// In-runtime test for the index-projection hide/unhide routes. Hiding is DO
// metadata only: the card leaves the default ledger listing, the thread stays
// resolvable by id, and the append-only log is untouched. ?hidden=1 is the
// audit view that still shows the card with its hidden flag.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const EMAIL = 'troylati@gmail.com';
const ORIGIN = 'https://app.clista.ai';
const authGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const authPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

async function createThread(question) {
  const res = await authPost('/api/threads', { question });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  return body.id;
}

describe('thread hide/unhide', () => {
  it('hides a card from the default listing, keeps it in the audit view, and unhides', async () => {
    const id = await createThread('Should superseded example threads leave the ledger listing?');

    const before = await (await authGet('/api/threads')).json();
    expect(before.threads.some((t) => t.id === id)).toBe(true);

    const hide = await authPost(`/api/threads/${id}/hide`, {});
    expect(hide.status).toBe(200);
    expect(await hide.json()).toMatchObject({ ok: true, id, hidden: true });

    const after = await (await authGet('/api/threads')).json();
    expect(after.threads.some((t) => t.id === id)).toBe(false);

    const audit = await (await authGet('/api/threads?hidden=1')).json();
    const card = audit.threads.find((t) => t.id === id);
    expect(card).toBeTruthy();
    expect(card.hidden).toBe(1);

    // The thread itself is untouched — still resolvable by id.
    const state = await (await authGet(`/api/threads/${id}/state`)).json();
    expect(state.thread?.id ?? state.id).toBe(id);

    const unhide = await authPost(`/api/threads/${id}/unhide`, {});
    expect(unhide.status).toBe(200);
    const restored = await (await authGet('/api/threads')).json();
    expect(restored.threads.some((t) => t.id === id)).toBe(true);
  });

  it('refuses ids that are not in the index', async () => {
    // (The unauthenticated → 401 path is the shared guard on every thread
    // write; DEV_IDENTITY in this environment authenticates all callers.)
    const missing = await authPost('/api/threads/thd_never_registered/hide', {});
    expect(missing.status).toBe(422);
    expect((await missing.json()).reason).toBe('not in index');
  });
});
