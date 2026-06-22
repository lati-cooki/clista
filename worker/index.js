import { ThreadDO } from './thread-do.js';
import { IndexDO } from './index-do.js';
import { scenarioDemoEvents } from './scenario-demo.js';

export { ThreadDO, IndexDO };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const threadStub = (env, id) => env.THREAD.get(env.THREAD.idFromName(id));
const indexStub = (env) => env.INDEX.get(env.INDEX.idFromName('index'));

// Phase 4 replaces this with real participant identity (Cloudflare Access / OAuth).
function actorFrom(request) {
  return request.headers.get('x-clista-actor') || 'par_system';
}

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
            const body = await request.json().catch(() => ({}));

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
              const event = { ...(body.event || body) };
              event.thread_id = event.thread_id || threadId;
              event.actor_id = event.actor_id || actorFrom(request);
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
