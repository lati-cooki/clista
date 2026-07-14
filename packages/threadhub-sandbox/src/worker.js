// worker.js — the sandbox front door. Transport only: the /try/verify.mjs
// bytes, the body cap, the pluggable Turnstile gate, and the RPC hop to the
// single named SandboxDO. No production surface is reachable from here.
//
// Route map (this Worker owns ONLY /try/*; the apex path-split routes
// consensusprotocol.ai/try/* here at deploy time):
//   GET  /try/verify.mjs      → the byte-identical checker (Text import)
//   POST /try                 → Turnstile-gated, body-capped write → SandboxDO
//   GET  /try/<slug>/view     → the sandbox thread page (+ disclosure banner)
//   GET  /try/<slug>.json     → the SIGNED export (verify → signatures n/n)
//   everything else           → shared not-found bytes
import checkerSource from '../../threadhub/scripts/verify-standalone.mjs'; // Text rule → string
import { PUBLIC_404_BODY, errorResponse } from '../../threadhub/src/routes.js';
import { verifyTurnstile } from './turnstile.js';

export { SandboxDO } from './sandbox-do.js';

const JSON_TYPE = 'application/json; charset=utf-8';
const CHECKER_TYPE = 'text/javascript; charset=utf-8';

// Same body ceiling as the hub Worker / Node adapter. Byte-accurate: the cap
// is measured in UTF-8 bytes (Content-Length / TextEncoder), never UTF-16
// string units, so a multi-byte paste cannot slip past a char-count check.
const MAX_BODY_BYTES = 5e6;

const respond = ({ status, contentType, body }) =>
  new Response(body, {
    status,
    headers: { 'content-type': contentType, 'cache-control': 'no-store' },
  });

const notFound = () => respond({ status: 404, contentType: JSON_TYPE, body: PUBLIC_404_BODY });
const jsonError = (status, code, error) =>
  respond({ status, contentType: JSON_TYPE, body: JSON.stringify({ error, code }, null, 2) });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const ip = request.headers.get('cf-connecting-ip') ?? '?';

    // (1) The standalone checker, straight from the repo file's bytes — the
    // sandbox's own byte-identical copy at its own path (D-VERIFY-IDENTITY).
    if (method === 'GET' && path === '/try/verify.mjs') {
      return respond({ status: 200, contentType: CHECKER_TYPE, body: checkerSource });
    }

    const stub = env.SANDBOX.get(env.SANDBOX.idFromName('sandbox-prod'));

    // (2) The one public write path. Everything else that is not a GET/HEAD is
    // a write shape with no route here → the shared not-found bytes.
    if (path === '/try' && method === 'POST') {
      // Pre-check the declared size BEFORE buffering the body. An oversized
      // Content-Length is refused here — before request.text(), before
      // Turnstile, before the DO/rate-limiter/mint — so an unauthenticated
      // caller cannot force the isolate to buffer up to the platform limit.
      const declaredBytes = Number(request.headers.get('content-length'));
      if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) {
        return jsonError(413, 'payload_too_large', 'request body is too large');
      }
      let bodyText;
      try {
        bodyText = await request.text();
      } catch {
        return jsonError(400, 'bad_request', 'could not read request body');
      }
      // Fallback for an absent or lying Content-Length: measure the actual
      // UTF-8 byte length (not bodyText.length, which counts UTF-16 units).
      if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
        return jsonError(413, 'payload_too_large', 'request body is too large');
      }
      let body;
      try {
        body = bodyText === '' ? {} : JSON.parse(bodyText);
      } catch {
        return jsonError(400, 'bad_request', 'body must be JSON');
      }
      if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return jsonError(400, 'bad_request', 'body must be a JSON object');
      }

      // Pluggable Turnstile gate. Unset secret → allow (test / pre-widget);
      // set secret → fail closed on a missing/invalid token. The client learns
      // nothing beyond a uniform 403.
      const token = body.turnstileToken ?? body['cf-turnstile-response'];
      const gate = await verifyTurnstile({ secret: env.TURNSTILE_SECRET, token, remoteip: ip });
      if (!gate.ok) {
        return jsonError(403, 'turnstile_failed', 'bot-protection check failed');
      }

      try {
        const out = await stub.createTry({ decision: body.decision, title: body.title, ip });
        return respond(out);
      } catch (e) {
        return respond(errorResponse(e));
      }
    }

    if (method !== 'GET' && method !== 'HEAD') {
      return notFound();
    }

    // (3) Read surface → the DO.
    try {
      const out = await stub.handle({ method, path });
      return respond(out);
    } catch (e) {
      return respond(errorResponse(e));
    }
  },
};
