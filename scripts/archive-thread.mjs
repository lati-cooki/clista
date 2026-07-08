#!/usr/bin/env node
// archive-thread.mjs — archive a cockpit thread's raw event log into ThreadHub,
// so a decision gets a permanent, hash-chained, citable address OUTSIDE the
// app's own store. One-way, manual, operator-run: app → ThreadHub.
//
//   node scripts/archive-thread.mjs <threadId>
//     [--app https://app.clista.ai]     source cockpit
//     [--hub http://127.0.0.1:7777]     destination ThreadHub
//     [--author id_troy]                custodial hub identity doing the archive
//     [--title "..."]                   hub thread title (default: original + id)
//     [--email you@x]                   dev/staging auth (X-Clista-Email; DEV_IDENTITY only)
//     [--from export.json]              skip the fetch; archive a saved export
//     [--force]                         archive even if the thread is not decided
//
// Auth to the app (production is behind Cloudflare Access): pass CF_ACCESS_TOKEN,
// or let this script mint one via `cloudflared access token` (run
// `cloudflared access login <app>` once first). --email is the local-dev path.
//
// The export is stored VERBATIM: each app event (ids, content_hash, chain
// fields included) becomes the payload of one hub record, so the archive is
// independently re-verifiable against the app's own hashes.
'use strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const threadId = args[0] && !args[0].startsWith('--') ? args[0] : null;
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const has = (name) => args.includes(`--${name}`);

const APP = (flag('app', 'https://app.clista.ai')).replace(/\/$/, '');
const HUB = (flag('hub', 'http://127.0.0.1:7777')).replace(/\/$/, '');
const AUTHOR = flag('author', 'id_troy');
const die = (msg) => { console.error(`✘ ${msg}`); process.exit(1); };

function accessToken() {
  if (process.env.CF_ACCESS_TOKEN) return process.env.CF_ACCESS_TOKEN;
  try {
    return execFileSync('cloudflared', ['access', 'token', `--app=${APP}`], { encoding: 'utf8' }).trim();
  } catch {
    die(`no Access token for ${APP} — run: cloudflared access login ${APP}  (or set CF_ACCESS_TOKEN / use --email for dev)`);
  }
}

async function fetchExport() {
  const from = flag('from');
  if (from) return JSON.parse(fs.readFileSync(from, 'utf8'));
  if (!threadId) die('usage: archive-thread.mjs <threadId> [--from export.json] [options]');
  const headers = flag('email') ? { 'x-clista-email': flag('email') } : { 'cf-access-token': accessToken() };
  const res = await fetch(`${APP}/api/threads/${encodeURIComponent(threadId)}/export`, { headers });
  if (!res.ok) die(`export fetch failed: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

async function hub(method, path, body) {
  // The hub write budget is 120/min by default — big threads back off on 429.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(HUB + path, { method, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429 && attempt < 3) {
      console.error(`  … hub rate limit, backing off 20s (${path})`);
      await new Promise((r) => setTimeout(r, 20_000));
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) die(`${method} ${path} → ${res.status} ${data.error || ''}`);
    return data;
  }
}

const events = await fetchExport();
if (!Array.isArray(events) || events.length === 0) die('export is empty — no such thread?');

const created = events.find((e) => e.event_type === 'ThreadCreated');
const original = created?.payload?.thread || {};
const id = original.id || threadId || 'unknown';
if (!events.some((e) => e.event_type === 'DecisionMerged') && !has('force')) {
  die(`thread ${id} has no DecisionMerged — archive is meant for decided threads (--force to override)`);
}

const title = flag('title', `${original.title || id} — app archive ${String(id).slice(-8)}`);
console.error(`archiving ${id}: ${events.length} events → ${HUB} as "${title}"`);

const thread = await hub('POST', '/threads', { title, question: original.question, author: AUTHOR });
for (const [i, event] of events.entries()) {
  const r = await hub('POST', `/t/${thread.slug}/records`, { author: AUTHOR, kind: 'clista.event', payload: event });
  console.error(`  ${String(i + 1).padStart(3)}/${events.length} ${event.event_type} → seq ${r.seq}`);
}

const verify = await hub('GET', `/t/${thread.slug}/verify`);
if (!verify.valid) die(`archived chain did NOT verify: ${JSON.stringify(verify.problems)}`);
console.log(JSON.stringify({
  ok: true,
  source: { app: APP, thread: id, events: events.length },
  archive: { hub: HUB, slug: thread.slug, thread: verify.thread, records: verify.records, head: verify.head },
}, null, 2));
