// In-runtime tests for the triage inbox (Phase 1, all behind Access): the agent
// (emergent seeder) proposes a canonical thread into the inbox; a human triages
// it. The load-bearing assertion is the governance keystone — approving a
// proposal creates a thread OWNED BY THE APPROVING HUMAN, never the agent. Also
// exercises the human-only / agent-only boundaries and that the quarantine never
// leaks: a pending proposal registers no thread until approved.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const ORIGIN = 'https://app.clista.ai';
const EMAIL = 'troylati@gmail.com';
const AGENT = 'clistahermes';

const humanGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-email': EMAIL } });
const humanPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-email': EMAIL, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
const agentGet = (path) => SELF.fetch(`${ORIGIN}${path}`, { headers: { 'x-clista-agent': AGENT } });
const agentPost = (path, body) =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'x-clista-agent': AGENT, 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

const ownerId = async (threadId) => {
  const state = await (await humanGet(`/api/threads/${threadId}/state`)).json();
  const participants = (state.identityState && state.identityState.participants) || [];
  return (participants.find((p) => /owner/.test(p.role || '')) || {}).id;
};

describe('triage inbox — agent proposes, human approves & owns', () => {
  it('agent proposal → owner triages → approve creates a HUMAN-owned thread', async () => {
    const question = 'Should pre-threaded deliberation beat one shared agent thread?';
    const propose = await agentPost('/api/agent/intake', {
      question,
      title: 'Pre-thread vs shared',
      useCases: ['preserved objection chains', 'cross-pollination in #all'],
      tradeoffs: { pros: ['focused provenance'], cons: ['discovery cost'] },
      provenance: [{ surface: 'moltbook', ref: 'post-x', excerpt: 'globalwall asked…' }],
    });
    expect(propose.status).toBe(200);
    const proposeBody = await propose.json();
    expect(proposeBody.ok).toBe(true);
    const itemId = proposeBody.id;
    expect(itemId).toMatch(/^itk_/);

    // Quarantine: the proposal registers NO thread (the index is untouched).
    const beforeList = await (await humanGet('/api/threads')).json();
    expect(beforeList.threads.some((t) => t.question === question)).toBe(false);

    // The owner sees it pending in the inbox.
    const inbox = await (await humanGet('/api/intake')).json();
    const item = inbox.intake.find((i) => i.id === itemId);
    expect(item).toBeTruthy();
    expect(item.source).toBe('agent');
    expect(item.kind).toBe('thread_proposal');
    expect(item.payload.useCases).toContain('preserved objection chains');

    // Approve + hand to the deliberation cron.
    const approve = await humanPost(`/api/intake/${itemId}/approve`, { flag: true });
    expect(approve.status).toBe(200);
    const approveBody = await approve.json();
    expect(approveBody.status).toBe('approved');
    expect(approveBody.flagged).toBe(true);
    const threadId = approveBody.id;
    expect(threadId).toMatch(/^thd_/);

    // The governance keystone: the created thread's decision owner is the
    // APPROVING HUMAN (par_troylati), not the agent.
    expect(await ownerId(threadId)).toBe('par_troylati');

    // And it was handed to the agent queue (flag:true).
    const status = await (await humanGet(`/api/threads/${threadId}/agent-status`)).json();
    expect(status.requested).toBe(true);
    expect(status.requestedBy).toBe('par_troylati');

    // The item is no longer pending.
    const inbox2 = await (await humanGet('/api/intake')).json();
    expect(inbox2.intake.some((i) => i.id === itemId)).toBe(false);

    // Re-approving a resolved item is refused (409).
    const reapprove = await humanPost(`/api/intake/${itemId}/approve`, {});
    expect(reapprove.status).toBe(409);
  });

  it('dismiss clears an item and creates no thread', async () => {
    const { id } = await (
      await agentPost('/api/agent/intake', { question: 'Is this proposal worth dismissing outright?' })
    ).json();
    const dismiss = await humanPost(`/api/intake/${id}/dismiss`, {});
    expect(dismiss.status).toBe(200);
    expect((await dismiss.json()).status).toBe('dismissed');
    const inbox = await (await humanGet('/api/intake')).json();
    expect(inbox.intake.some((i) => i.id === id)).toBe(false);
  });

  it('enforces the triage auth boundaries', async () => {
    // The feeder is agent-only: a human (non-agent) caller is refused.
    const humanPropose = await humanPost('/api/agent/intake', { question: 'A human should not be able to do this' });
    expect(humanPropose.status).toBe(403);

    // The inbox is human-only: an agent service token cannot read it.
    const agentInbox = await agentGet('/api/intake');
    expect(agentInbox.status).toBe(403);

    // (The unauthenticated → 401 path is the shared `if (!identity.authenticated)`
    // guard; not reachable in this harness because DEV_EMAIL resolves a default
    // human identity for header-less requests.)
  });

  it('rejects a too-short proposal question (422)', async () => {
    const res = await agentPost('/api/agent/intake', { question: 'too short' });
    expect(res.status).toBe(422);
  });

  it('approving a non-existent item is a 404', async () => {
    const res = await humanPost('/api/intake/itk_nope/approve', {});
    expect(res.status).toBe(404);
  });
});
