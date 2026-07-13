// landing.test.js — content negotiation on GET / through the Worker + DO.
//
// The Accept header is the ONE client header the front door threads across
// the RPC boundary (as a scalar). GET / uses it: a browser (Accept:
// text/html) gets the spare HTML landing page; every API client (curl,
// urllib, the anchor gate — */* or no Accept, never text/html) keeps the
// EXACT JSON instance summary. Publication filtering still applies to the
// HTML: the public role never sees an unpublished thread on the landing.
import { it, expect } from 'vitest';
import { opPost, pubGet, seedThread, publicationEvent } from './helpers.js';
import { BASE } from './helpers.js';
import { SELF } from 'cloudflare:test';

const HTML_TYPE = 'text/html; charset=utf-8';
const JSON_TYPE = 'application/json; charset=utf-8';

const browserGet = (path) => SELF.fetch(BASE + path, { headers: { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });

it('GET / with Accept: text/html → HTML landing; */* → JSON; publication filtering holds', async () => {
  const { ident, thread } = await seedThread({ title: 'Ship the beta?' });
  // A second thread that is never published — it must not reach the landing.
  const shadow = await (await opPost('/threads', { title: 'Never published', author: ident.id })).json();

  // Publish only the first thread.
  const pub = await opPost(`/t/${thread.slug}/records`, {
    author: ident.id, kind: 'clista.event',
    payload: publicationEvent(ident.id, thread.id, 'publish'),
  });
  expect(pub.status).toBe(201);

  // --- browser: HTML landing ---
  const browser = await browserGet('/');
  expect(browser.status).toBe(200);
  expect(browser.headers.get('content-type')).toBe(HTML_TYPE);
  const html = await browser.text();
  expect(html).toMatch(/<!doctype html>/i);
  expect(html).toContain(`href="/t/${thread.slug}/view"`);
  expect(html).toContain('Ship the beta?');
  expect(html).toMatch(/verifies on your machine/);
  expect(html).toMatch(/never that the decision was good/);
  // The unpublished thread never appears.
  expect(html).not.toContain(`href="/t/${shadow.slug}/view"`);
  expect(html).not.toContain('Never published');

  // --- API client: EXACT JSON, unchanged ---
  const api = await pubGet('/'); // pubGet sends no explicit Accept (defaults to */*)
  expect(api.status).toBe(200);
  expect(api.headers.get('content-type')).toBe(JSON_TYPE);
  const summary = await api.json();
  expect(summary.instance).toBe('threadhub.v0');
  expect(summary.threads.map((t) => t.id)).toEqual([thread.id]); // published only
  expect(summary.records).toBe(2); // genesis + publish act

  // An explicit */* is JSON too (curl / anchor-gate shape).
  const star = await SELF.fetch(BASE + '/', { headers: { accept: '*/*' } });
  expect(star.headers.get('content-type')).toBe(JSON_TYPE);
  expect(await star.json()).toEqual(summary);
});
