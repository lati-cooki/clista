// agent.js — a scripted agent run against a hub over HTTP: register identity,
// open a thread, append a workload of clista.event records, close with a
// marker note (the "run complete" stand-in — the hub has no seal concept),
// verify the chain. Plus a signed (non-custodial) writer with stale-chain
// retry for contention tests.
'use strict';
const assert = require('node:assert');
const { canonicalize, contentAddress } = require('../../src/canonical');
const identity = require('../../src/identity');

function api(baseUrl) {
  const call = async (method, path, body) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(`${method} ${path} → ${res.status} ${data.code || data.error || ''}`),
        { status: res.status, code: data.code });
    }
    return data;
  };
  return { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b) };
}

// Unique suffix for titles: slugs are server-derived from titles and UNIQUE,
// so every run (incl. against a long-lived remote) needs fresh titles.
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Full agent loop. abortAfter stops mid-workload (interruption tests); an
// aborted run returns what it managed without the marker or verification.
async function runAgent({ baseUrl, name, iterations = 20, abortAfter = Infinity,
                          eventTypes = ['DelegationGranted', 'ExecutionStarted', 'ExecutionCompleted'] }) {
  const { get, post } = api(baseUrl);
  const { id: authorId } = await post('/identities', { display_name: name, kind: 'agent' });
  const thread = await post('/threads', { title: `${name} loop ${uid()}`, author: authorId });
  const hashes = [thread.genesisHash];

  for (let i = 0; i < iterations; i++) {
    if (i >= abortAfter) {
      return { authorId, threadId: thread.id, slug: thread.slug, hashes, aborted: true };
    }
    const r = await post(`/t/${thread.slug}/records`, {
      author: authorId, kind: 'clista.event',
      payload: { event_type: eventTypes[i % eventTypes.length], step: i, agent: name },
    });
    assert.strictEqual(r.seq, i + 1, `seq monotonic (genesis is 0)`);
    hashes.push(r.record_hash);
  }

  const marker = await post(`/t/${thread.slug}/records`, { author: authorId, kind: 'note', payload: { loop: 'complete' } });
  hashes.push(marker.record_hash);

  const verify = await get(`/t/${thread.slug}/verify`);
  assert.strictEqual(verify.valid, true, JSON.stringify(verify.problems));
  assert.strictEqual(verify.records, iterations + 2); // genesis + workload + marker
  assert.ok(verify.head);
  return { authorId, threadId: thread.id, slug: thread.slug, hashes, aborted: false, verify };
}

// Non-custodial author: local keypair, hub stores only the public key.
async function registerSignedAuthor(baseUrl, name) {
  const keypair = identity.generateKeypair();
  const { id: authorId } = await api(baseUrl).post('/identities', {
    display_name: name, kind: 'agent', public_key: keypair.publicKeyHex,
  });
  return { authorId, keypair };
}

// Signed-path writer. head() and post() are separate round-trips, so two
// writers on one thread genuinely race — append() retries on 409 stale_chain.
function makeSignedWriter({ baseUrl, slug, authorId, keypair }) {
  const { get } = api(baseUrl);
  const head = () => get(`/t/${slug}/verify`); // { thread, records, head, ... }

  const buildEnvelope = ({ kind = 'clista.event', payload, recordedAt }, h) => ({
    hub: 'threadhub.record.v0',
    thread: h.thread,
    seq: h.records,
    prev: h.head,
    author: authorId,
    author_key: keypair.publicKeyHex,
    recorded_at: recordedAt ?? new Date().toISOString(),
    kind,
    payload,
  });
  const sign = (envelope) => identity.sign(contentAddress(envelope).slice(7), keypair.privateKeyPem);
  const post = async (envelope, signature) => {
    const res = await fetch(`${baseUrl}/t/${slug}/records/signed`, {
      method: 'POST', body: canonicalize({ envelope, signature }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(`signed post → ${res.status} ${data.code || ''}`),
      { status: res.status, code: data.code });
    return data;
  };

  const append = async ({ kind, payload, recordedAt }, { retries = 0 } = {}) => {
    let staleRetries = 0;
    for (;;) {
      const envelope = buildEnvelope({ kind, payload, recordedAt }, await head());
      try {
        const r = await post(envelope, sign(envelope));
        return { ...r, staleRetries };
      } catch (e) {
        if (e.code === 'stale_chain' && staleRetries < retries) { staleRetries++; continue; }
        throw e;
      }
    }
  };

  return { head, buildEnvelope, sign, post, append };
}

module.exports = { api, uid, runAgent, registerSignedAuthor, makeSignedWriter };
