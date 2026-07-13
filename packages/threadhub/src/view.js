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
  return `<article class="rec${dissent ? ' dissent' : ''}" data-event-type="${esc(eventType)}">
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
  const badge = verification.valid
    ? `<span class="ok">chain verified · ${verification.records} records · head ${esc(verification.head ?? '')}</span>`
    : `<span class="bad">CHAIN INVALID · ${verification.problems.length} problem(s)</span>`;
  const custodial = authors.filter((a) => a.custodial);
  const custody = authors.map((a) =>
    `${a.id}${a.displayName ? ` (${a.displayName}${a.kind ? `, ${a.kind}` : ''})` : ''} — ${a.custodial
      ? 'custodial: the hub holds this writer’s key'
      : 'non-custodial: the writer signed at reasoning time'}`
  ).join('; ');
  const slugJs = JSON.stringify(encodeURIComponent(thread.slug)); // URL-safe before it enters the inline script

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(thread.title)} — Consensus Protocol</title>
<style>
  :root { --bg:#101312; --ink:#cfd8d3; --dim:#6d7a74; --ok:#7fd1a8; --bad:#e08585; --line:#232a27; --acc:#d8c27a; --dissent:#e0a057; }
  body { background:var(--bg); color:var(--ink); font:15px/1.6 ui-monospace,'SF Mono',Menlo,monospace; margin:0; padding:2.5rem 1.25rem; }
  main { max-width:820px; margin:0 auto; }
  h1 { font-size:1.3rem; font-weight:650; margin:0 0 .3rem; }
  .question { font-size:1.05rem; color:var(--ink); margin:0 0 .4rem; }
  .meta { color:var(--dim); font-size:.78rem; margin-bottom:2rem; word-break:break-all; }
  .ok { color:var(--ok); } .bad { color:var(--bad); }
  .rec { border:1px solid var(--line); border-left:3px solid var(--line); padding:.7rem .9rem; margin:.7rem 0; }
  /* Dissent renders HEAVIER than everything else — concessions, the
     reversal, the surviving objection are first-class (DR rule 3). */
  .rec.dissent { border-left:6px solid var(--dissent); background:#161a18; font-size:1.08em; }
  .rec.dissent .type { color:var(--dissent); font-weight:700; }
  .rec header { display:flex; flex-wrap:wrap; gap:.9rem; align-items:baseline; color:var(--dim); font-size:.78rem; margin-bottom:.35rem; }
  .rec header .type { color:var(--acc); font-size:.9rem; }
  .text { margin:.25rem 0; }
  .text .label { color:var(--dim); font-size:.78rem; margin-right:.5rem; }
  .payload { background:#0a0d0c; border:1px solid var(--line); padding:.7rem; overflow-x:auto; font-size:.74rem; margin:.4rem 0; }
  .chain { color:var(--dim); font-size:.68rem; font-family:ui-monospace,Menlo,monospace; margin-top:.5rem; word-break:break-all; }
  footer { color:var(--dim); font-size:.8rem; margin-top:2.2rem; border-top:1px solid var(--line); padding-top:1rem; }
  footer h2 { font-size:.9rem; color:var(--ink); margin:1.1rem 0 .3rem; }
  button { background:var(--line); color:var(--ink); border:1px solid var(--dim); padding:.45rem .9rem; font:inherit; cursor:pointer; }
  #verify-out { white-space:pre-wrap; word-break:break-all; margin-top:.6rem; }
  #verify-out.ok { color:var(--ok); } #verify-out.bad { color:var(--bad); }
</style></head><body><main>
<h1>${esc(thread.title)}</h1>
${genesis?.payload?.question ? `<p class="question">${esc(genesis.payload.question)}</p>` : ''}
<div class="meta">${esc(thread.id)} · /t/${esc(thread.slug)} · ${badge}</div>
${blocks}
<footer>
<h2>custody</h2>
<p>${esc(custody)}${custodial.length
    ? ' Custodial records are verifiable, but their independence claim is downgraded: the hub could technically have signed as that writer (DR-phase5-topology rule 5.3; upgrade path 5.4).'
    : ''}</p>
<h2>verify this yourself</h2>
<p>The button below runs the byte-identical checker this hub serves at <a href="/verify.mjs">/verify.mjs</a> —
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
</footer>
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
<style>
  :root { --bg:#101312; --ink:#cfd8d3; --dim:#6d7a74; --ok:#7fd1a8; --line:#232a27; --acc:#d8c27a; }
  body { background:var(--bg); color:var(--ink); font:15px/1.6 ui-monospace,'SF Mono',Menlo,monospace; margin:0; padding:2.5rem 1.25rem; }
  main { max-width:820px; margin:0 auto; }
  h1 { font-size:1.3rem; font-weight:650; margin:0 0 .6rem; }
  .intro { margin:0 0 1.8rem; }
  .threads { list-style:none; padding:0; margin:0 0 1.8rem; }
  .threads li { border-top:1px solid var(--line); padding:.6rem 0; }
  .threads li:last-child { border-bottom:1px solid var(--line); }
  .threads a { color:var(--acc); text-decoration:none; }
  .threads a:hover { text-decoration:underline; }
  .slug { color:var(--dim); font-size:.78rem; margin-left:.5rem; word-break:break-all; }
  .empty { color:var(--dim); margin:0 0 1.8rem; }
  .note { color:var(--dim); font-size:.85rem; margin:.6rem 0 0; border-top:1px solid var(--line); padding-top:1rem; }
  .note a { color:var(--acc); }
</style></head><body><main>
<h1>Consensus Protocol</h1>
<p class="intro">A public ledger of sealed decision records. Each thread below is an append-only, hash-chained log of a decision — the proposal, the challenge, the concessions, and the surviving reservations, in the order they were witnessed.</p>
${list}
<p class="note">The record verifies on your machine, not on our word — open a thread and use “verify this thread”, or save <a href="/verify.mjs">/verify.mjs</a> and run it yourself.</p>
<p class="note">The chain proves what was recorded and when — never that the decision was good.</p>
</main></body></html>`;
}

module.exports = { threadViewHTML, landingHTML, DISSENT_BEARING_TYPES };
