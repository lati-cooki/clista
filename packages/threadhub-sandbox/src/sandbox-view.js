// sandbox-view.js — the sandbox thread page.
//
// REUSE, not reinvention: the record spine, custody badges, dissent
// rendering, verify panel and the entire CP_STYLE design system come from the
// production viewer (packages/threadhub/src/view.js `threadViewHTML`). This
// module wraps that output with exactly two well-scoped, TESTED adaptations:
//
//   1. An unmissable SANDBOX DISCLOSURE BANNER at the top of the page:
//      ephemeral, expires within 24h, not a governance record, not anchored.
//      (Honest-limits doctrine applies harder here than anywhere.)
//
//   2. URL REPOINTS. threadViewHTML is authored for the hub's convention
//      (/verify.mjs, /t/<slug>.json, /t/<slug>/view). The sandbox owns only
//      /try/* (apex path-split), so the verify panel's checker import, its
//      records fetch, its links and the header URL are repointed to the
//      /try/ convention — so a stranger's "Verify this thread" button loads
//      THIS Worker's own byte-identical /try/verify.mjs and fetches THIS
//      Worker's /try/<slug>.json (which, unlike the hub, carries the signature
//      sidecar → signatures verified n/n). Each repoint is anchored to a
//      literal threadViewHTML emits and to the random slug (never a bare
//      substring), so user-pasted text can't collide; test/sandbox-view.test.js
//      pins every repoint so a drift in view.js fails loudly.
import { threadViewHTML } from '../../threadhub/src/view.js';

// esc() must match view.js's escaping so the banner copy is consistent.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function bannerHTML(ttlHours) {
  return `<aside class="sandbox-banner" role="note" aria-label="Sandbox disclosure">
<strong>SANDBOX — ephemeral demonstration.</strong>
This thread is a real, signed, hash-chained record you can independently verify below —
but it is <b>not a governance record</b>: it expires and is deleted within ${esc(ttlHours)} hours,
it is <b>never anchored</b>, and it carries none of the production audit chain's guarantees.
Paste something you don't mind the world seeing, then throwing away.
</aside>
<style>
.sandbox-banner{font-family:var(--font-sans);font-size:13px;line-height:1.55;color:var(--dissent-ink);
  background:var(--dissent-wash);border:1px solid var(--dissent-rule);border-left:4px solid var(--dissent);
  border-radius:2px;padding:14px 18px;margin:0 0 1.6rem;max-width:64ch}
.sandbox-banner strong{display:block;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
  font-size:11px;color:var(--dissent);margin-bottom:.4rem}
</style>
`;
}

// Render the sandbox thread page. args are exactly threadViewHTML's:
// { thread, records, verification, authors }. ttlHours drives the banner copy.
export function sandboxViewHTML(args, ttlHours = 24) {
  const slug = args.thread.slug;
  let html = threadViewHTML(args);

  // (1) Banner immediately after <main> opens, before any thread content.
  html = html.replace('<body><main>', '<body><main>' + bannerHTML(ttlHours));

  // (2) Repoints — each anchored to a literal view.js emits (and, for the
  //     record paths, to the unguessable random slug).
  html = html
    .replaceAll("import('/verify.mjs')", "import('/try/verify.mjs')")
    .replaceAll('href="/verify.mjs"', 'href="/try/verify.mjs"')
    .replaceAll("fetch('/t/' + ", "fetch('/try/' + ")
    .replaceAll(`/t/${slug}.json`, `/try/${slug}.json`)
    .replaceAll(`/t/${slug}/view`, `/try/${slug}/view`);

  return html;
}
