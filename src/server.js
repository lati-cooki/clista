// server.js — thin HTTP surface over the hub. No framework.
//
//   GET  /                          instance summary (JSON)
//   GET  /threads                   list threads
//   POST /threads                   { title, question?, author }
//   GET  /t/:slug                   raw viewer (HTML)
//   GET  /t/:slug.json              full record chain (JSON)
//   GET  /t/:slug/verify            chain verification report
//   POST /t/:slug/records           { author, kind, payload }
//   POST /t/:slug/attest            { author, payload_hash, claim? }
//   GET  /r/:hash                   single record by content address
//   POST /identities                { display_name, kind }
'use strict';
const http = require('node:http');
const { Hub } = require('./hub');

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

function json(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5e6) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
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

function createServer(dbPath, opts = {}) {
  const hub = new Hub(dbPath);
  const allowWrite = rateLimiter(opts.rateLimit);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const p = url.pathname;

      if (req.method === 'POST' && !allowWrite(req.socket.remoteAddress ?? '?')) {
        return json(res, 429, { error: 'rate limit exceeded', code: 'rate_limited' });
      }

      if (req.method === 'GET' && p === '/') {
        return json(res, 200, {
          instance: 'threadhub.v0', records: hub.store.countRecords(),
          threads: hub.store.listThreads().map(t => ({ id: t.id, slug: t.slug, title: t.title })),
        });
      }
      if (req.method === 'GET' && p === '/threads') return json(res, 200, hub.store.listThreads());
      if (req.method === 'POST' && p === '/threads') {
        const b = await readBody(req);
        return json(res, 201, hub.createThread({ title: b.title, question: b.question, authorId: b.author }));
      }
      if (req.method === 'POST' && p === '/identities') {
        const b = await readBody(req);
        return json(res, 201, hub.createIdentity({ displayName: b.display_name, kind: b.kind, publicKey: b.public_key }));
      }

      let m;
      if ((m = p.match(/^\/t\/([^/]+)\.json$/)) && req.method === 'GET') {
        return json(res, 200, hub.exportThread(decodeURIComponent(m[1])));
      }
      if ((m = p.match(/^\/t\/([^/]+)\/verify$/)) && req.method === 'GET') {
        return json(res, 200, hub.verifyThread(decodeURIComponent(m[1])));
      }
      if ((m = p.match(/^\/t\/([^/]+)\/records$/)) && req.method === 'POST') {
        const b = await readBody(req);
        const r = hub.append({ threadId: decodeURIComponent(m[1]), authorId: b.author, kind: b.kind ?? 'note', payload: b.payload });
        return json(res, 201, { record_hash: r.record_hash, seq: r.seq });
      }
      if ((m = p.match(/^\/t\/([^/]+)\/records\/signed$/)) && req.method === 'POST') {
        const b = await readBody(req);
        const r = hub.appendSigned({ threadId: decodeURIComponent(m[1]), envelope: b.envelope, signature: b.signature });
        return json(res, 201, { record_hash: r.record_hash, seq: r.seq });
      }
      if ((m = p.match(/^\/t\/([^/]+)\/attest$/)) && req.method === 'POST') {
        const b = await readBody(req);
        const r = hub.attest({ threadId: decodeURIComponent(m[1]), authorId: b.author, payloadHash: b.payload_hash, claim: b.claim });
        return json(res, 201, { record_hash: r.record_hash, seq: r.seq });
      }
      if ((m = p.match(/^\/t\/([^/]+)$/)) && req.method === 'GET') {
        const slug = decodeURIComponent(m[1]);
        const thread = hub.store.getThread(slug);
        if (!thread) return json(res, 404, { error: 'thread not found', code: 'not_found' });
        const html = viewerHTML(thread, hub.store.recordsOf(thread.id), hub.verifyThread(thread.id));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
      if ((m = p.match(/^\/r\/(sha256:[0-9a-f]{64})$/)) && req.method === 'GET') {
        const r = hub.store.getRecord(m[1]);
        return r ? json(res, 200, JSON.parse(r.body)) : json(res, 404, { error: 'record not found', code: 'not_found' });
      }
      json(res, 404, { error: 'not found', code: 'not_found' });
    } catch (e) {
      const code = e.code in STATUS_FOR ? e.code : 'bad_request';
      json(res, STATUS_FOR[code], { error: e.message, code });
    }
  });
  return { server, hub };
}

module.exports = { createServer };
