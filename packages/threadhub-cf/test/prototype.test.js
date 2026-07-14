// prototype.test.js — GET /prototype serves the self-contained connected
// prototype (React + DS bundle + tokens all inlined) verbatim from the
// Text-imported repo file, before the DO hop. Public read; no auth.
import { it, expect } from 'vitest';
import { pubGet, BASE } from './helpers.js';
import { SELF } from 'cloudflare:test';

const HTML_TYPE = 'text/html; charset=utf-8';

it('GET /prototype → 200 self-contained HTML app, no external hosts, public', async () => {
  const res = await pubGet('/prototype');
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe(HTML_TYPE);
  const html = await res.text();
  expect(html).toMatch(/<!doctype html>/i);
  expect(html).toContain('Consensus Protocol — connected prototype');
  expect(html).toContain('<div id="root"></div>');
  // The app + its runtime are inlined. The ONLY permitted external host is the
  // Cloudflare Turnstile script (Phase 4 — the Genesis seal's bot-protection
  // widget, hostname-locked to consensusprotocol.ai; graceful-degrades to the
  // mockup seal everywhere else). Assert exactly one external <script src> and
  // that it is the documented Turnstile host — nothing else may reference a CDN.
  expect(html).toContain('window.ConsensusApp');
  expect(html).toContain('ConsensusProtocolDesignSystem_0d2492');
  const externalSrcs = html.match(/src="https?:\/\/[^"]+"/g) || [];
  expect(externalSrcs).toEqual(['src="https://challenges.cloudflare.com/turnstile/v0/api.js"']);
  expect(html).not.toMatch(/@import url\(['"]?https?:/);
  // Trailing-slash alias serves the same bytes.
  const slash = await pubGet('/prototype/');
  expect(slash.status).toBe(200);
  expect(await slash.text()).toBe(html);
});

it('POST /prototype is a write shape → walled to the public 404 (not the page)', async () => {
  const res = await SELF.fetch(BASE + '/prototype', { method: 'POST', headers: { 'cf-connecting-ip': '203.0.113.9' }, body: '{}' });
  expect(res.status).toBe(404);
  expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
});
