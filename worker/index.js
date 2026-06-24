import { ThreadDO } from './thread-do.js';
import { IndexDO } from './index-do.js';
import { scenarioDemoEvents } from './scenario-demo.js';
import { resolveIdentity } from './identity.js';
import * as engine from './engine/index.js';

export { ThreadDO, IndexDO };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const threadStub = (env, id) => env.THREAD.get(env.THREAD.idFromName(id));
const indexStub = (env) => env.INDEX.get(env.INDEX.idFromName('index'));

// Keep the thread index in sync after a write to a thread.
async function registerThread(env, stub) {
  const card = await stub.indexCard();
  if (card && card.id) await indexStub(env).upsert(card);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] === 'api') {
      try {
        // GET /api/me — the resolved identity (for the topbar).
        if (parts[1] === 'me' && request.method === 'GET') {
          const id = await resolveIdentity(request, env);
          return json(id);
        }

        // GET /api/agent/queue — threads humans flagged for autonomous
        // deliberation. Agent-only (the clistahermes service token polls this).
        if (parts[1] === 'agent' && parts[2] === 'queue' && request.method === 'GET') {
          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          if (identity.kind !== 'agent') {
            return json({ error: 'forbidden', reason: 'agent service token required' }, 403);
          }
          return json(await indexStub(env).listFlags());
        }

        // GET /api/threads — the index/ledger
        if (parts[1] === 'threads' && !parts[2] && request.method === 'GET') {
          return json(await indexStub(env).list());
        }

        // POST /api/threads — open a new thread. The creator becomes its first
        // participant (decision owner). Server mints the thread id and the
        // canonical two-event genesis log (ParticipantDeclared → ThreadCreated)
        // and ingests it atomically into a fresh DO. actor_id is identity-bound.
        if (parts[1] === 'threads' && !parts[2] && request.method === 'POST') {
          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          const body = await request.json().catch(() => ({}));
          const title = String(body.title || '').trim();
          const question = String(body.question || '').trim();
          if (question.length < 12) {
            return json({ error: 'invalid', reason: 'a thread needs a question (min 12 chars) — the decision it exists to answer' }, 422);
          }
          const threadId = engine.newId('thd', question);
          const at = engine.nowIso();
          // ingest() chains + validates but (unlike append) does not mint ids, so
          // the genesis events carry their own event_id.
          const genesis = [
            {
              event_id: engine.newId('evt', 'ParticipantDeclared'),
              event_type: 'ParticipantDeclared',
              thread_id: threadId,
              actor_id: identity.actorId,
              timestamp: at,
              payload: {
                participant: {
                  id: identity.actorId,
                  object: 'participant',
                  kind: identity.kind || 'human',
                  name: identity.name,
                  role: 'decision owner',
                },
              },
            },
            {
              event_id: engine.newId('evt', 'ThreadCreated'),
              event_type: 'ThreadCreated',
              thread_id: threadId,
              actor_id: identity.actorId,
              timestamp: at,
              payload: {
                thread: {
                  id: threadId,
                  object: 'thread',
                  title: title || question,
                  question,
                  status: 'active',
                  participantIds: [identity.actorId],
                  createdAt: at,
                  updatedAt: at,
                },
              },
            },
          ];
          const stub = threadStub(env, threadId);
          const result = await stub.ingest(genesis);
          if (result.ok) await registerThread(env, stub);
          return json({ ...result, id: threadId }, result.ok ? 200 : 422);
        }

        if (parts[1] === 'threads' && parts[2]) {
          const threadId = decodeURIComponent(parts[2]);
          const action = parts[3] || '';
          const stub = threadStub(env, threadId);

          if (request.method === 'GET') {
            if (action === 'state') return json(await stub.state(threadId));
            if (action === 'summary') return json(await stub.summary(threadId));
            if (action === 'audit') return json(await stub.audit(threadId));
            if (action === 'validate') return json(await stub.validate());
            // Has this thread been flagged for agent deliberation? (cockpit poll)
            if (action === 'agent-status') {
              const identity = await resolveIdentity(request, env);
              if (!identity.authenticated) {
                return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
              }
              return json(await indexStub(env).flagStatus(threadId));
            }
          }

          if (request.method === 'POST') {
            // All writes require an authenticated participant identity.
            const identity = await resolveIdentity(request, env);
            if (!identity.authenticated) {
              return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
            }
            const body = await request.json().catch(() => ({}));

            // Join: declare the caller as a participant of this thread.
            if (action === 'join') {
              const event = {
                event_type: 'ParticipantDeclared',
                thread_id: threadId,
                actor_id: identity.actorId,
                payload: {
                  participant: {
                    id: identity.actorId,
                    object: 'participant',
                    kind: identity.kind || 'human',
                    name: identity.name,
                    role: body.role || 'contributor',
                  },
                },
              };
              const result = await stub.append(event);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 422);
            }

            // Seed the demo thread with the bundled canonical scenario log.
            if (action === 'seed-demo') {
              const result = await stub.ingest(scenarioDemoEvents);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 409);
            }

            if (action === 'ingest') {
              const result = await stub.ingest(body.events || []);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 422);
            }

            // Purge an ORPHAN thread (no ThreadCreated → not registered). Refuses
            // registered threads to keep legitimate logs append-only.
            if (action === 'purge') {
              const card = await stub.indexCard();
              if (card && card.id) {
                return json(
                  { error: 'refused', reason: 'registered thread is append-only; purge only removes orphan threads' },
                  409
                );
              }
              const result = await stub.purge();
              await indexStub(env).remove(threadId);
              return json(result);
            }

            // Flag this thread for autonomous agent deliberation. Human-only —
            // an agent shouldn't queue work for itself. Requires the thread to
            // exist (be registered) so we don't queue orphans.
            if (action === 'request-agent') {
              if (identity.kind !== 'human') {
                return json({ error: 'forbidden', reason: 'only a human participant can request the agent' }, 403);
              }
              const card = await stub.indexCard();
              if (!card || !card.id) {
                return json({ error: 'not found', reason: 'no such thread' }, 404);
              }
              const result = await indexStub(env).flagForAgent(threadId, identity.actorId, engine.nowIso());
              return json(result, result.ok ? 200 : 422);
            }

            // Agent acknowledges / clears a flag (after picking it up or
            // recording a decision). Agent-only.
            if (action === 'agent-ack') {
              if (identity.kind !== 'agent') {
                return json({ error: 'forbidden', reason: 'agent service token required' }, 403);
              }
              const result = await indexStub(env).clearFlag(threadId);
              return json(result, result.ok ? 200 : 422);
            }

            // Agent reports live deliberation progress (which channel/Raft
            // workspace it took the question to, how many peer agents engaged,
            // phase) so the cockpit can show it. Agent-only. DO metadata, not a
            // protocol event — same boundary the flag queue already respects.
            if (action === 'agent-progress') {
              if (identity.kind !== 'agent') {
                return json({ error: 'forbidden', reason: 'agent service token required' }, 403);
              }
              const result = await indexStub(env).recordAgentProgress(threadId, {
                channel: typeof body.channel === 'string' ? body.channel : null,
                workspaceRef: typeof body.workspaceRef === 'string' ? body.workspaceRef : null,
                responders: typeof body.responders === 'number' ? body.responders : null,
                phase: typeof body.phase === 'string' ? body.phase : null,
                detail: typeof body.detail === 'string' ? body.detail : null,
                at: engine.nowIso(),
              });
              return json(result, result.ok ? 200 : 422);
            }

            if (action === 'append') {
              // Server-authoritative actor: identity decides actor_id, never the client.
              const event = { ...(body.event || body) };
              event.thread_id = event.thread_id || threadId;
              event.actor_id = identity.actorId;
              const result = await stub.append(event);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 422); // fail-closed → 422
            }
          }
        }
        return json({ error: 'not found' }, 404);
      } catch (err) {
        return json({ error: String(err && err.message ? err.message : err) }, 500);
      }
    }

    // Everything else: the built SPA (single-page-application fallback).
    return env.ASSETS.fetch(request);
  },
};
