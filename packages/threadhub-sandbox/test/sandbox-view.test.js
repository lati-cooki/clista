// sandbox-view.test.js — the sandbox viewer's two adaptations of the reused
// threadViewHTML: the disclosure banner, and the URL repoints from the hub's
// convention (/verify.mjs, /t/<slug>...) to the sandbox's /try/ convention.
// These pins fail loudly if view.js drifts such that a repoint no-ops.
import { it, expect } from 'vitest';
import { sandboxViewHTML } from '../src/sandbox-view.js';

// Minimal args in the shape threadViewHTML expects. We don't need a real chain
// here — only the surrounding page scaffolding (URL line, verify panel).
function fixture() {
  const slug = 'try-abcdef234567';
  const thread = { id: 'thd_test', slug, title: 'A sandbox decision', genesis_hash: 'sha256:' + '0'.repeat(64) };
  const records = [];
  const verification = { valid: true, records: 0, head: 'sha256:' + '1'.repeat(64), problems: [] };
  const authors = [];
  return { slug, args: { thread, records, verification, authors } };
}

it('renders the unmissable sandbox disclosure banner with the TTL', () => {
  const { args } = fixture();
  const html = sandboxViewHTML(args, 24);
  expect(html).toContain('SANDBOX — ephemeral demonstration');
  expect(html).toContain('not a governance record');
  expect(html).toContain('never anchored');
  expect(html).toContain('expires and is deleted within 24 hours');
});

it('the pinned variant drops the 24h-expiry line but keeps every other honest limit', () => {
  const { args } = fixture();
  const html = sandboxViewHTML(args, 24, true); // pinned = true
  // Kept: the record is real/verifiable, not governance, never anchored, persistent.
  expect(html).toContain('a real, signed, hash-chained record you can verify below');
  expect(html).toContain('not a governance record');
  expect(html).toContain('never anchored');
  expect(html).toContain('persistent demonstration');
  // Dropped: the ephemeral-expiry line (the whole point of pinning).
  expect(html).not.toContain('expires and is deleted within');
  expect(html).not.toContain('SANDBOX — ephemeral demonstration');
});

it('repoints the checker import + link, the records fetch + link, and the header URL to /try/', () => {
  const { slug, args } = fixture();
  const html = sandboxViewHTML(args, 24);

  // Checker → the sandbox's own byte-identical copy.
  expect(html).toContain("import('/try/verify.mjs')");
  expect(html).toContain('href="/try/verify.mjs"');
  // Records → the sandbox's signed export.
  expect(html).toContain(`/try/${slug}.json`);
  // Header URL → the sandbox view path.
  expect(html).toContain(`/try/${slug}/view`);

  // And crucially, NO stray root-level hub paths remain (which would 404 /
  // hit hub-prod in production).
  expect(html).not.toContain("import('/verify.mjs')");
  expect(html).not.toContain('href="/verify.mjs"');
  expect(html).not.toContain(`href="/t/${slug}.json"`);
  expect(html).not.toContain(`/t/${slug}/view`);
  expect(html).not.toContain("fetch('/t/' + ");
});
