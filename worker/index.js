import { ThreadDO } from './thread-do.js';

export { ThreadDO };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

function stubFor(env, threadId) {
  return env.THREAD.get(env.THREAD.idFromName(threadId));
}

// Phase 4 replaces this with real participant identity (Cloudflare Access / OAuth).
function actorFrom(request) {
  return request.headers.get('x-clista-actor') || 'par_system';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean); // ['api','threads',':id','state']

    if (parts[0] === 'api') {
      try {
        if (parts[1] === 'threads' && parts[2]) {
          const threadId = decodeURIComponent(parts[2]);
          const action = parts[3] || '';
          const stub = stubFor(env, threadId);

          if (request.method === 'GET') {
            if (action === 'state') return json(await stub.state(threadId));
            if (action === 'summary') return json(await stub.summary(threadId));
            if (action === 'audit') return json(await stub.audit(threadId));
            if (action === 'validate') return json(await stub.validate());
          }

          if (request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            if (action === 'ingest') {
              return json(await stub.ingest(body.events || []));
            }
            if (action === 'append') {
              const event = { ...(body.event || body) };
              event.thread_id = event.thread_id || threadId;
              event.actor_id = event.actor_id || actorFrom(request);
              const result = await stub.append(event);
              return json(result, result.ok ? 200 : 422); // fail-closed → 422
            }
          }
        }
        return json({ error: 'not found' }, 404);
      } catch (err) {
        return json({ error: String(err && err.message ? err.message : err) }, 500);
      }
    }

    // Everything else: the built SPA (with single-page-application fallback).
    return env.ASSETS.fetch(request);
  },
};
