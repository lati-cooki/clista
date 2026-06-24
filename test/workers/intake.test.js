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

// The PUBLIC submission route: POST /api/intake (no auth). Turnstile is skipped
// in tests (no TURNSTILE_SECRET binding), so these exercise validation, the
// quarantine boundary, CORS, rate-limiting, and that approval still yields a
// human-owned thread.
describe('public intake route', () => {
  const publicPost = (body, headers) =>
    SELF.fetch(`${ORIGIN}/api/intake`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(headers || {}) },
      body: JSON.stringify(body || {}),
    });

  it('accepts a public decision → quarantined pending, registers no thread', async () => {
    const question = 'Should an external team be able to submit a decision here?';
    const res = await publicPost({ kind: 'decision', question, handle: 'someone@elsewhere.test' });
    expect(res.status).toBe(200);
    const receipt = (await res.json()).receipt;
    expect(receipt).toMatch(/^itk_/);

    // It does NOT register a thread (quarantine).
    const threads = await (await humanGet('/api/threads')).json();
    expect(threads.threads.some((t) => t.question === question)).toBe(false);

    // The owner sees it, tagged source 'public'; the submitter handle is carried
    // but is display-only (never an actor).
    const inbox = await (await humanGet('/api/intake')).json();
    const item = inbox.intake.find((i) => i.id === receipt);
    expect(item.source).toBe('public');
    expect(item.kind).toBe('decision');
    expect(item.submitter).toBe('someone@elsewhere.test');

    // Approving it still creates a thread owned by the approving HUMAN.
    const approve = await humanPost(`/api/intake/${receipt}/approve`, {});
    expect(approve.status).toBe(200);
    expect(await ownerId((await approve.json()).id)).toBe('par_troylati');
  });

  it('accepts a run_report submission', async () => {
    const res = await publicPost({ kind: 'run_report', title: 'A run', body: 'We ran the debate pack on a real decision and here is what happened.' });
    expect(res.status).toBe(200);
  });

  it('rejects unknown kinds, short decisions, malformed and oversize bodies', async () => {
    expect((await publicPost({ kind: 'thread_proposal', question: 'agents cannot self-promote publicly' })).status).toBe(422);
    expect((await publicPost({ kind: 'decision', question: 'too short' })).status).toBe(422);

    const bad = await SELF.fetch(`${ORIGIN}/api/intake`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' });
    expect(bad.status).toBe(400);

    const huge = 'x'.repeat(20 * 1024);
    expect((await publicPost({ kind: 'run_report', body: huge })).status).toBe(413);
  });

  it('answers the CORS preflight and tags responses with the allowed origin', async () => {
    const pre = await SELF.fetch(`${ORIGIN}/api/intake`, { method: 'OPTIONS', headers: { origin: 'https://gate.clista.ai' } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe('https://gate.clista.ai');

    const res = await publicPost({ kind: 'decision', question: 'Does the CORS header come back on the POST too?' }, { origin: 'https://gate.clista.ai' });
    expect(res.headers.get('access-control-allow-origin')).toBe('https://gate.clista.ai');
  });

  it('rate-limits a single IP after the window allowance', async () => {
    const ip = { 'cf-connecting-ip': '203.0.113.7' };
    let last;
    for (let i = 0; i < 6; i++) {
      last = await publicPost({ kind: 'decision', question: `Rate limit probe number ${i} for the public route` }, ip);
    }
    expect(last.status).toBe(429);
  });

  it('run_report approve → a human-owned thread with the report attested as evidence', async () => {
    const sub = await publicPost({
      kind: 'run_report',
      title: 'Our vendor run',
      body: 'We ran the debate pack on a vendor decision; here are the artifacts and the outcome.',
      handle: 'team@elsewhere.test',
    });
    const receipt = (await sub.json()).receipt;
    const approve = await humanPost(`/api/intake/${receipt}/approve`, {});
    expect(approve.status).toBe(200);
    const body = await approve.json();
    expect(body.attested).toBe(true);
    expect(await ownerId(body.id)).toBe('par_troylati');
    // The report landed as evidence with its external origin preserved (the
    // append fails closed, so a present source proves it validated).
    const state = await (await humanGet(`/api/threads/${body.id}/state`)).json();
    expect(JSON.stringify(state)).toContain(`public run report ${receipt}`);
  });

  it('contribution approve → evidence appended onto the existing target thread', async () => {
    const targetId = (await (await humanPost('/api/threads', { question: 'A target thread for an external contribution attestation' })).json()).id;
    const sub = await publicPost({
      kind: 'contribution',
      targetThreadId: targetId,
      body: 'An outside reviewer notes the staffing estimate omits on-call load.',
    });
    expect(sub.status).toBe(200);
    const receipt = (await sub.json()).receipt;

    const approve = await humanPost(`/api/intake/${receipt}/approve`, {});
    expect(approve.status).toBe(200);
    const body = await approve.json();
    expect(body.id).toBe(targetId); // attaches to the target, creates no new thread
    expect(body.attested).toBe(true);
    const state = await (await humanGet(`/api/threads/${targetId}/state`)).json();
    expect(JSON.stringify(state)).toContain(`public submission ${receipt}`);
  });

  it('rejects a public contribution to a non-existent thread (404)', async () => {
    const res = await publicPost({ kind: 'contribution', targetThreadId: 'thd_nope', body: 'this should be refused at submit time' });
    expect(res.status).toBe(404);
  });
});
