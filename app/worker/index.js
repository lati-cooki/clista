import { ThreadDO } from './thread-do.js';
import { IndexDO } from './index-do.js';
import { scenarioDemoEvents } from './scenario-demo.js';
import { vendorDueDiligenceEvents } from './vendor-dd.js';
import { pharmaPhaseGateEvents } from './pharma-phase-gate.js';
import { examples as exampleRegistry } from './examples/index.js';
import { resolveIdentity } from './identity.js';
import { currentDecisionOwner, sendReReviewAlert } from './notify.js';
import * as engine from './engine/index.js';

export { ThreadDO, IndexDO };

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const threadStub = (env, id) => env.THREAD.get(env.THREAD.idFromName(id));
const indexStub = (env) => env.INDEX.get(env.INDEX.idFromName('index'));

// --- Public intake plumbing (the one unauthenticated write) -----------------
const MAX_INTAKE_BYTES = 16 * 1024; // a generous cap for a text submission
// Kinds the public route accepts. `decision`/`run_report` are offered by the
// gate.clista.ai form; `contribution` targets an existing thread (API / a
// deep-link from a public thread) — no cold-start form field for it.
const PUBLIC_INTAKE_KINDS = new Set(['decision', 'run_report', 'contribution']);

// CORS for the gate.clista.ai submission form (cross-origin to the app). Only
// the configured origin(s) are echoed back; anything else gets the first
// allowed origin (so a stray origin simply can't read the response).
function corsHeaders(env, request) {
  const allowed = String(env.INTAKE_ALLOWED_ORIGIN || 'https://gate.clista.ai')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = request.headers.get('origin') || '';
  const allow = allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

function withCors(env, request, response) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders(env, request))) r.headers.set(k, v);
  return r;
}

// Verify a Cloudflare Turnstile token server-side. When no secret is configured
// (local dev / tests) verification is skipped so the route stays drivable;
// production ALWAYS sets TURNSTILE_SECRET, so real submissions are gated.
async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', String(token));
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

// POST /api/intake — the public, unauthenticated submission surface. Strictly
// guarded and strictly QUARANTINED: a valid submission only enqueues a pending
// intake row (DO metadata) — it registers no thread and appends no event. The
// owner triages it in the cockpit; approval (by a human) is what ever touches
// the ledger. Returns a receipt id only — never reads anything back.
async function handlePublicIntake(request, env) {
  const raw = await request.text();
  if (raw.length > MAX_INTAKE_BYTES) {
    return json({ error: 'too_large', reason: 'submission exceeds the size limit' }, 413);
  }
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return json({ error: 'invalid', reason: 'malformed JSON' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (!(await verifyTurnstile(env, body.turnstileToken, ip))) {
    return json({ error: 'forbidden', reason: 'human-verification check failed' }, 403);
  }
  if (!(await indexStub(env).rateLimitIntake(ip, engine.nowIso())).ok) {
    return json({ error: 'rate_limited', reason: 'too many submissions — try again later' }, 429);
  }

  const kind = String(body.kind || '').trim();
  if (!PUBLIC_INTAKE_KINDS.has(kind)) {
    return json({ error: 'invalid', reason: 'unknown submission kind' }, 422);
  }
  const cap = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const question = cap(body.question, 400);
  if (kind === 'decision' && question.length < 12) {
    return json({ error: 'invalid', reason: 'a decision needs a question (min 12 chars)' }, 422);
  }
  const text = cap(body.body, MAX_INTAKE_BYTES);
  if (kind === 'run_report' && text.length < 12 && question.length < 12) {
    return json({ error: 'invalid', reason: 'a run report needs a description' }, 422);
  }
  let targetThreadId = null;
  if (kind === 'contribution') {
    targetThreadId = cap(body.targetThreadId, 200);
    if (!targetThreadId) return json({ error: 'invalid', reason: 'a contribution must target an existing thread' }, 422);
    if (text.length < 12 && question.length < 12) return json({ error: 'invalid', reason: 'a contribution needs text' }, 422);
    const card = await threadStub(env, targetThreadId).indexCard();
    if (!card || !card.id) return json({ error: 'not_found', reason: 'target thread does not exist' }, 404);
  }

  const result = await indexStub(env).enqueueIntake({
    id: engine.newId('itk', question || kind),
    source: 'public',
    kind,
    title: cap(body.title, 160) || null,
    question: question || null,
    body: text || null,
    targetThreadId,
    payload: body.artifacts && typeof body.artifacts === 'object' ? { artifacts: body.artifacts } : null,
    // Submitter-stated origin is UNTRUSTED — stored for the owner's context only,
    // never used as an actor_id (the approving human is always the actor).
    provenance: { via: 'public', handle: cap(body.handle, 120) || null },
    submitter: cap(body.handle, 120) || null,
    at: engine.nowIso(),
  });
  return json({ ok: true, receipt: result.id }, result.ok ? 200 : 422);
}

// Build an EvidenceCommitted event that records an external submission on a
// thread. The server forces top-level actor_id; the nested committedBy must be a
// known participant, so the approving human VOUCHES for the external input under
// their own identity, with the real origin preserved in `source`.
function evidenceEvent(threadId, identity, { source, finding }) {
  return {
    event_type: 'EvidenceCommitted',
    thread_id: threadId,
    actor_id: identity.actorId,
    payload: {
      evidence: {
        id: engine.newId('evd', source || 'intake'),
        object: 'evidence',
        threadId,
        source: source || 'public submission',
        finding: String(finding || '').slice(0, MAX_INTAKE_BYTES),
        confidence: 0.5,
        committedByParticipantId: identity.actorId,
        committedAt: engine.nowIso(),
        artifactIds: [],
      },
    },
  };
}

// Build an ObjectionRaised event recording an external submission as a MATERIAL
// OBJECTION on a thread (the approve-as-objection triage path). Same vouching
// model as evidenceEvent — the approving human is the accountable participant,
// with the real origin folded into the text (objections carry no source field).
// Targets the thread itself, so it needs no reference into the reasoning graph.
// On a decided thread this is precisely what trips the re-review loop.
function objectionEvent(threadId, identity, { source, text }) {
  const body = String(text || '').slice(0, MAX_INTAKE_BYTES);
  return {
    event_type: 'ObjectionRaised',
    thread_id: threadId,
    actor_id: identity.actorId,
    payload: {
      objection: {
        id: engine.newId('obj', body || source || 'intake'),
        object: 'objection',
        threadId,
        participantId: identity.actorId,
        targetObjectType: 'thread',
        targetObjectId: threadId,
        text: `${body}${source ? ` [source: ${source}]` : ''}`,
        status: 'open',
        raisedAt: engine.nowIso(),
      },
    },
  };
}

// Build a ClaimCreated event (proposed claim) attributed to `identity`. Used to
// seed an approved proposal's use-cases as starting substrate on the new thread.
function claimEvent(threadId, identity, text) {
  return {
    event_type: 'ClaimCreated',
    thread_id: threadId,
    actor_id: identity.actorId,
    payload: {
      claim: {
        id: engine.newId('clm', text),
        object: 'claim',
        threadId,
        text: String(text || '').trim().slice(0, 600),
        status: 'proposed',
        createdByParticipantId: identity.actorId,
        createdAt: engine.nowIso(),
      },
    },
  };
}

// Ensure `identity` is a participant of an existing thread (join as a
// contributor if not), so it can commit evidence onto it. Returns true once a
// participant.
async function ensureParticipant(env, threadId, identity) {
  const stub = threadStub(env, threadId);
  const state = await stub.state(threadId);
  const participants = (state.identityState && state.identityState.participants) || [];
  if (participants.some((p) => p.id === identity.actorId)) return true;
  const join = await stub.append({
    event_type: 'ParticipantDeclared',
    thread_id: threadId,
    actor_id: identity.actorId,
    payload: {
      // email (when the identity carries one) rides on the participant record
      // so re-review alerting can reach a declared owner later (issue #21).
      participant: { id: identity.actorId, object: 'participant', kind: identity.kind || 'human', name: identity.name, ...(identity.email ? { email: identity.email } : {}), role: 'contributor' },
    },
  });
  if (join.ok) await registerThread(env, stub);
  return join.ok;
}

// Keep the thread index in sync after a write to a thread.
async function registerThread(env, stub) {
  const card = await stub.indexCard();
  if (card && card.id) await indexStub(env).upsert(card);
}

// After ANY successful append whose result carries reReviewTriggered (the DO
// minted a companion ReviewTriggered — see ThreadDO.append), flag + optionally
// email the CURRENT decision owner. Shared by every route that can land a
// post-decision objection (direct append, intake approve-as-objection), so no
// write path can flip a thread to re-review without the owner being notified.
// Owner resolution honors transfers (revoke + grant), falling back to the index
// card's display name for legacy threads with no active authority.
async function notifyReReview(env, stub, threadId, result) {
  if (!result.ok || !result.reReviewTriggered) return null;
  const card = await stub.indexCard();
  const owner = currentDecisionOwner(await stub.state(threadId), threadId);
  await indexStub(env).flagReReview(threadId, {
    ownerId: (owner && owner.id) || (card && card.owner),
    objectorId: result.reviewTrigger && result.reviewTrigger.triggeredByParticipantId,
    objectionId: result.reviewTrigger && result.reviewTrigger.triggeringObjectionId,
    at: engine.nowIso(),
  });
  const emailed = await sendReReviewAlert(env, owner, card, result.reviewTrigger);
  return { ownerId: (owner && owner.id) || null, emailed };
}

// Example-mirror registry (worker/examples/, vendored from ClisTa-Protocol's
// examples/manifest.json by scripts/vendor-examples.mjs). Listing omits the
// embedded event logs — they only matter at seed time.
const listExamples = () =>
  exampleRegistry.map(({ id, title, summary, kind, domain, entryThreadId, threads }) => ({
    id,
    title,
    summary,
    kind,
    domain,
    entryThreadId,
    threadCount: threads.length,
  }));
const getExample = (id) => exampleRegistry.find((e) => e.id === id) || null;

// Open a new thread: mint the canonical two-event genesis log
// (ParticipantDeclared → ThreadCreated) and ingest it atomically into a fresh
// DO. The caller becomes the thread's first participant (decision owner) — so
// who calls this is who OWNS the thread. Used by both POST /api/threads and the
// triage-inbox approve path (so an approved proposal/submission is owned by the
// approving human, never the agent/submitter). Returns { ok, id, ... } or
// { ok:false, reason } when the question is too short.
async function createThread(env, identity, { question, title } = {}) {
  const q = String(question || '').trim();
  if (q.length < 12) {
    return { ok: false, reason: 'a thread needs a question (min 12 chars) — the decision it exists to answer' };
  }
  const threadId = engine.newId('thd', q);
  const at = engine.nowIso();
  const t = String(title || '').trim();
  // ingest() chains + validates but (unlike append) does not mint ids, so the
  // genesis events carry their own event_id.
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
          ...(identity.email ? { email: identity.email } : {}),
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
          title: t || q,
          question: q,
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
  return { ...result, id: threadId };
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

        // POST /api/agent/intake — the emergent meta-thread seeder proposes a
        // canonical thread into the triage inbox. Agent-only. The agent does NOT
        // create the thread (it would become decision owner and the decision
        // could never be merged) — it proposes; a human approves and owns it.
        if (parts[1] === 'agent' && parts[2] === 'intake' && request.method === 'POST') {
          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          if (identity.kind !== 'agent') {
            return json({ error: 'forbidden', reason: 'agent service token required' }, 403);
          }
          const body = await request.json().catch(() => ({}));
          const question = String(body.question || '').trim();
          if (question.length < 12) {
            return json({ error: 'invalid', reason: 'a thread proposal needs a question (min 12 chars)' }, 422);
          }
          const result = await indexStub(env).enqueueIntake({
            id: engine.newId('itk', question),
            source: 'agent',
            kind: 'thread_proposal',
            title: String(body.title || '').trim() || null,
            question,
            body: typeof body.body === 'string' ? body.body : null,
            payload: { useCases: body.useCases ?? [], tradeoffs: body.tradeoffs ?? null },
            provenance: body.provenance ?? body.sourceSignals ?? null,
            submitter: identity.actorId,
            at: engine.nowIso(),
          });
          return json(result, result.ok ? 200 : 422);
        }

        // /api/intake — the triage inbox. Two surfaces on SEPARATE paths so a
        // Cloudflare Access bypass (which matches by path, not method, and
        // strips identity) can cover ONLY the public one:
        //   • POST /api/intake/submit         → the PUBLIC submission route
        //     (unauthenticated, Turnstile + rate-limit + quarantine; CORS for
        //     the gate.clista.ai form). The only Access-bypassed path.
        //   • GET /api/intake, POST :id/...   → the owner triage surface
        //     (human-only, behind Access — identity must stay intact here).
        if (parts[1] === 'intake') {
          // Public submission surface — the only path the Access bypass covers.
          if (parts[2] === 'submit') {
            if (request.method === 'OPTIONS') {
              return new Response(null, { status: 204, headers: corsHeaders(env, request) });
            }
            if (request.method === 'POST') {
              return withCors(env, request, await handlePublicIntake(request, env));
            }
            return json({ error: 'method_not_allowed' }, 405);
          }

          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          if (identity.kind !== 'human') {
            return json({ error: 'forbidden', reason: 'human triage only' }, 403);
          }

          // GET /api/intake — list pending items for the cockpit inbox.
          if (!parts[2] && request.method === 'GET') {
            return json(await indexStub(env).listIntake('pending'));
          }

          // POST /api/intake/:id/{approve,dismiss} — triage actions.
          if (parts[2] && request.method === 'POST') {
            const intakeId = decodeURIComponent(parts[2]);
            const op = parts[3] || '';
            const item = await indexStub(env).getIntake(intakeId);
            if (!item) {
              return json({ error: 'not found', reason: 'no such intake item' }, 404);
            }
            if (item.status !== 'pending') {
              return json({ error: 'conflict', reason: `intake item already ${item.status}` }, 409);
            }
            const body = await request.json().catch(() => ({}));
            const at = engine.nowIso();

            if (op === 'dismiss') {
              const status = body.spam ? 'spam' : 'dismissed';
              const result = await indexStub(env).resolveIntake(intakeId, { status, at });
              return json({ ...result, status }, result.ok ? 200 : 422);
            }

            if (op === 'approve') {
              // approve-as-objection only makes sense for a contribution — the
              // other kinds mint a NEW thread, which has nothing to object to.
              if (body.as === 'objection' && item.kind !== 'contribution') {
                return json({ error: 'invalid', reason: `approve as objection only applies to contributions, not '${item.kind}'` }, 422);
              }

              // thread_proposal / decision → create a thread OWNED BY THE
              // APPROVING HUMAN (the governance keystone), optionally handing it
              // to the deliberation cron.
              if (item.kind === 'thread_proposal' || item.kind === 'decision') {
                const created = await createThread(env, identity, { question: item.question, title: item.title });
                if (!created.ok) {
                  return json({ error: 'invalid', reason: created.reason || 'could not create thread from intake item' }, 422);
                }
                // Seed the proposal's use-cases as starting substrate (proposed
                // claims, committed by the approving owner) so the thread opens
                // pre-grounded for deliberation. Best-effort: a bad one is
                // skipped, never failing the approval.
                const useCases = Array.isArray(item.payload?.useCases) ? item.payload.useCases : [];
                let seededClaims = 0;
                for (const uc of useCases) {
                  const text = (typeof uc === 'string' ? uc : '').trim();
                  if (text.length < 8) continue;
                  const ev = await threadStub(env, created.id).append(claimEvent(created.id, identity, text));
                  if (ev.ok) seededClaims += 1;
                }
                if (seededClaims) await registerThread(env, threadStub(env, created.id));
                await indexStub(env).resolveIntake(intakeId, { status: 'approved', threadId: created.id, at });
                return json({ ok: true, status: 'approved', id: created.id, seededClaims });
              }

              // run_report → record it as a NEW human-owned thread with the
              // report attested as evidence (external source preserved).
              if (item.kind === 'run_report') {
                const q = item.question && item.question.length >= 12 ? item.question : `External run report — ${item.title || item.id}`;
                const created = await createThread(env, identity, { question: q, title: item.title || 'External run report' });
                if (!created.ok) {
                  return json({ error: 'invalid', reason: created.reason || 'could not create thread from run report' }, 422);
                }
                const src = `public run report ${item.id}` + (item.submitter ? ` — ${item.submitter}` : '');
                const ev = await threadStub(env, created.id).append(
                  evidenceEvent(created.id, identity, { source: src, finding: item.body || item.question || 'External run report.' })
                );
                if (ev.ok) await registerThread(env, threadStub(env, created.id));
                await indexStub(env).resolveIntake(intakeId, { status: 'approved', threadId: created.id, at });
                return json({ ok: true, status: 'approved', id: created.id, attested: ev.ok });
              }

              // contribution → append the external input onto the EXISTING
              // target thread (the approver joins it to vouch). Default is an
              // EvidenceCommitted attestation; `{ as: 'objection' }` records it
              // as an ObjectionRaised instead — the triage judgement that the
              // input MATERIALLY CONTRADICTS the thread. On a decided thread
              // that is what trips the re-review loop, so an outside
              // contradiction can re-open a decision with a human in the loop.
              if (item.kind === 'contribution') {
                const asObjection = body.as === 'objection';
                const target = item.targetThreadId;
                if (!target) return json({ error: 'invalid', reason: 'contribution has no target thread' }, 422);
                const stub = threadStub(env, target);
                const card = await stub.indexCard();
                if (!card || !card.id) return json({ error: 'not found', reason: 'target thread does not exist' }, 404);
                if (!(await ensureParticipant(env, target, identity))) {
                  return json({ error: 'failed', reason: 'could not join the target thread to attest' }, 422);
                }
                const src = `public submission ${item.id}` + (item.submitter ? ` — ${item.submitter}` : '');
                const ev = await stub.append(
                  asObjection
                    ? objectionEvent(target, identity, { source: src, text: item.body || item.question || 'External objection.' })
                    : evidenceEvent(target, identity, { source: src, finding: item.body || item.question || 'External contribution.' })
                );
                if (!ev.ok) return json({ error: 'rejected', ...ev }, 422);
                await registerThread(env, stub);
                const notify = await notifyReReview(env, stub, target, ev);
                await indexStub(env).resolveIntake(intakeId, { status: 'approved', threadId: target, at });
                return json({
                  ok: true,
                  status: 'approved',
                  id: target,
                  attested: true,
                  ...(asObjection ? { objection: true, reReview: !!ev.reReviewTriggered, reReviewNotify: notify } : {}),
                });
              }

              return json({ error: 'unsupported', reason: `approve not implemented for kind '${item.kind}'` }, 422);
            }

            return json({ error: 'not found' }, 404);
          }

          return json({ error: 'not found' }, 404);
        }

        // GET /api/examples — published example decision logs the cockpit mirrors
        // from ClisTa-Protocol (generated by scripts/vendor-examples.mjs from
        // examples/manifest.json). Public, read-only, no event logs in the list.
        if (parts[1] === 'examples' && !parts[2] && request.method === 'GET') {
          return json({ examples: listExamples() });
        }

        // POST /api/examples/:id/seed — seed every thread of an example into its
        // own DO (a multi-thread example seeds the parent + each arm), register
        // them, and return the entry thread to open. Authenticated, like the
        // per-example seed-* actions it generalizes; idempotent-ish (a thread
        // already seeded reports ok:false for that thread, 409 overall).
        if (parts[1] === 'examples' && parts[2] && parts[3] === 'seed' && request.method === 'POST') {
          const identity = await resolveIdentity(request, env);
          if (!identity.authenticated) {
            return json({ error: 'unauthenticated', reason: identity.reason || 'sign in required' }, 401);
          }
          const ex = getExample(decodeURIComponent(parts[2]));
          if (!ex) {
            return json({ error: 'not_found', reason: `no published example ${parts[2]}` }, 404);
          }
          const seeded = [];
          for (const t of ex.threads) {
            const stub = threadStub(env, t.threadId);
            const result = await stub.ingest(t.events);
            if (result.ok) await registerThread(env, stub);
            seeded.push({
              threadId: t.threadId,
              role: t.role,
              ok: result.ok,
              count: result.count ?? (result.ok ? t.events.length : 0),
              reason: result.reason,
            });
          }
          const ok = seeded.every((s) => s.ok);
          return json({ ok, id: ex.id, entryThreadId: ex.entryThreadId, threads: seeded }, ok ? 200 : 409);
        }

        // GET /api/threads — the index/ledger. ?hidden=1 is the audit view:
        // hidden cards included, each carrying its hidden flag.
        if (parts[1] === 'threads' && !parts[2] && request.method === 'GET') {
          return json(await indexStub(env).list(url.searchParams.get('hidden') === '1'));
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
          const created = await createThread(env, identity, { question: body.question, title: body.title });
          if (created.ok === false && created.reason && !created.id) {
            return json({ error: 'invalid', reason: created.reason }, 422);
          }
          return json(created, created.ok ? 200 : 422);
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
            // Raw chained event log, verbatim — the archival export consumed
            // by scripts/archive-thread.mjs (ThreadHub ingest).
            if (action === 'export') return json(await stub.export());
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
                    ...(identity.email ? { email: identity.email } : {}),
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

            // Seed the vendor due-diligence thread with its bundled canonical
            // log — the companion decision to the sepsis scenario-demo.
            if (action === 'seed-vendor-dd') {
              const result = await stub.ingest(vendorDueDiligenceEvents);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 409);
            }

            // Seed the pharma Phase II/III go/no-go thread (LTN-4481) with its
            // bundled canonical log — companion to scenario-demo and vendor-dd.
            if (action === 'seed-pharma-phase-gate') {
              const result = await stub.ingest(pharmaPhaseGateEvents);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 409);
            }

            if (action === 'ingest') {
              const result = await stub.ingest(body.events || []);
              if (result.ok) await registerThread(env, stub);
              return json(result, result.ok ? 200 : 422);
            }

            // Hide or unhide this thread's card in the index projection. For
            // sealed/superseded logs (e.g. a re-issued example revision): the
            // thread stays resolvable by id and its append-only log is
            // untouched — only the ledger listing changes.
            if (action === 'hide' || action === 'unhide') {
              const result = await indexStub(env).setHidden(threadId, action === 'hide');
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




            if (action === 'append') {
              // Server-authoritative actor: identity decides actor_id, never the client.
              const event = { ...(body.event || body) };
              event.thread_id = event.thread_id || threadId;
              event.actor_id = identity.actorId;
              const result = await stub.append(event);
              if (result.ok) await registerThread(env, stub);
              // A post-decision objection flipped the thread to re-review:
              // flag + (when configured) email the current decision owner.
              const notify = await notifyReReview(env, stub, threadId, result);
              if (notify) result.reReviewNotify = notify;
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
