// view.js — the public thread viewer template (GET /t/:slug/view).
// DR-2026-07-13-record-is-the-interface, rules 1, 3, 4. Zero dependencies,
// server-rendered string template, everything escaped.
//
// The record is the interface: this page renders the witnessed sequence, in
// witnessed order — it never summarizes, reorders, or elides. Narrative
// chrome is limited to typography, and the typography is doctrine too:
// dissent-bearing events (the protocol registry's DISSENT_BEARING_TYPES)
// render HEAVIER than everything else, because every governance UI buries
// dissent below the outcome and this is the one product where the argument
// is the merchandise. A PositionTaken answered by a final ClaimCreated that
// reverses it is the centerpiece — foregrounded, not summarized.
//
// The "verify this thread" button imports the literal /verify.mjs — the
// byte-identical artifact the skeptic is told to save. No bundle, no
// sibling verifier: implementation identity is a build-level guarantee
// because there is no build step to drift (rule 4).
'use strict';

// Vendored VERBATIM from packages/protocol/src/event-types.js
// DISSENT_BEARING_TYPES (DR-2026-07-12-curation-check rule 1) — the
// mechanical definition of what this page must foreground. ThreadHub stays
// zero-dependency and standalone, so the list is vendored rather than
// required across packages; test/view.test.js asserts byte-equality with
// the protocol registry at test time, the same test-time-sweep discipline
// the registry itself uses. Keep sorted and unique.
const DISSENT_BEARING_TYPES = Object.freeze([
  'CompatibilityFailureRecorded',
  'ContributionAttributionDisputed',
  'DelegationViolationRecorded',
  'ExecutionViolationRecorded',
  'GateRejectionRecorded',
  'InteroperabilityFailureRecorded',
  'LearningDisputed',
  'LearningViolationRecorded',
  'MinorityReportFiled',
  'NegotiationDifferenceRecorded',
  'NegotiationFailureRecorded',
  'NegotiationTermsRejected',
  'ObjectionRaised',
  'ObjectionResolved',
  'OutcomeDisputed',
  'OutcomeViolationRecorded',
  'PositionTaken',
  'RecoveryViolationRecorded',
  'ReviewDisputed',
  'ReviewViolationRecorded',
]);
const DISSENT_SET = new Set(DISSENT_BEARING_TYPES);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// CP_STYLE — the Consensus Protocol Design System tokens + base primitives,
// inlined (the CF CSP forbids external hosts, so no font/stylesheet fetch).
// Ported from the design project 0d24922c-ca70-4b53-9506-61af0219b125
// (tokens/*.css + base.css); fonts degrade to the system stack per owner
// decision — IBM Plex names stay first for anyone who has them locally.
// Shared by all three hub HTML faces (landing, thread viewer, and the raw
// /t/:slug viewer in routes.js) so they read as one system: warm paper +
// ink, two signal colors (dissent rust, verify green), hairline structure,
// the chain-spine motif. No gradients, no shadows.
const CP_STYLE = `
:root{
--paper-0:#FBFAF6;--paper-1:#F3F1EA;--paper-2:#EAE7DC;--paper-3:#E1DDD0;
--ink-0:#17181B;--ink-1:#3B3D42;--ink-2:#6C6E74;--ink-3:#9B9C9F;
--rule:#DDD9CE;--rule-strong:#C6C1B2;
--dissent:#B23A1E;--dissent-ink:#8C2C13;--dissent-wash:#F7E9E1;--dissent-rule:#E3C3B3;
--verify:#1E7A50;--verify-ink:#185E3E;--verify-wash:#E3EFE8;--verify-rule:#BAD6C6;
--pending:#9A6B12;--pending-wash:#F4ECD9;--pending-rule:#DDCBA0;
--font-serif:"IBM Plex Serif",ui-serif,Georgia,serif;
--font-sans:"IBM Plex Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
--font-mono:"IBM Plex Mono",ui-monospace,'SF Mono',Menlo,monospace;
}
*,*::before,*::after{box-sizing:border-box}
body{background:var(--paper-0);color:var(--ink-1);font:15px/1.5 var(--font-sans);margin:0;padding:2.5rem 1.25rem;-webkit-font-smoothing:antialiased}
main{max-width:820px;margin:0 auto}
a{color:var(--dissent-ink);text-decoration:none;text-underline-offset:2px}
a:hover{color:var(--dissent);text-decoration:underline}
::selection{background:rgba(178,58,30,.16)}
h1,h2{color:var(--ink-0);margin:0}
.cp-kicker{font:600 11px/1 var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.cp-hash{font-family:var(--font-mono);font-size:12px;letter-spacing:.01em;color:var(--ink-2);word-break:break-all}
.cp-rule{border:0;border-top:1px solid var(--rule);margin:1.6rem 0}
.cp-spine{position:relative;padding-left:32px}
.cp-spine::before{content:"";position:absolute;left:20px;top:6px;bottom:6px;width:1.5px;background:var(--rule-strong)}
.cp-spine[data-live-dispute]::before{background:var(--dissent)}
.cp-node{position:relative}
.cp-node::before{content:"";position:absolute;left:-15px;top:6px;width:7px;height:7px;border-radius:999px;background:var(--paper-0);border:1.5px solid var(--rule-strong)}
.cp-node[data-dissent]::before{border-color:var(--dissent);background:var(--dissent)}
.cp-node[data-seal]::before{border-color:var(--ink-0);background:var(--ink-0);border-radius:2px}
@media(prefers-reduced-motion:reduce){*{transition-duration:.001ms!important;animation-duration:.001ms!important}}
`;

// The payload's human text, per event type: claim text, position statement,
// objection text + inline resolution, evidence findings, precedent holdings.
// Types without an extractor fall back to their full escaped payload — the
// record is never hidden, only typeset.
function humanLines(eventType, inner) {
  const lines = [];
  const push = (label, text) => { if (text) lines.push({ label, text: String(text) }); };
  switch (eventType) {
    case 'ClaimCreated':
      push('claim', inner?.claim?.text);
      break;
    case 'PositionTaken': {
      const pos = inner?.position;
      push('position', pos && [pos.stance, pos.reason].filter(Boolean).join(' — '));
      break;
    }
    case 'ObjectionRaised': {
      const obj = inner?.objection;
      push('objection', obj?.text);
      push('resolution', obj?.resolution);
      break;
    }
    case 'ObjectionResolved':
      push('resolution', inner?.resolution ?? inner?.objection?.resolution);
      break;
    case 'EvidenceCommitted': {
      const ev = inner?.evidence;
      push('finding', ev?.finding);
      push('source', ev?.source);
      break;
    }
    case 'CrossThreadEvidence':
      push('finding', inner?.crossThreadEvidence?.finding);
      break;
    case 'PrecedentReference':
      push('holding', inner?.precedentReference?.holding);
      break;
    case 'MinorityReportFiled':
      push('minority report', inner?.minorityReport?.summary ?? inner?.minorityReport?.text);
      break;
    case 'GateRejectionRecorded':
      push('rejection', (inner?.gateRejection?.reasons ?? []).map((r) => r?.reason).filter(Boolean).join('; '));
      break;
    case 'SealedReport':
      for (const claim of inner?.sealedReport?.claims ?? []) push('sealed claim', claim?.text);
      break;
    default:
      break;
  }
  return lines;
}

// One record block. env is the parsed record body; row carries the sidecar
// record_hash/signature; author is { id, displayName } (displayName null
// when the identity is unknown).
function recordBlock(row, env, author) {
  const eventType = env.kind === 'clista.event' ? (env.payload?.event_type ?? 'clista.event') : env.kind;
  const dissent = DISSENT_SET.has(eventType);
  let lines;
  if (env.kind === 'clista.event') {
    lines = humanLines(eventType, env.payload?.payload);
  } else if (env.kind === 'genesis') {
    lines = [{ label: 'question', text: env.payload?.question ?? '' }].filter((l) => l.text);
  } else if (env.kind === 'attestation') {
    lines = [
      env.payload?.claim ? { label: 'claim', text: env.payload.claim } : null,
      { label: 'payload hash', text: env.payload?.payload_hash ?? '' },
    ].filter((l) => l && l.text);
  } else {
    lines = [];
  }
  const body = lines.length
    ? lines.map((l) => `<p class="text"><span class="label">${esc(l.label)}</span> ${esc(l.text)}</p>`).join('\n')
    : `<pre class="payload">${esc(JSON.stringify(env.payload, null, 2))}</pre>`;
  const who = author.displayName ? `${author.id} · ${author.displayName}` : author.id;
  // Spine node kind (base.css): dissent → rust node + rust card; the sealed
  // decision (genesis question / SealedReport) → solid ink node; else neutral.
  const seal = env.kind === 'genesis' || eventType === 'SealedReport';
  const nodeAttr = dissent ? ' data-dissent' : seal ? ' data-seal' : '';
  const cls = `rec cp-node${dissent ? ' dissent' : ''}${seal ? ' seal' : ''}`;
  return `<article class="${cls}" data-event-type="${esc(eventType)}"${nodeAttr}>
<header><span class="type">${esc(eventType)}</span><span class="author">${esc(who)}</span><time datetime="${esc(env.recorded_at)}">${esc(env.recorded_at)}</time></header>
${body}
<div class="chain">seq ${esc(env.seq)} · ${esc(row.record_hash)} · prev ${esc(env.prev ?? 'null (genesis)')}</div>
</article>`;
}

// thread: threads row; records: store rows in seq order; verification: the
// hub's verifyThread report; authors: [{ id, displayName, kind, custodial }]
// for every distinct author in the thread.
function threadViewHTML({ thread, records, verification, authors }) {
  const envelopes = records.map((r) => ({ row: r, env: JSON.parse(r.body) }));
  const genesis = envelopes.find(({ env }) => env.kind === 'genesis')?.env;
  const byId = new Map(authors.map((a) => [a.id, a]));
  const blocks = envelopes
    .map(({ row, env }) => recordBlock(row, env, byId.get(env.author) ?? { id: env.author, displayName: null }))
    .join('\n');
  // The spine turns rust when a live dispute runs through the thread — any
  // dissent-bearing event present (DR rule 3: dissent is the merchandise).
  const liveDispute = envelopes.some(({ env }) => {
    const et = env.kind === 'clista.event' ? (env.payload?.event_type ?? 'clista.event') : env.kind;
    return DISSENT_SET.has(et);
  });
  const badge = verification.valid
    ? `<span class="ok">chain verified · ${verification.records} records</span>`
    : `<span class="bad">CHAIN INVALID · ${verification.problems.length} problem(s)</span>`;
  const custodial = authors.filter((a) => a.custodial);
  // Custody badges near the header (design CustodyBadge): who holds each
  // writer's signing key, disclosed up front. Custodial = amber square dot,
  // "independence downgraded"; non-custodial = round dot, writer holds key.
  const chips = authors.map((a) => {
    const who = a.displayName ? `${a.id} · ${a.displayName}` : a.id;
    const note = a.custodial ? 'independence downgraded — hub holds key' : 'non-custodial — writer holds key';
    return `<span class="badge${a.custodial ? ' custodial' : ''}" title="${esc(a.custodial ? 'verifiable, independence downgraded' : 'independent writer')}"><span class="dot" aria-hidden="true"></span><span class="who">${esc(who)}</span><span class="note">${esc(note)}</span></span>`;
  }).join('\n');
  const headNode = verification.head
    ? `<div class="cp-node seal head-node"><span class="cp-kicker">Head</span> <span class="cp-hash">${esc(verification.head)}</span></div>`
    : '';
  const slugJs = JSON.stringify(encodeURIComponent(thread.slug)); // URL-safe before it enters the inline script

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(thread.title)} — Consensus Protocol</title>
<style>${CP_STYLE}
.url{font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-bottom:.55rem;word-break:break-all}
h1{font-family:var(--font-serif);font-size:32px;font-weight:600;line-height:1.18;letter-spacing:-.015em;color:var(--ink-0);margin:0 0 .3rem;text-wrap:balance}
.question{font-family:var(--font-serif);font-size:18px;line-height:1.5;color:var(--ink-1);margin:.4rem 0 0;max-width:62ch}
.badge-row{margin:.9rem 0 .2rem}
.ok,.bad{display:inline-flex;align-items:center;gap:.4rem;font:600 12px/1 var(--font-sans);border-radius:2px;padding:5px 10px}
.ok{color:var(--verify-ink);background:var(--verify-wash);border:1px solid var(--verify-rule)}
.bad{color:var(--dissent-ink);background:var(--dissent-wash);border:1px solid var(--dissent-rule)}
.custody-chips{display:flex;gap:.6rem;flex-wrap:wrap;margin:.7rem 0 .2rem}
.badge{display:inline-flex;align-items:center;gap:.5rem;padding:5px 10px;border-radius:2px;background:var(--paper-1);border:1px solid var(--rule-strong)}
.badge.custodial{background:var(--pending-wash);border-color:var(--pending-rule)}
.badge .dot{width:7px;height:7px;flex:none;border-radius:999px;background:var(--ink-2)}
.badge.custodial .dot{border-radius:2px;background:var(--pending)}
.badge .who{font-family:var(--font-mono);font-size:12px;color:var(--ink-1)}
.badge .note{font-size:10px;font-weight:600;color:var(--ink-2)}
.badge.custodial .note{color:var(--pending)}
.custody-note{font-size:12px;color:var(--ink-2);margin:.7rem 0 0;max-width:64ch;line-height:1.5}
.rec{padding:0 0 22px;margin:0}
.rec header{display:flex;flex-wrap:wrap;gap:.7rem;align-items:baseline;margin-bottom:.4rem}
.rec header .type{font:600 11px/1 var(--font-sans);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.rec header .author{font-family:var(--font-mono);font-size:12px;color:var(--ink-2)}
.rec header time{font-family:var(--font-mono);font-size:11px;color:var(--ink-3);margin-left:auto}
.text{font-family:var(--font-serif);font-size:16px;line-height:1.55;color:var(--ink-0);margin:.25rem 0;max-width:62ch}
.text .label{font:600 11px/1 var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);margin-right:.5rem}
.payload{background:var(--paper-2);border:1px solid var(--rule);border-radius:2px;padding:.7rem;overflow-x:auto;font-family:var(--font-mono);font-size:12px;line-height:1.6;color:var(--ink-1);margin:.4rem 0}
.chain{font-family:var(--font-mono);font-size:11px;color:var(--ink-3);margin-top:.55rem;word-break:break-all}
/* Dissent renders HEAVIER than everything else — the surviving objection,
   the concession, the reversal are first-class (DR rule 3). ObjectionCard. */
.rec.dissent{background:var(--dissent-wash);border:1px solid var(--dissent-rule);border-left:3px solid var(--dissent);border-radius:2px;padding:16px 18px;margin:0 0 22px}
.rec.dissent header .type{color:var(--dissent);font-weight:700}
.rec.dissent .text{font-size:18px;font-weight:500}
.rec.dissent .chain{color:var(--dissent-ink)}
.head-node{padding-top:.3rem}
.verify-panel{border:1px solid var(--rule-strong);border-radius:2px;background:var(--paper-1);padding:20px 22px}
.verify-panel .cp-kicker{margin-bottom:.5rem;display:block}
.vp-caveat{font-family:var(--font-serif);font-size:15px;line-height:1.55;color:var(--ink-1);margin:.4rem 0 1rem;max-width:62ch}
#verify-btn{background:var(--verify);color:#fff;border:1px solid var(--verify);border-radius:3px;font:600 15px/1 var(--font-sans);padding:9px 16px;cursor:pointer}
#verify-btn:hover{background:var(--verify-ink)}
#verify-out{font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;word-break:break-all;margin-top:.7rem}
#verify-out.ok{color:var(--verify-ink);background:none;border:0;padding:0}
#verify-out.bad{color:var(--dissent);background:none;border:0;padding:0}
.footnote{font-family:var(--font-mono);font-size:11px;color:var(--ink-3);text-align:center;margin-top:1.5rem}
</style></head><body><main>
<div class="url">consensusprotocol.ai/t/${esc(thread.slug)}/view · ${esc(thread.id)}</div>
<h1>${esc(thread.title)}</h1>
${genesis?.payload?.question ? `<p class="question">${esc(genesis.payload.question)}</p>` : ''}
<div class="badge-row">${badge}</div>
<div class="custody-chips">${chips}</div>
${custodial.length
    ? '<p class="custody-note">Custodial records are verifiable, but their independence claim is downgraded: the hub could technically have signed as that writer (DR-phase5-topology rule 5.3; upgrade path 5.4).</p>'
    : ''}
<hr class="cp-rule">
<div class="cp-spine"${liveDispute ? ' data-live-dispute' : ''}>
${blocks}
${headNode}
</div>
<hr class="cp-rule">
<section class="verify-panel">
<span class="cp-kicker">Verify this thread</span>
<p class="vp-caveat">The button below runs the byte-identical checker this hub serves at <a href="/verify.mjs">/verify.mjs</a> —
the same file, not a port of it. Host-served verification is a convenience, not independence:
save that file and run it on another machine, against a saved copy of
<a href="/t/${esc(encodeURIComponent(thread.slug))}.json">this thread's records</a>, with nothing but Node.
Chain verification proves structure, never content. Cite records by hash.</p>
<button id="verify-btn" type="button">Verify this thread</button>
<pre id="verify-out"></pre>
<script type="module">
document.getElementById('verify-btn').addEventListener('click', async () => {
  const out = document.getElementById('verify-out');
  out.className = ''; out.textContent = 'verifying…';
  try {
    // THE single source: the page imports the same URL/bytes the skeptic
    // is told to save. No bundle step to drift.
    const checker = await import('/verify.mjs');
    const records = await (await fetch('/t/' + ${slugJs} + '.json')).json();
    const result = await checker.verifyExport(records);
    out.textContent = result.line;
    out.className = result.ok ? 'ok' : 'bad';
  } catch (err) {
    out.textContent = 'the checker failed to run here: ' + err.message + ' — save /verify.mjs and run it elsewhere.';
    out.className = 'bad';
  }
});
</script>
</section>
<p class="footnote">chain order preserved by seq · the record is the interface · the token is the auth</p>
</main></body></html>`;
}

// landingHTML — the content-negotiated root page (GET /) for browsers.
// A browser hitting the bare domain gets this spare index; every API client
// keeps the JSON listing. Same monospace-ledger aesthetic as the viewer, so
// the landing and the thread pages read as one system. `threads` is the
// SAME published-filtered list the JSON path builds — [{ id, slug, title }] —
// so an unpublished thread can never reach the page. Everything escaped;
// no external resources (the CF CSP forbids external hosts).
function landingHTML(threads) {
  const list = threads.length
    ? `<ul class="threads">
${threads.map((t) =>
      `<li><a href="/t/${esc(encodeURIComponent(t.slug))}/view">${esc(t.title)}</a> <span class="slug">/t/${esc(t.slug)}</span></li>`
    ).join('\n')}
</ul>`
    : '<p class="empty">No published records yet.</p>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Consensus Protocol — public decision records</title>
<style>${CP_STYLE}
h1.wordmark{display:flex;align-items:center;gap:.6rem;font:600 20px/1 var(--font-sans);letter-spacing:-.01em;color:var(--ink-0);margin:0 0 .9rem}
h1.wordmark .mark{width:20px;height:20px;flex:none;position:relative;border:1.5px solid var(--ink-0);border-radius:2px}
h1.wordmark .mark::before{content:"";position:absolute;top:3px;bottom:3px;left:50%;width:1.5px;background:var(--ink-0);transform:translateX(-50%)}
h1.wordmark .sub{font-weight:400;color:var(--ink-2)}
.intro{font-family:var(--font-serif);font-size:18px;line-height:1.6;color:var(--ink-1);margin:0 0 1.8rem;max-width:68ch}
.threads{list-style:none;padding:0;margin:0 0 1.8rem}
.threads li{border-top:1px solid var(--rule);padding:.7rem 0}
.threads li:last-child{border-bottom:1px solid var(--rule)}
.threads a{font-family:var(--font-serif);font-size:16px;color:var(--dissent-ink)}
.threads a:hover{color:var(--dissent)}
.slug{font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-left:.6rem;word-break:break-all}
.empty{font-family:var(--font-serif);color:var(--ink-2);margin:0 0 1.8rem}
.note{font-size:13px;color:var(--ink-2);margin:.6rem 0 0;border-top:1px solid var(--rule);padding-top:1rem;max-width:68ch;line-height:1.5}
.note a{color:var(--dissent-ink)}
</style></head><body><main>
<h1 class="wordmark"><span class="mark" aria-hidden="true"></span>Consensus <span class="sub">Protocol</span></h1>
<p class="intro">A public ledger of sealed decision records. Each thread below is an append-only, hash-chained log of a decision — the proposal, the challenge, the concessions, and the surviving reservations, in the order they were witnessed.</p>
${list}
<p class="note">The record verifies on your machine, not on our word — open a thread and use “verify this thread”, or save <a href="/verify.mjs">/verify.mjs</a> and run it yourself.</p>
<p class="note">The chain proves what was recorded and when — never that the decision was good.</p>
</main></body></html>`;
}

module.exports = { threadViewHTML, landingHTML, CP_STYLE, DISSENT_BEARING_TYPES };
