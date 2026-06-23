import { ThreadDO } from './thread-do.js';
import { IndexDO } from './index-do.js';
import { scenarioDemoEvents } from './scenario-demo.js';
import { resolveIdentity } from './identity.js';

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

        // GET /api/threads — the index/ledger
        if (parts[1] === 'threads' && !parts[2] && request.method === 'GET') {
          return json(await indexStub(env).list());
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
