// Thin client for the Worker API. Same-origin (served by the Worker under
// `wrangler dev` / production). Each call returns { ok, status, data }.
async function req(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const enc = encodeURIComponent;

export const api = {
  listThreads: () => req('/api/threads'),
  state: (id) => req(`/api/threads/${enc(id)}/state`),
  summary: (id) => req(`/api/threads/${enc(id)}/summary`),
  audit: (id) => req(`/api/threads/${enc(id)}/audit`),
  validate: (id) => req(`/api/threads/${enc(id)}/validate`),
  seedDemo: (id) => req(`/api/threads/${enc(id)}/seed-demo`, { method: 'POST' }),
  append: (id, event, actor) =>
    req(`/api/threads/${enc(id)}/append`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(actor ? { 'x-clista-actor': actor } : {}) },
      body: JSON.stringify({ event }),
    }),
};

export const DEMO_THREAD_ID = 'thd_scenario_demo';
