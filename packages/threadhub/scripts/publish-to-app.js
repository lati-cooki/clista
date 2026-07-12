#!/usr/bin/env node
// publish-to-app.js — publish a finalized hub thread's ClisTa event log to the
// app.clista.ai cockpit, so a notarized decision becomes browsable in the app.
// One-way, manual, operator-run: hub → app. The mirror image of the app repo's
// scripts/archive-thread.mjs (app → hub).
//
//   node scripts/publish-to-app.js <slug>
//     [--hub http://127.0.0.1:7777]     source ThreadHub
//     [--app https://app.clista.ai]     destination cockpit
//     [--as thr_...]                    app thread id (default: the ThreadCreated id)
//     [--email you@x]                   dev/staging auth (X-Clista-Email; DEV_IDENTITY only)
//     [--from export.json]             skip the hub fetch; publish a saved /t/:slug.json
//     [--force]                         publish even if the thread has no decision/claim
//     [--dry-run]                       validate + show the plan, write nothing
//
// Auth to the app (production is behind Cloudflare Access), in order:
//   --email                             local-dev only (DEV_IDENTITY=true)
//   CF_ACCESS_TOKEN                     a user token (cf-access-token header)
//   CF_ACCESS_CLIENT_ID/_SECRET         an Access service token (unattended)
//   cloudflared access token            minted on the fly (login once first)
//
// What gets published: only `clista.event` records, unwrapped to their verbatim
// payloads (the app events were archived with ids/content_hash/chain fields
// intact, so the app's ingest re-chains to identical hashes). genesis /
// attestation / note records stay in the hub — they are hub metadata, not
// protocol events. The app ingests only into an EMPTY thread and registered
// threads are append-only, so a publish is one-shot and permanent.
'use strict';

// --- pure helpers (tested in test/publish-to-app.test.js) ---

// The ClisTa events of a hub export: clista.event records only, in chain
// order, unwrapped from their threadhub.record.v0 envelopes.
function clistaEventsOf(envelopes) {
  return envelopes
    .filter((r) => r.kind === 'clista.event')
    .sort((a, b) => a.seq - b.seq)
    .map((r) => r.payload);
}

// The app thread id is the protocol thread id — the app names each thread's
// Durable Object by it, so the ingest path segment must match.
function appThreadIdOf(events) {
  const created = events.find((e) => e.event_type === 'ThreadCreated');
  return created?.payload?.thread?.id ?? null;
}

// "Final" = the thread reached a decision: a formal DecisionMerged, or the
// decision-as-claim shape the Prompt Studio seal flow writes (ClaimCreated).
function isFinal(events) {
  return events.some(
    (e) => e.event_type === 'DecisionMerged' || e.event_type === 'ClaimCreated'
  );
}

// Auth headers for the app, or null when nothing is configured (the caller
// then tries to mint a token via cloudflared).
function buildAuthHeaders(env, email) {
  if (email) return { 'x-clista-email': email };
  if (env.CF_ACCESS_TOKEN) return { 'cf-access-token': env.CF_ACCESS_TOKEN };
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    return {
      'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
    };
  }
  return null;
}

module.exports = { clistaEventsOf, appThreadIdOf, isFinal, buildAuthHeaders };
if (require.main !== module) return;

// --- operator shell ---
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const args = process.argv.slice(2);
const slug = args[0] && !args[0].startsWith('--') ? args[0] : null;
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const has = (name) => args.includes(`--${name}`);

const HUB = (flag('hub', 'http://127.0.0.1:7777')).replace(/\/$/, '');
const APP = (flag('app', 'https://app.clista.ai')).replace(/\/$/, '');
const die = (msg) => { console.error(`✘ ${msg}`); process.exit(1); };

function authHeaders() {
  const built = buildAuthHeaders(process.env, flag('email'));
  if (built) return built;
  try {
    const token = execFileSync('cloudflared', ['access', 'token', `--app=${APP}`], { encoding: 'utf8' }).trim();
    return { 'cf-access-token': token };
  } catch {
    die(`no Access credentials for ${APP} — set CF_ACCESS_TOKEN or CF_ACCESS_CLIENT_ID/_SECRET, run: cloudflared access login ${APP}, or use --email for dev`);
  }
}

async function getJSON(url, headers) {
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) die(`GET ${url} → ${res.status} ${data.error || ''}`);
  return data;
}

(async () => {
  // 1. Source: a saved export, or the live hub (verify the chain first —
  //    never publish a log whose notarized chain does not verify).
  let envelopes;
  if (flag('from')) {
    envelopes = JSON.parse(fs.readFileSync(flag('from'), 'utf8'));
  } else {
    if (!slug) die('usage: publish-to-app.js <slug> [--from export.json] [options]');
    const verify = await getJSON(`${HUB}/t/${encodeURIComponent(slug)}/verify`);
    if (!verify.valid) die(`hub chain for ${slug} does NOT verify: ${JSON.stringify(verify.problems)}`);
    envelopes = await getJSON(`${HUB}/t/${encodeURIComponent(slug)}.json`);
  }
  if (!Array.isArray(envelopes) || envelopes.length === 0) die('hub export is empty — no such thread?');

  // 2. Unwrap and gate.
  const events = clistaEventsOf(envelopes);
  if (events.length === 0) die('thread has no clista.event records — nothing the app can ingest');
  const threadId = flag('as', appThreadIdOf(events));
  if (!threadId) die('no ThreadCreated event in the log — pass --as <thr_id> to name the app thread');
  if (!isFinal(events) && !has('force')) {
    die(`thread has no DecisionMerged or ClaimCreated — publish is meant for final threads (--force to override)`);
  }

  console.error(`publishing ${slug || flag('from')}: ${events.length} events → ${APP}/api/threads/${threadId}/ingest`);
  if (has('dry-run')) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      app: APP,
      threadId,
      events: events.map((e) => e.event_type),
    }, null, 2));
    return;
  }

  // 3. Publish: one atomic ingest — the app validates the whole chained log
  //    through the ClisTa engine before storing anything (fail-closed), and
  //    refuses a thread that already has events.
  const headers = { 'content-type': 'application/json', ...authHeaders() };
  const res = await fetch(`${APP}/api/threads/${encodeURIComponent(threadId)}/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ events }),
  });
  const result = await res.json().catch(() => ({}));
  if (res.status === 401) die(`app rejected the credentials (401): ${result.reason || ''}`);
  if (!res.ok || !result.ok) {
    die(`ingest refused (${res.status}): ${JSON.stringify(result.reasons || result, null, 2)}`);
  }

  // 4. Round-trip check: the app's head hash must equal the hub's last
  //    archived event hash (when the archived events carry one).
  const lastHash = events.at(-1)?.content_hash ?? null;
  if (lastHash && result.head_hash && lastHash !== result.head_hash) {
    die(`head hash mismatch — hub ${lastHash} vs app ${result.head_hash}; the app re-chained differently`);
  }

  console.log(JSON.stringify({
    ok: true,
    source: { hub: HUB, slug, records: envelopes.length, events: events.length },
    published: { app: APP, threadId, count: result.count, head: result.head_hash },
    url: `${APP}/#/t/${threadId}`,
  }, null, 2));
})();
