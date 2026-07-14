// sandbox-do.js — SandboxDO: the single named Durable Object that IS the
// ephemeral sandbox. ISOLATED from the production hub — its own class, its own
// instance ('sandbox-prod'), its own trigger-free store. No HubDO binding, no
// HUB service binding: there is no code path from here to hub-prod.
//
// It reuses packages/threadhub as a library: Hub (custodial mint, hash-chained
// signed append, createThread genesis), effectivePublication's event shape,
// verify-standalone.mjs (served by the Worker), and the CP_STYLE viewer via
// sandbox-view.js. What differs is bounded and disclosed: a trigger-free store
// so a DO alarm can sweep 24h-old threads, a signed export (signature sidecar)
// so the real checker prints signatures verified n/n, and a public-but-bounded
// write path POST /try (rate-limited, capped, Turnstile-gated in the Worker).
import { DurableObject } from 'cloudflare:workers';
import { Hub } from '../../threadhub/src/hub.js';
import { rateLimiter, errorResponse, PUBLIC_404_BODY } from '../../threadhub/src/routes.js';
import { effectivePublication } from '../../threadhub/src/publication.js';
import { SandboxStore } from './sandbox-store.js';
import { sandboxViewHTML } from './sandbox-view.js';

const JSON_TYPE = 'application/json; charset=utf-8';
const HTML_TYPE = 'text/html; charset=utf-8';
const stringify = (obj) => JSON.stringify(obj, null, 2);
const json = (status, obj) => ({ status, contentType: JSON_TYPE, body: stringify(obj) });
const html = (status, body) => ({ status, contentType: HTML_TYPE, body });
const NOT_FOUND = { status: 404, contentType: JSON_TYPE, body: PUBLIC_404_BODY };

// Ratified abuse controls (owner ruling). Overridable via wrangler vars.
const DEFAULT_MAX_THREADS = 300;
const DEFAULT_TTL_HOURS = 24;
const RATE_MAX = 5;              // writes ...
const RATE_WINDOW_MS = 10 * 60_000; // ... per 10 minutes, per IP
const SWEEP_INTERVAL_MS = 60 * 60_000; // alarm cadence (TTL is enforced by age, not cadence)
const MAX_DECISION_CHARS = 100_000; // a paste ceiling well under hub.js's 256KB record cap

// Random, non-enumerable slug (owner ruling D-SLUG): "try-" + 12 base32 chars.
// Visibly distinct from prod slugs, unguessable, collision-free in practice.
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function randomSlug() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let s = '';
  for (const b of bytes) s += B32[b & 31];
  return `try-${s}`;
}

// Pre-generate the thread id (same shape as hub.js rid('thd')) so the write
// path can roll back a partially-created thread by id even if createThread
// throws mid-way, before it can return the id.
function randomThreadId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return `thd_${s}`;
}

// The witnessed publication act, same clista.event shape the hub uses
// (helpers.js publicationEvent / effectivePublication reads exactly this).
function publicationEvent(actorId, threadId) {
  return {
    actor_id: actorId,
    event_type: 'ThreadPublished',
    payload: {
      threadPublication: {
        action: 'publish',
        id: 'tpb_sandbox000000',
        object: 'threadPublication',
        publishedAt: new Date().toISOString(),
        publishedByParticipantId: actorId,
        scope: 'public-read',
        threadId,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

// A signed export: the thread's records as bare envelopes PLUS the signature +
// record_hash sidecar, so verify-standalone.mjs verifies signatures (n/n), not
// just the hash chain (owner ruling: signed export = YES). Prod's exportThread
// stays bare; this is a sandbox-only, stronger-demo export.
function signedExport(rows) {
  return rows.map((r) => ({
    ...JSON.parse(r.body),
    record_hash: r.record_hash,
    signature: r.signature,
  }));
}

// Defense-in-depth publication gate (DR D-PUBGATE): a sandbox thread is served
// ONLY if its records' effective publication is published — the same pure
// function the production public read path uses. An unpublished / half thread
// (e.g. a genesis-only thread from a partial-failure window) is treated as
// nonexistent: same PUBLIC_404_BODY bytes, no oracle.
function isPublished(rows) {
  return effectivePublication(rows.map((r) => JSON.parse(r.body))).published;
}

function deriveTitle(decision) {
  const firstLine = decision.split('\n', 1)[0].trim();
  const t = (firstLine || decision.trim()).slice(0, 80);
  return t || 'Untitled sandbox decision';
}

export class SandboxDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // In-memory per-IP sliding window; an instance restart (eviction) resets
    // it, faithful to the hub's limiter semantics.
    this.allowWrite = rateLimiter({ max: RATE_MAX, windowMs: RATE_WINDOW_MS });
    ctx.blockConcurrencyWhile(async () => {
      this.store = new SandboxStore(ctx.storage.sql);
      this.hub = new Hub(this.store); // duck-typed store; node:sqlite never touched
    });
  }

  #maxThreads() {
    const n = Number(this.env.SANDBOX_MAX_THREADS);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_THREADS;
  }
  #ttlHours() {
    const n = Number(this.env.SANDBOX_TTL_HOURS);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_HOURS;
  }

  // --- the public write path (Worker calls this only AFTER Turnstile passes) ---
  // Mint custodial writer → createThread (pasted decision = genesis seq 0,
  // random slug) → append ThreadPublished → return { slug, headHash, viewUrl }.
  async createTry({ decision, title, ip } = {}) {
    try {
      if (!this.allowWrite(ip ?? '?')) {
        return json(429, { error: 'rate limit exceeded — 5 writes per 10 minutes', code: 'rate_limited' });
      }
      if (typeof decision !== 'string' || decision.trim() === '') {
        return json(400, { error: 'decision text is required', code: 'bad_request' });
      }
      if (decision.length > MAX_DECISION_CHARS) {
        return json(413, { error: `decision is too long (max ${MAX_DECISION_CHARS} chars)`, code: 'payload_too_large' });
      }
      // Honest refusal at capacity (owner ruling: 300-thread hard cap).
      if (this.store.countThreads() >= this.#maxThreads()) {
        return json(503, {
          error: 'the sandbox is at capacity — this is a demo with a small live footprint; try again shortly',
          code: 'at_capacity',
        });
      }

      const writer = this.hub.createIdentity({ displayName: 'sandbox writer', kind: 'agent' });
      const threadId = randomThreadId();
      const slug = randomSlug();
      try {
        const thread = this.hub.createThread({
          id: threadId,
          title: title && String(title).trim() ? String(title).slice(0, 200) : deriveTitle(decision),
          question: decision,
          authorId: writer.id,
          slug,
        });
        // The witnessed publication act, authored by the custodial writer.
        const pub = this.hub.append({
          threadId: thread.id,
          authorId: writer.id,
          kind: 'clista.event',
          payload: publicationEvent(writer.id, thread.id),
        });

        await this.#ensureAlarm();
        return json(200, { slug: thread.slug, headHash: pub.record_hash, viewUrl: `/try/${thread.slug}/view` });
      } catch (e) {
        // No orphan threads on partial failure: if any step after the mint
        // throws (e.g. the publish append), remove whatever was created so a
        // genesis-only thread cannot persist and occupy a cap slot. DO SQL is
        // synchronous, so this cleanup is atomic w.r.t. this call.
        // deleteThreadCascade drops the thread + its records + its 1:1 writer
        // when the thread row exists; the explicit identity delete covers the
        // case where createThread threw before inserting the thread.
        this.store.deleteThreadCascade(threadId);
        this.store.sql.exec('DELETE FROM identities WHERE id = ?', writer.id);
        throw e;
      }
    } catch (e) {
      return errorResponse(e); // hub errors (e.g. payload_too_large) → mapped status
    }
  }

  // --- the read surface (GET) ---
  handle({ method, path } = {}) {
    try {
      let m;
      if ((m = path.match(/^\/try\/([^/]+)\.json$/)) && method === 'GET') {
        const thread = this.store.getThread(decodeURIComponent(m[1]));
        if (!thread) return { ...NOT_FOUND };
        const rows = this.store.recordsOf(thread.id);
        if (!isPublished(rows)) return { ...NOT_FOUND };
        return json(200, signedExport(rows));
      }
      if ((m = path.match(/^\/try\/([^/]+)\/view$/)) && method === 'GET') {
        const thread = this.store.getThread(decodeURIComponent(m[1]));
        if (!thread) return { ...NOT_FOUND };
        const rows = this.store.recordsOf(thread.id);
        if (!isPublished(rows)) return { ...NOT_FOUND };
        const authors = [...new Set(rows.map((r) => r.author_id))].map((id) => {
          const ident = this.store.getIdentity(id);
          return {
            id,
            displayName: ident?.display_name ?? null,
            kind: ident?.kind ?? null,
            custodial: Boolean(ident?.private_key),
          };
        });
        return html(200, sandboxViewHTML(
          { thread, records: rows, verification: this.hub.verifyThread(thread.id), authors },
          this.#ttlHours(),
        ));
      }
      return { ...NOT_FOUND };
    } catch (e) {
      return errorResponse(e);
    }
  }

  // --- ephemerality: the 24h TTL sweep (owner ruling D-TTLSTORE) ---
  async #ensureAlarm() {
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + SWEEP_INTERVAL_MS);
    }
  }

  async alarm() {
    const cutoff = new Date(Date.now() - this.#ttlHours() * 3600_000).toISOString();
    for (const t of this.store.threadsOlderThan(cutoff)) {
      this.store.deleteThreadCascade(t.id);
    }
    // Reschedule while anything is still live; otherwise the next write re-arms.
    if (this.store.countThreads() > 0) {
      await this.ctx.storage.setAlarm(Date.now() + SWEEP_INTERVAL_MS);
    }
  }
}
