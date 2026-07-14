// Thin client for the Worker API. Same-origin (served by the Worker under
// `wrangler dev` / production). Each call returns { ok, status, data }.

// Local-dev identity: the Worker only honors this header when DEV_IDENTITY=true
// (.dev.vars). In production, identity comes from Cloudflare Access and this is
// ignored. Override via localStorage('clista_dev_email').
export function devEmail() {
  try {
    return localStorage.getItem('clista_dev_email') || 'troylati@gmail.com';
  } catch {
    return 'troylati@gmail.com';
  }
}

async function req(path, opts = {}) {
  const headers = { 'x-clista-email': devEmail(), ...(opts.headers || {}) };
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const enc = encodeURIComponent;
const postJson = (path, body) => req(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });

export const api = {
  me: () => req('/api/me'),
  listThreads: () => req('/api/threads'),
  portfolio: () => req('/api/portfolio'),
  rebuildPortfolio: () => req('/api/portfolio/rebuild', { method: 'POST' }),
  createThread: (title, question) => postJson('/api/threads', { title, question }),
  state: (id) => req(`/api/threads/${enc(id)}/state`),
  summary: (id) => req(`/api/threads/${enc(id)}/summary`),
  audit: (id) => req(`/api/threads/${enc(id)}/audit`),
  validate: (id) => req(`/api/threads/${enc(id)}/validate`),
  seedDemo: (id) => req(`/api/threads/${enc(id)}/seed-demo`, { method: 'POST' }),
  seedVendorDd: (id) => req(`/api/threads/${enc(id)}/seed-vendor-dd`, { method: 'POST' }),
  seedPharmaPhaseGate: (id) => req(`/api/threads/${enc(id)}/seed-pharma-phase-gate`, { method: 'POST' }),
  join: (id, role) => postJson(`/api/threads/${enc(id)}/join`, { role }),
  append: (id, event) => postJson(`/api/threads/${enc(id)}/append`, { event }),
  // The owner's triage inbox: proposals/submissions awaiting judgement.
  listIntake: () => req('/api/intake'),
  approveIntake: (id, opts) => postJson(`/api/intake/${enc(id)}/approve`, opts || {}),
  dismissIntake: (id, opts) => postJson(`/api/intake/${enc(id)}/dismiss`, opts || {}),
};

export const DEMO_THREAD_ID = 'thd_scenario_demo';
export const VENDOR_DD_THREAD_ID = 'thd_vendor_dd_baas_partner_eval';
export const PHARMA_PHASE_GATE_THREAD_ID = 'thd_phase2_to_phase3_go_nogo_ltn_4481';

// Canonical bundled decisions that auto-seed into their (empty) thread the first
// time the cockpit opens them. Keyed by thread id → the seed call that ingests
// the bundled log server-side.
export const SEEDABLE_THREADS = {
  [DEMO_THREAD_ID]: api.seedDemo,
  [VENDOR_DD_THREAD_ID]: api.seedVendorDd,
  [PHARMA_PHASE_GATE_THREAD_ID]: api.seedPharmaPhaseGate,
};
