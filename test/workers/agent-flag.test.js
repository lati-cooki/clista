// In-runtime tests for the agent-deliberation flag queue: a human flags a thread
// for the autonomous agent (clistahermes), the agent polls the queue, and clears
// it. Exercises the human-only / agent-only auth boundaries through the real
// Worker router + IndexDO SQLite inside workerd.
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

async function createThread(question) {
  const res = await humanPost('/api/threads', { question });
  return (await res.json()).id;
}

describe('agent deliberation flag queue', () => {
  it('human flags a thread → it appears in the agent queue and status; agent clears it', async () => {
    const id = await createThread('Should the agent deliberation queue round-trip cleanly?');

    // Not flagged yet.
    const before = await (await humanGet(`/api/threads/${id}/agent-status`)).json();
    expect(before.requested).toBe(false);

    // Human requests the agent.
    const flag = await humanPost(`/api/threads/${id}/request-agent`, {});
    expect(flag.status).toBe(200);
    expect((await flag.json()).ok).toBe(true);

    // Status now shows requested, attributed to the human actor.
    const after = await (await humanGet(`/api/threads/${id}/agent-status`)).json();
    expect(after.requested).toBe(true);
    expect(after.requestedBy).toBe('par_troylati');

    // The agent's poll queue lists the thread.
    const queue = await (await agentGet('/api/agent/queue')).json();
    expect(queue.flags.map((f) => f.threadId)).toContain(id);

    // The agent acknowledges/clears the flag.
    const ack = await agentPost(`/api/threads/${id}/agent-ack`, {});
    expect(ack.status).toBe(200);

    // Queue is empty for this thread again.
    const cleared = await (await humanGet(`/api/threads/${id}/agent-status`)).json();
    expect(cleared.requested).toBe(false);
    const queue2 = await (await agentGet('/api/agent/queue')).json();
    expect(queue2.flags.map((f) => f.threadId)).not.toContain(id);
  });

  it('enforces the auth boundaries', async () => {
    const id = await createThread('Do the flag-queue auth boundaries hold under the wrong caller?');

    // An agent cannot queue work for itself.
    const agentReq = await agentPost(`/api/threads/${id}/request-agent`, {});
    expect(agentReq.status).toBe(403);

    // A human cannot read the agent poll queue.
    const humanQueue = await humanGet('/api/agent/queue');
    expect(humanQueue.status).toBe(403);

    // A human cannot ack/clear a flag (agent-only).
    await humanPost(`/api/threads/${id}/request-agent`, {});
    const humanAck = await humanPost(`/api/threads/${id}/agent-ack`, {});
    expect(humanAck.status).toBe(403);
  });

  it('refuses to flag a thread that does not exist (404)', async () => {
    const res = await humanPost('/api/threads/thd_does_not_exist/request-agent', {});
    expect(res.status).toBe(404);
  });
});
