// hub-do.js — HubDO: the single named Durable Object that IS the hub.
//
// One instance (idFromName('hub')) reproduces the Node deployment's
// single-process serialized-write semantics. The Worker front door RPCs
// handle({ method, path, bodyText, role, ip }) — five scalars, never a
// Request, never client headers — and this class parses the body exactly
// like server.js, answers the two operator-only admin routes, and hands
// everything else to the shared route table in
// packages/threadhub/src/routes.js. All response bytes come from there or
// from the same stringify discipline (JSON.stringify(obj, null, 2)).
import { DurableObject } from 'cloudflare:workers';
import { Hub } from '../../threadhub/src/hub.js';
import { handle as routeHandle, rateLimiter, errorResponse } from '../../threadhub/src/routes.js';
import { effectivePublication } from '../../threadhub/src/publication.js';
import { DOStore } from './store-do.js';

const JSON_TYPE = 'application/json; charset=utf-8';
const stringify = (obj) => JSON.stringify(obj, null, 2);

export class HubDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // In-memory sliding window, faithful port semantics: like the Node
    // process, an instance restart (eviction) resets the window.
    this.allowWrite = rateLimiter();
    // Schema DDL before any request is answered.
    ctx.blockConcurrencyWhile(async () => {
      this.store = new DOStore(ctx.storage.sql);
      this.hub = new Hub(this.store); // duck-typed store; node:sqlite never touched
    });
  }

  // The one RPC. Returns a routes.js response descriptor
  // { status, contentType, body } — the Worker writes it verbatim.
  handle({ method, path, bodyText, bodyError, role, ip, accept } = {}) {
    // Body parsing mirrors server.js: absent/empty body stays undefined
    // (routes.js body() coalesces it to {}); a failed read/parse is passed
    // through AS the Error value, so only a matched POST route that
    // consumes the body surfaces it — a bad body on an unrouted path still
    // answers 404.
    let bodyJson;
    if (bodyError != null) bodyJson = new Error(bodyError);
    else if (bodyText != null && bodyText !== '') {
      try { bodyJson = JSON.parse(bodyText); } catch (e) { bodyJson = e; }
    }

    const operator = role === 'operator';

    // Admin routes: operator only, answered here — they are deployment
    // plumbing, not part of the record's route table. Non-operator hits
    // (and unknown /admin/* paths) fall through to routes.handle below,
    // which answers the shared PUBLIC_404 bytes: /admin/* must be
    // indistinguishable from any route that never existed.
    if (operator && method === 'POST' && path === '/admin/import') {
      try { return this.#adminImport(bodyJson); } catch (e) { return errorResponse(e); }
    }
    if (operator && method === 'GET' && path === '/admin/export') {
      return { status: 200, contentType: JSON_TYPE, body: stringify(this.store.exportRows()) };
    }

    return routeHandle(this.hub, {
      method,
      path,
      bodyJson,
      // Auth is per-request role, not process mode: the public role IS
      // public mode (publication filtering + shared 404s).
      publicMode: !operator,
      // No public write path exists on this deployment. The Worker already
      // answered unauthorized writes before reading the body; this gate is
      // the in-depth copy of the same rule.
      gateWrites: true,
      ip,
      allowWrite: this.allowWrite,
      // /verify.mjs never reaches the DO — the Worker serves the
      // Text-imported bytes itself. Absent → the route 404s here too.
      checkerSource: undefined,
      // Content negotiation for GET / only (browser → HTML landing). Optional
      // everywhere; undefined keeps the JSON listing.
      accept,
    });
  }

  // --- HubInternal service-entrypoint operations (RPC, no HTTP shape) ---
  // These run on the SAME hub as handle(): one DO, one store, one truth.
  // The HubInternal WorkerEntrypoint (worker.js) is the only caller; it
  // reaches this instance via env.HUB.idFromName('hub') — the exact address
  // the fetch face uses. Return shapes match test/hub-stub.js in the studio
  // Worker (the contract), not the HTTP route table.

  // Mint one custodial objector identity (the hub holds the key — DR 5.5).
  // display_name + kind are the ONLY fields that cross (DR 5.6: an objector's
  // contact string never appears here). No public key → createIdentity
  // generates the keypair and stores it, exactly as POST /identities does for
  // a keyless body. Returns { id }. Throws on any hub-side failure, so the
  // caller's mint-first ordering holds (a throw means nothing was filed).
  mintIdentity({ display_name, kind } = {}) {
    const { id } = this.hub.createIdentity({ displayName: display_name, kind });
    return { id };
  }

  // Effective publication state of a thread, by slug or id. Pure function of
  // the thread's records — the LAST publication event governs — computed the
  // same way the public read path does (routes.js isPublished): parse the
  // record bodies, run effectivePublication. A missing thread is false: fail
  // closed, disclose nothing.
  isPublished(slug) {
    const thread = this.hub.store.getThread(slug);
    if (!thread) return false;
    const envelopes = this.hub.store.recordsOf(thread.id).map((r) => JSON.parse(r.body));
    return effectivePublication(envelopes).published;
  }

  #adminImport(bodyJson) {
    if (bodyJson instanceof Error) throw bodyJson; // same surfacing as a matched POST route
    const payload = bodyJson === undefined ? {} : bodyJson;
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      const e = new Error('import body must be { identities, threads, records }');
      e.code = 'bad_request';
      throw e;
    }
    // Transactional: an FK/constraint failure mid-import rolls the whole
    // batch back, so a retry after a fix re-imports cleanly (idempotence
    // then skips whatever an earlier successful import already landed).
    const counts = this.ctx.storage.transactionSync(() => this.store.importRows(payload));
    return { status: 200, contentType: JSON_TYPE, body: stringify(counts) };
  }
}
