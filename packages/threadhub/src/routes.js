// routes.js — the transport-agnostic route table. No node:http, no fs.
//
// One pure function: handle(hub, request) -> response descriptor. The
// request is a plain object the transport builds; the response is
// { status, contentType, body } where body is the EXACT final string —
// the transport writes it verbatim and never re-serializes. This is the
// seam that lets the same routes run under Node's http server today and
// a Cloudflare Worker tomorrow with byte-identical answers.
//
//   handle(hub, {
//     method,       // 'GET' | 'POST' | ...
//     path,         // URL pathname, e.g. '/t/some-slug/verify'
//     bodyJson,     // parsed JSON body for POSTs; an Error instance if the
//                   //   transport failed to read/parse it (thrown only when
//                   //   a matched POST route consumes the body, so a bad
//                   //   body on an unrouted path still answers 404)
//     publicMode,   // serve only effectively-published threads
//     gateWrites,   // public deployments with no write path: every POST
//                   //   answers PUBLIC_404_BODY when publicMode is on —
//                   //   before rate limit or route match, so writes leave
//                   //   no route oracle. Node passes false (unchanged).
//     ip,           // rate-limit key
//     allowWrite,   // (ip) => boolean, from rateLimiter()
//     checkerSource,// /verify.mjs seam: the standalone checker's bytes as a
//                   //   utf-8 string, or a () => string thunk. The checker
//                   //   is a FILE served verbatim, so the transport owns
//                   //   obtaining it (Node: fs read; Worker: Text import)
//                   //   and routes.js only shapes the response. Absent →
//                   //   the route falls through to the shared 404.
//   })
'use strict';
const { effectivePublication } = require('./publication');
const { threadViewHTML } = require('./view');

// HubError codes -> HTTP status. Anything uncoded is a plain 400.
const STATUS_FOR = {
  not_found: 404,
  stale_chain: 409,
  payload_too_large: 413,
  rate_limited: 429,
  invalid_signature: 400,
  author_key_mismatch: 400,
  bad_request: 400,
};

const JSON_TYPE = 'application/json; charset=utf-8';
const HTML_TYPE = 'text/html; charset=utf-8';
const CHECKER_TYPE = 'text/javascript; charset=utf-8';

const stringify = (obj) => JSON.stringify(obj, null, 2);
const json = (status, obj) => ({ status, contentType: JSON_TYPE, body: stringify(obj) });
const html = (status, body) => ({ status, contentType: HTML_TYPE, body });

// The one public 404, pre-stringified. In public mode, unpublished and
// nonexistent must be indistinguishable from outside (slugs are names,
// not credentials), so every filtered surface answers with THESE bytes —
// including the fallthrough 404, so an unpublished thread looks exactly
// like a route that never existed. Serialized exactly as every other
// JSON response (JSON.stringify(obj, null, 2)); a test pins the bytes.
const PUBLIC_404_BODY = stringify({ error: 'not found', code: 'not_found' });
const PUBLIC_404 = { status: 404, contentType: JSON_TYPE, body: PUBLIC_404_BODY };

// Fixed-window per-IP rate limit on writes. Reads stay unmetered: the
// viewer and verification are the product surface; POST is the abuse
// surface.
function rateLimiter({ max = 120, windowMs = 60_000 } = {}) {
  const windows = new Map(); // ip -> { count, resetAt }
  return (ip, now = Date.now()) => {
    const w = windows.get(ip);
    if (!w || now >= w.resetAt) {
      if (windows.size > 10_000) windows.clear(); // crude memory bound
      windows.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    return ++w.count <= max;
  };
}

// Map a thrown error to a response descriptor. Used by handle() and
// exported for transports whose own pre-route work (URL parsing, body
// reads) must answer with the same shape.
function errorResponse(e) {
  const code = e.code in STATUS_FOR ? e.code : 'bad_request';
  return json(STATUS_FOR[code], { error: e.message, code });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

// Deliberately spare viewer: monospace ledger aesthetic. The record is
// the interface; the page just refuses to get in its way.
function viewerHTML(thread, records, verification) {
  const rows = records.map((r) => {
    const env = JSON.parse(r.body);
    const summary = env.kind === 'clista.event'
      ? `${env.payload.event_type ?? 'event'} · ${env.payload.actor_id ?? ''}`
      : env.kind;
    return `<details class="rec">
      <summary><span class="seq">#${env.seq}</span> <span class="kind">${esc(summary)}</span>
        <span class="hash">${esc(r.record_hash.slice(0, 23))}…</span>
        <span class="author">${esc(env.author)}</span></summary>
      <pre>${esc(JSON.stringify(env, null, 2))}</pre>
      <div class="sig">sig ${esc(r.signature.slice(0, 32))}… · key ${esc(env.author_key.slice(0, 16))}…</div>
    </details>`;
  }).join('\n');
  const badge = verification.valid
    ? `<span class="ok">chain verified · ${verification.records} records</span>`
    : `<span class="bad">CHAIN INVALID · ${verification.problems.length} problem(s)</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(thread.title)} — Thread Hub</title>
<style>
  :root { --bg:#101312; --ink:#cfd8d3; --dim:#6d7a74; --ok:#7fd1a8; --bad:#e08585; --line:#232a27; --acc:#d8c27a; }
  body { background:var(--bg); color:var(--ink); font:14px/1.55 ui-monospace,'SF Mono',Menlo,monospace; margin:0; padding:2.5rem 1.25rem; }
  main { max-width:880px; margin:0 auto; }
  h1 { font-size:1.05rem; font-weight:600; letter-spacing:.02em; margin:0 0 .25rem; }
  .meta { color:var(--dim); font-size:.8rem; margin-bottom:1.5rem; word-break:break-all; }
  .ok { color:var(--ok); } .bad { color:var(--bad); }
  .rec { border-top:1px solid var(--line); padding:.45rem 0; }
  .rec:last-child { border-bottom:1px solid var(--line); }
  summary { cursor:pointer; display:flex; gap:.9rem; align-items:baseline; list-style:none; }
  summary::-webkit-details-marker { display:none; }
  summary:focus-visible { outline:1px solid var(--acc); outline-offset:3px; }
  .seq { color:var(--acc); min-width:2.5rem; }
  .kind { flex:1; }
  .hash, .author { color:var(--dim); font-size:.78rem; }
  pre { background:#0a0d0c; border:1px solid var(--line); padding:.9rem; overflow-x:auto; font-size:.78rem; margin:.6rem 0 .3rem; }
  .sig { color:var(--dim); font-size:.72rem; margin-bottom:.4rem; }
  .trust { color:var(--dim); font-size:.78rem; margin-top:1.5rem; border-top:1px solid var(--line); padding-top:.75rem; }
</style></head><body><main>
<h1>${esc(thread.title)}</h1>
<div class="meta">${esc(thread.id)} · /t/${esc(thread.slug)} · genesis ${esc(thread.genesis_hash ?? '')}<br>${badge}</div>
${rows}
<div class="trust">trusted: false — chain verification proves structure, never content. Cite records by hash.</div>
</main></body></html>`;
}

function handle(hub, { method, path: p, bodyJson, publicMode = false, gateWrites = false,
                       ip, allowWrite, checkerSource } = {}) {
  // A matched POST route consuming a body the transport could not
  // read/parse answers exactly as the old in-route read did. Only
  // undefined (no body supplied) coalesces to {}: a literal JSON null
  // body flows through as null, exactly as JSON.parse always returned it.
  const body = () => { if (bodyJson instanceof Error) throw bodyJson; return bodyJson === undefined ? {} : bodyJson; };

  // Publication filtering (public mode): every read surface serves only
  // effectively-published threads — threads whose LAST publication event
  // is a ThreadPublished (DR-2026-07-13-record-is-the-interface rule 2).
  const parsedRecords = (threadId) => hub.store.recordsOf(threadId).map((r) => JSON.parse(r.body));
  const isPublished = (threadId) => effectivePublication(parsedRecords(threadId)).published;
  // The thread, as the public may see it: null when missing OR unpublished.
  const readableThread = (idOrSlug) => {
    const thread = hub.store.getThread(idOrSlug);
    if (!thread) return null;
    if (publicMode && !isPublished(thread.id)) return null;
    return thread;
  };

  try {
    if (method === 'POST' && gateWrites && publicMode) {
      // No public write path exists on a gated deployment. Answer the
      // shared 404 bytes BEFORE rate limit or route match: a probe of a
      // POST route must be indistinguishable from a route that never
      // existed.
      return { ...PUBLIC_404 };
    }
    if (method === 'POST' && !allowWrite(ip ?? '?')) {
      return json(429, { error: 'rate limit exceeded', code: 'rate_limited' });
    }

    if (method === 'GET' && p === '/') {
      const threads = hub.store.listThreads().filter((t) => !publicMode || isPublished(t.id));
      return json(200, {
        instance: 'threadhub.v0',
        // In public mode even the record COUNT is computed over published
        // threads only — a total that moves with unpublished writes would
        // disclose activity the record has not published.
        records: publicMode
          ? threads.reduce((n, t) => n + hub.store.recordsOf(t.id).length, 0)
          : hub.store.countRecords(),
        threads: threads.map(t => ({ id: t.id, slug: t.slug, title: t.title })),
      });
    }
    if (method === 'GET' && p === '/threads') {
      return json(200, hub.store.listThreads().filter((t) => !publicMode || isPublished(t.id)));
    }
    if (method === 'GET' && p === '/verify.mjs' && checkerSource != null) {
      const src = typeof checkerSource === 'function' ? checkerSource() : checkerSource;
      return { status: 200, contentType: CHECKER_TYPE, body: String(src) };
    }
    if (method === 'POST' && p === '/threads') {
      const b = body();
      return json(201, hub.createThread({ title: b.title, question: b.question, authorId: b.author }));
    }
    if (method === 'POST' && p === '/identities') {
      const b = body();
      return json(201, hub.createIdentity({ displayName: b.display_name, kind: b.kind, publicKey: b.public_key }));
    }

    let m;
    if ((m = p.match(/^\/t\/([^/]+)\.json$/)) && method === 'GET') {
      const slug = decodeURIComponent(m[1]);
      if (publicMode) {
        const thread = readableThread(slug);
        if (!thread) return { ...PUBLIC_404 };
        return json(200, hub.exportThread(thread.id));
      }
      return json(200, hub.exportThread(slug));
    }
    if ((m = p.match(/^\/t\/([^/]+)\/verify$/)) && method === 'GET') {
      const slug = decodeURIComponent(m[1]);
      if (publicMode) {
        const thread = readableThread(slug);
        if (!thread) return { ...PUBLIC_404 };
        return json(200, hub.verifyThread(thread.id));
      }
      return json(200, hub.verifyThread(slug));
    }
    if ((m = p.match(/^\/t\/([^/]+)\/view$/)) && method === 'GET') {
      // The public read page: the record is the interface (DR-2026-07-13
      // rule 1). The raw /t/:slug viewer stays untouched beside it.
      const slug = decodeURIComponent(m[1]);
      const thread = publicMode ? readableThread(slug) : hub.store.getThread(slug);
      if (!thread) {
        return publicMode ? { ...PUBLIC_404 } : json(404, { error: 'thread not found', code: 'not_found' });
      }
      const rows = hub.store.recordsOf(thread.id);
      const authors = [...new Set(rows.map((r) => r.author_id))].map((id) => {
        const ident = hub.store.getIdentity(id);
        return {
          id,
          displayName: ident?.display_name ?? null,
          kind: ident?.kind ?? null,
          custodial: Boolean(ident?.private_key), // the custody disclosure, derived from the author set
        };
      });
      return html(200, threadViewHTML({ thread, records: rows, verification: hub.verifyThread(thread.id), authors }));
    }
    if ((m = p.match(/^\/t\/([^/]+)\/records$/)) && method === 'POST') {
      const b = body();
      const r = hub.append({ threadId: decodeURIComponent(m[1]), authorId: b.author, kind: b.kind ?? 'note', payload: b.payload });
      return json(201, { record_hash: r.record_hash, seq: r.seq });
    }
    if ((m = p.match(/^\/t\/([^/]+)\/records\/signed$/)) && method === 'POST') {
      const b = body();
      const r = hub.appendSigned({ threadId: decodeURIComponent(m[1]), envelope: b.envelope, signature: b.signature });
      return json(201, { record_hash: r.record_hash, seq: r.seq });
    }
    if ((m = p.match(/^\/t\/([^/]+)\/attest$/)) && method === 'POST') {
      const b = body();
      const r = hub.attest({ threadId: decodeURIComponent(m[1]), authorId: b.author, payloadHash: b.payload_hash, claim: b.claim });
      return json(201, { record_hash: r.record_hash, seq: r.seq });
    }
    if ((m = p.match(/^\/t\/([^/]+)$/)) && method === 'GET') {
      const slug = decodeURIComponent(m[1]);
      const thread = publicMode ? readableThread(slug) : hub.store.getThread(slug);
      if (!thread) {
        return publicMode ? { ...PUBLIC_404 } : json(404, { error: 'thread not found', code: 'not_found' });
      }
      return html(200, viewerHTML(thread, hub.store.recordsOf(thread.id), hub.verifyThread(thread.id)));
    }
    if ((m = p.match(/^\/r\/(sha256:[0-9a-f]{64})$/)) && method === 'GET') {
      const r = hub.store.getRecord(m[1]);
      if (publicMode) {
        // A record fetched by hash is a read of its thread: unpublished
        // thread, missing record — same answer, same bytes.
        if (!r || !isPublished(r.thread_id)) return { ...PUBLIC_404 };
        return json(200, JSON.parse(r.body));
      }
      return r ? json(200, JSON.parse(r.body)) : json(404, { error: 'record not found', code: 'not_found' });
    }
    return { ...PUBLIC_404 };
  } catch (e) {
    return errorResponse(e);
  }
}

module.exports = { handle, rateLimiter, errorResponse, PUBLIC_404_BODY, STATUS_FOR };
