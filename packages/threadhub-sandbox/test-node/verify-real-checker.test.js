// verify-real-checker.test.js (Node environment) — the payoff, proven with the
// REAL, unmodified checker. This mirrors sandbox-do.js `createTry` step for
// step using the SAME libraries (hub.js signing, identity.js ed25519,
// canonical.js hashing), builds the SAME signed export the DO serves at
// /try/<slug>.json (envelope + signature + record_hash sidecar), and runs the
// real verify-standalone.mjs `verifyExport` on it — asserting PASS with
// signatures verified n/n (NOT 0/n). The in-pool e2e test proves the DO
// actually emits that sidecar and serves the byte-identical checker; this test
// proves that checker passes on such an export.
import { it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { verifyExport } from '../../threadhub/scripts/verify-standalone.mjs';

const require = createRequire(import.meta.url);
const { Hub } = require('../../threadhub/src/hub.js');

// A tiny in-memory duck-typed store (Hub accepts any store that quacks like
// store.js). node:sqlite is never constructed — the signing/hashing the
// checker verifies lives entirely in hub.js/identity.js/canonical.js, not the
// store. This is exactly the surface SandboxStore/DOStore expose to Hub.
function memStore() {
  const identities = new Map(), threads = new Map(), records = [];
  return {
    insertIdentity(r) { identities.set(r.id, { ...r, display_name: r.displayName, public_key: r.publicKey, private_key: r.privateKey ?? null, created_at: r.createdAt }); },
    getIdentity(id) { return identities.get(id) ?? null; },
    insertThread(r) { threads.set(r.id, { ...r, created_by: r.createdBy, created_at: r.createdAt, genesis_hash: r.genesisHash ?? null }); },
    getThread(idOrSlug) { return threads.get(idOrSlug) ?? [...threads.values()].find((t) => t.slug === idOrSlug) ?? null; },
    setGenesis(id, h) { threads.get(id).genesis_hash = h; },
    headOf(threadId) { const rs = records.filter((r) => r.thread_id === threadId); return rs.length ? rs[rs.length - 1] : null; },
    insertRecord(r) { records.push({ ...r, record_hash: r.recordHash, thread_id: r.threadId, prev_hash: r.prevHash, author_id: r.authorId, author_key: r.authorKey, recorded_at: r.recordedAt }); },
    recordsOf(threadId) { return records.filter((r) => r.thread_id === threadId).sort((a, b) => a.seq - b.seq); },
  };
}

// The witnessed publication act, identical shape to sandbox-do.js.
function publicationEvent(actorId, threadId) {
  return {
    actor_id: actorId, event_type: 'ThreadPublished',
    payload: { threadPublication: { action: 'publish', id: 'tpb_sandbox000000', object: 'threadPublication', publishedAt: '2026-07-13T00:00:00Z', publishedByParticipantId: actorId, scope: 'public-read', threadId } },
    timestamp: '2026-07-13T00:00:00Z',
  };
}

it('the REAL verify-standalone.mjs returns PASS with signatures verified n/n on the sandbox signed export', async () => {
  const decision = 'Adopt the deployment gate: no release without a green anchor check.';
  const hub = new Hub(memStore());

  // ---- exactly sandbox-do.js createTry ----
  const writer = hub.createIdentity({ displayName: 'sandbox writer', kind: 'agent' });
  const thread = hub.createThread({ title: 'Adopt the deployment gate', question: decision, authorId: writer.id, slug: 'try-abcdef234567' });
  hub.append({ threadId: thread.id, authorId: writer.id, kind: 'clista.event', payload: publicationEvent(writer.id, thread.id) });

  // ---- exactly sandbox-do.js signedExport (envelope + sidecar) ----
  const signed = hub.store.recordsOf(thread.id).map((r) => ({ ...JSON.parse(r.body), record_hash: r.record_hash, signature: r.signature }));
  expect(signed.map((r) => r.seq)).toEqual([0, 1]);
  expect(signed[0].payload.question).toBe(decision);

  // ---- the REAL checker ----
  const result = await verifyExport(signed);
  expect(result.ok).toBe(true);
  expect(result.records).toBe(2);
  expect(result.signaturesPresent).toBe(2);
  expect(result.signaturesVerified).toBe(2); // n/n, not 0/n — the signed-export payoff
  expect(result.line).toContain('signatures verified 2/2');

  // Tamper detection still holds: flip a byte in the genesis body → FAIL.
  const tampered = structuredClone(signed);
  tampered[0].payload.question = decision + ' (edited)';
  const bad = await verifyExport(tampered);
  expect(bad.ok).toBe(false);
});

it('the pinned demo thread (DEMO_DECISION verbatim) also PASSes n/n with the real checker', async () => {
  // Mirrors sandbox-do.js `#ensureDemo` → `#mintPublishedThread`: the demo is
  // created by the exact same create path as a normal /try thread, so its
  // signed export verifies identically. DEMO_DECISION lives as a one-line
  // constant in sandbox-do.js (not importable here — it pulls in
  // 'cloudflare:workers'); kept verbatim in sync by this literal.
  const decision = 'Raise the auto-approval limit for personal loans from $10,000 to $25,000.';
  const hub = new Hub(memStore());
  const writer = hub.createIdentity({ displayName: 'sandbox writer', kind: 'agent' });
  const thread = hub.createThread({ title: decision.slice(0, 80), question: decision, authorId: writer.id, slug: 'demo' });
  hub.append({ threadId: thread.id, authorId: writer.id, kind: 'clista.event', payload: publicationEvent(writer.id, thread.id) });

  const signed = hub.store.recordsOf(thread.id).map((r) => ({ ...JSON.parse(r.body), record_hash: r.record_hash, signature: r.signature }));
  expect(signed.map((r) => r.seq)).toEqual([0, 1]);
  expect(signed[0].payload.question).toBe(decision); // verbatim

  const result = await verifyExport(signed);
  expect(result.ok).toBe(true);
  expect(result.records).toBe(2);
  expect(result.signaturesVerified).toBe(2); // n/n
  expect(result.line).toContain('signatures verified 2/2');
});
