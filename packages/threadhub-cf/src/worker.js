// worker.js — the front door. Everything here is transport: auth → role,
// the pre-body write gate, the /verify.mjs bytes, and the RPC hop to the
// single named HubDO. Route logic and response bytes live in
// packages/threadhub/src/routes.js (shared with the Node adapter) and in
// hub-do.js.
//
// ORDER IS LOAD-BEARING:
//   1. GET /verify.mjs — served from the Text-imported repo file, byte-
//      identical by construction (no copy, no build step to drift).
//   2. Compute role from Authorization: Bearer vs THREADHUB_WRITE_TOKEN.
//      This is the ONLY place a role is ever computed.
//   3. Unauthorized write methods answer the shared PUBLIC_404 bytes
//      BEFORE the request body is read: no auth oracle, no route oracle,
//      no byte of attacker body ever buffered.
//   4. Read the body text and RPC the DO with five scalars —
//      { method, path, bodyText, role, ip }. Client headers and Request
//      objects NEVER cross the RPC boundary.
//   5. Every response carries Cache-Control: no-store — an edge cache
//      must never serve a revoked thread.
import checkerSource from '../../threadhub/scripts/verify-standalone.mjs'; // Text rule → string
import { PUBLIC_404_BODY, errorResponse } from '../../threadhub/src/routes.js';

export { HubDO } from './hub-do.js';

// Content types pinned to routes.js's values (it does not export them;
// the byte-identity tests hold both sides to the same strings).
const JSON_TYPE = 'application/json; charset=utf-8';
const CHECKER_TYPE = 'text/javascript; charset=utf-8';

// Same body ceiling as the Node adapter's readBody (server.js).
const MAX_BODY_CHARS = 5e6;

const respond = ({ status, contentType, body }) =>
  new Response(body, {
    status,
    headers: { 'content-type': contentType, 'cache-control': 'no-store' },
  });

// Constant-time bearer check: hash both sides to fixed length, then
// timingSafeEqual. String comparison would leak a prefix-length oracle on
// the write token. Header absence (or an unset secret) short-circuits to
// public — both facts are attacker-known, so no oracle is created.
async function computeRole(request, env) {
  const secret = env.THREADHUB_WRITE_TOKEN;
  const auth = request.headers.get('authorization') ?? '';
  const presented = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (typeof secret !== 'string' || secret === '' || presented === '') return 'public';
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(presented)),
    crypto.subtle.digest('SHA-256', enc.encode(secret)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b) ? 'operator' : 'public';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // (1) The standalone checker, straight from the repo file's bytes.
    if (method === 'GET' && url.pathname === '/verify.mjs') {
      return respond({ status: 200, contentType: CHECKER_TYPE, body: checkerSource });
    }

    // (2) Role. Computed once, here, never anywhere else.
    const role = await computeRole(request, env);

    // (3) The write gate, before the body is touched. GET/HEAD are the
    // public read surface; every other method is a write shape and, for a
    // non-operator, answers the byte-identical shared 404 — a probe of a
    // write route is indistinguishable from a route that never existed.
    if (role !== 'operator' && method !== 'GET' && method !== 'HEAD') {
      return respond({ status: 404, contentType: JSON_TYPE, body: PUBLIC_404_BODY });
    }

    // (4) Body text + the RPC hop. An over-ceiling body becomes bodyError,
    // which the DO passes to routes.js as the Error value — same behavior
    // as server.js's readBody rejection (only a matched POST route that
    // consumes the body surfaces it).
    let bodyText, bodyError;
    if (method !== 'GET' && method !== 'HEAD') {
      bodyText = await request.text();
      if (bodyText.length > MAX_BODY_CHARS) {
        bodyError = 'body too large';
        bodyText = undefined;
      }
    }
    const ip = request.headers.get('cf-connecting-ip') ?? '?';

    try {
      const stub = env.HUB.get(env.HUB.idFromName('hub'));
      const out = await stub.handle({ method, path: url.pathname, bodyText, bodyError, role, ip });
      return respond(out); // (5) respond() stamps Cache-Control: no-store
    } catch (e) {
      // Same last-resort shaping as the Node adapter's outer catch.
      return respond(errorResponse(e));
    }
  },
};
