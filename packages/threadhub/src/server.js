// server.js — thin Node http adapter over routes.js. No framework.
// The route table, response shaping, and every byte of every body live in
// routes.js (transport-agnostic); this file only speaks node:http:
// readBody → bodyJson, remoteAddress → ip, writeHead/end from the
// response descriptor, and the fs read that feeds the /verify.mjs seam.
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
//   GET  /verify.mjs                standalone checker (save it, run it elsewhere)
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Hub } = require('./hub');
const { handle, rateLimiter, errorResponse } = require('./routes');

// The standalone checker's bytes, served verbatim. A checker served by the
// hub it checks is a convenience, not independence — the file's own header
// says so and tells the reader to save it and run it elsewhere.
const CHECKER_PATH = path.join(__dirname, '..', 'scripts', 'verify-standalone.mjs');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5e6) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function createServer(dbPath, opts = {}) {
  const hub = new Hub(dbPath);
  const allowWrite = rateLimiter(opts.rateLimit);

  // Public mode (THREADHUB_PUBLIC_MODE=1): every read surface serves only
  // effectively-published threads (DR-2026-07-13-record-is-the-interface
  // rule 2); routes.js owns the filtering and the byte-identical 404s.
  const publicMode = opts.publicMode ?? process.env.THREADHUB_PUBLIC_MODE === '1';

  const server = http.createServer(async (req, res) => {
    let out;
    try {
      // A failed body read is handed to routes.js as the Error itself:
      // only a matched POST route consuming the body surfaces it (as the
      // old in-route read did), so a bad body on an unrouted path still
      // answers 404, and a rate-limited POST still answers 429.
      const bodyJson = req.method === 'POST' ? await readBody(req).catch((e) => e) : undefined;
      out = handle(hub, {
        method: req.method,
        path: new URL(req.url, 'http://x').pathname,
        bodyJson,
        publicMode,
        gateWrites: false, // Node serves the operator's own hub; writes stay routable
        ip: req.socket.remoteAddress ?? '?',
        allowWrite,
        checkerSource: () => fs.readFileSync(CHECKER_PATH, 'utf8'),
      });
    } catch (e) {
      out = errorResponse(e);
    }
    res.writeHead(out.status, { 'content-type': out.contentType });
    res.end(out.body);
  });
  return { server, hub };
}

module.exports = { createServer };
