// landing.test.js — content negotiation on GET / through the Worker.
//
// The apex is the site's front door: a browser (Accept: text/html) gets the
// connected prototype, served at the Worker front door before the DO hop.
// Every API client (curl, urllib, the anchor gate — */* or no Accept, never
// text/html) still falls through to the DO and keeps the EXACT JSON instance
// summary, byte-for-byte, publication-filtered — so the operator plane,
// anchor gate, and export are untouched.
import { it, expect } from 'vitest';
import { opPost, pubGet, seedThread, publicationEvent } from './helpers.js';
import { BASE } from './helpers.js';
import { SELF } from 'cloudflare:test';

const HTML_TYPE = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json; charset=utf-8';

const browserGet = (path) => SELF.fetch(BASE + path, { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });

it('GET / — browser → the prototype front door; */* → EXACT JSON, publication-filtered', async () => {
  const { ident, thread } = await seedThread({ title: 'Ship the beta?' });
  // A second thread that is never published — it must not reach the JSON.
  const shadow = await (await opPost('/threads', { title: 'Never published', author: ident.id })).json();

  // Publish only the first thread.
  const pub = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'publish'),
  });
  expect(pub.status).toBe(201);

  // --- browser: the connected prototype (the first look) ---
  const browser = await browserGet('/');
  expect(browser.status).toBe(200);
  expect(browser.headers.get('content-type')).toBe(HTML_TYPE);
  const html = await browser.text();
  expect(html).toMatch(/<!doctype html>/i);
  expect(html).toContain('Consensus Protocol — connected prototype');
  expect(html).toContain('window.ConsensusApp');
  // The apex front door is the SAME bytes as /prototype.
  const proto = await pubGet('/prototype');
  expect(await proto.text()).toBe(html);
  // No external hosts (CSP-safe, self-contained).
  expect(html).not.toMatch(/src="https?:\/\//);

  // --- API client: EXACT JSON, unchanged (operator plane / anchor gate) ---
  const api = await pubGet('/'); // pubGet sends no explicit Accept (defaults to */*)
  expect(api.status).toBe(200);
  expect(api.headers.get('content-type')).toBe(JSON_TYPE);
  const summary = await api.json();
  expect(summary.instance).toBe('threadhub.v0');
  expect(summary.threads.map((t) => t.id)).toEqual([thread.id]); // published only
  expect(summary.threads.map((t) => t.slug)).not.toContain(shadow.slug);
  expect(summary.records).toBe(2); // genesis + publish act

  // An explicit */* is JSON too (curl / anchor-gate shape).
  const star = await SELF.fetch(BASE + '/', { headers: { accept: '*/*' } });
  expect(star.headers.get('content-type')).toBe(JSON_TYPE);
  expect(await star.json()).toEqual(summary);
});
