// helpers.js — shared test plumbing. The operator token matches the
// miniflare binding in vitest.config.js (test-only; production uses a
// wrangler secret).
import crypto from 'node:crypto';
import { SELF } from 'cloudflare:test';

export const BASE = 'https://hub.example';
export const TOKEN = 'test-operator-token';
export const OPERATOR = { authorization: `Bearer ${TOKEN}` };

export const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// Operator-authenticated JSON POST.
export async function opPost(path, body, headers = {}) {
  return SELF.fetch(BASE + path, {
    method: 'POST',
    headers: { ...OPERATOR, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

export const opGet = (path) => SELF.fetch(BASE + path, { headers: OPERATOR });
export const pubGet = (path) => SELF.fetch(BASE + path);

// Operator fixture: one custodial identity + one thread. Returns ids.
export async function seedThread({ title = 'A decision record', question = 'What happened?' } = {}) {
  const identRes = await opPost('/identities', { display_name: 'Troy', kind: 'human' });
  if (identRes.status !== 201) throw new Error(`seed identity failed: ${identRes.status}`);
  const ident = await identRes.json();
  const threadRes = await opPost('/threads', { title, question, author: ident.id });
  if (threadRes.status !== 201) throw new Error(`seed thread failed: ${threadRes.status}`);
  const thread = await threadRes.json();
  return { ident, thread };
}

// The witnessed publication act, exactly as ClisTa emits it (shape mirrored
// from the live hub.db records).
export function publicationEvent(actorId, threadId, action) {
  return {
    actor_id: actorId,
    event_type: action === 'publish' ? 'ThreadPublished' : 'ThreadPublicationRevoked',
    payload: {
      threadPublication: {
        action,
        id: 'tpb_test0000000000',
        object: 'threadPublication',
        publishedAt: '2026-07-13T00:00:00Z',
        publishedByParticipantId: actorId,
        scope: 'public-read',
        threadId,
      },
    },
    timestamp: '2026-07-13T00:00:00Z',
  };
}
