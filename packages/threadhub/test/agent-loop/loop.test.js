// loop.test.js — agent-loop scenarios against a hub running as a real child
// process (see harness.js): concurrency, interruption, SIGKILL durability,
// stale-chain/replay rejection, cross-thread evidence, clock skew.
// Run: node --test test/agent-loop/loop.test.js
// Remote smoke: THREADHUB_URL=https://<hub> node --test test/agent-loop/loop.test.js
//   runs only the non-destructive scenarios (concurrency, cross-thread
//   evidence) scaled down; everything else skips. Never point this at a
//   non-ThreadHub API — the routes are ThreadHub's own.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { startHub } = require('./harness');
const { api, runAgent, registerSignedAuthor, makeSignedWriter, uid } = require('./agent');
const { contentAddress } = require('../../src/canonical');

const REMOTE = process.env.THREADHUB_URL ? process.env.THREADHUB_URL.replace(/\/$/, '') : null;
const localOnly = REMOTE ? 'destructive/local-only; skipped against a remote hub' : false;

// Shared per-run assertions: chain verifies, head is a resolvable permanent
// address, export seq is contiguous, the completion marker is last.
async function assertHealthyRun(baseUrl, run, iterations) {
  const { get } = api(baseUrl);
  assert.strictEqual(run.verify.valid, true);
  assert.strictEqual(run.verify.records, iterations + 2);
  const headRecord = await get(`/r/${run.verify.head}`);
  assert.strictEqual(contentAddress(headRecord), run.verify.head);
  const records = await get(`/t/${run.slug}.json`);
  records.forEach((env, i) => assert.strictEqual(env.seq, i));
  assert.deepStrictEqual(records.at(-1).payload, { loop: 'complete' });
}

test('S0: --rate-limit reaches the child CLI; over-budget writes are 429, reads stay open', { skip: localOnly }, async () => {
  const h = await startHub({ rateLimit: 2 });
  try {
    const { get, post } = api(h.url);
    const { id } = await post('/identities', { display_name: 'budget', kind: 'agent' }); // write 1
    await post('/threads', { title: `budget ${uid()}`, author: id });                    // write 2
    await assert.rejects(
      () => post('/identities', { display_name: 'over', kind: 'agent' }),                // write 3
      (e) => e.status === 429 && e.code === 'rate_limited'
    );
    assert.strictEqual((await get('/')).instance, 'threadhub.v0'); // GET unmetered
  } finally { await h.stop(); }
});

test('S1: concurrent agents — every chain verifies, heads resolve, seq monotonic', async () => {
  const h = REMOTE ? null : await startHub();
  const baseUrl = REMOTE ?? h.url;
  const AGENTS = REMOTE ? 2 : 5;
  const ITERS = REMOTE ? 5 : 20;
  try {
    const runs = await Promise.all(
      [...Array(AGENTS)].map((_, i) => runAgent({ baseUrl, name: `agent-${i}`, iterations: ITERS }))
    );
    for (const run of runs) await assertHealthyRun(baseUrl, run, ITERS);

    // Signed-path contention (local only): two non-custodial writers race on
    // ONE thread. head() and post() are separate round-trips, so unlike the
    // custodial path (which serializes inside the server's event loop) this
    // genuinely contends; append() retries stale_chain until it lands.
    if (!REMOTE) {
      const { post, get } = api(baseUrl);
      const { id: owner } = await post('/identities', { display_name: 'contention-owner', kind: 'agent' });
      const thread = await post('/threads', { title: `contention ${uid()}`, author: owner });
      const writers = await Promise.all(['w1', 'w2'].map(async (n) => {
        const a = await registerSignedAuthor(baseUrl, n);
        return makeSignedWriter({ baseUrl, slug: thread.slug, authorId: a.authorId, keypair: a.keypair });
      }));
      await Promise.all(writers.map((w, wi) => (async () => {
        for (let i = 0; i < 10; i++) {
          await w.append({ payload: { event_type: 'ExecutionStarted', writer: wi, i } }, { retries: 15 });
        }
      })()));
      const verify = await get(`/t/${thread.slug}/verify`);
      assert.strictEqual(verify.valid, true, JSON.stringify(verify.problems));
      assert.strictEqual(verify.records, 21); // genesis + 2×10, no loss under contention
    }
  } finally { if (h) await h.stop(); }
});

test('S2: interrupted run is detectably incomplete and does not poison later runs', { skip: localOnly }, async () => {
  const h = await startHub();
  try {
    const partial = await runAgent({ baseUrl: h.url, name: 'doomed', iterations: 20, abortAfter: 7 });
    assert.strictEqual(partial.aborted, true);
    const { get } = api(h.url);
    const verify = await get(`/t/${partial.slug}/verify`);
    assert.strictEqual(verify.valid, true); // what exists is a valid prefix…
    assert.strictEqual(verify.records, 8); // genesis + 7 events
    const records = await get(`/t/${partial.slug}.json`);
    assert.strictEqual(records.at(-1).kind, 'clista.event'); // …but no completion marker

    const healthy = await runAgent({ baseUrl: h.url, name: 'survivor', iterations: 20 });
    await assertHealthyRun(h.url, healthy, 20);
  } finally { await h.stop(); }
});

test('S3: SIGKILL mid-write — WAL recovery leaves every thread a valid chain prefix', { skip: localOnly }, async () => {
  const h = await startHub();
  try {
    // Fixtures that must survive intact, plus the thread we kill mid-volley.
    const done1 = await runAgent({ baseUrl: h.url, name: 'done-1', iterations: 5 });
    const done2 = await runAgent({ baseUrl: h.url, name: 'done-2', iterations: 5 });
    const { post } = api(h.url);
    const { id: victim } = await post('/identities', { display_name: 'victim', kind: 'agent' });
    const thread = await post('/threads', { title: `victim ${uid()}`, author: victim });

    // 30 fat un-awaited appends; SIGKILL after the 3rd settles — guaranteed
    // mid-volley regardless of machine speed (count-triggered, not timed).
    // Rejections (socket death) are handled EAGERLY so none is ever unhandled,
    // and settlement of the whole volley is NOT required: a SIGKILL'd server
    // can leave undici fetches permanently pending, so we count 201s as they
    // land and give stragglers a bounded window. `confirmed` stays a valid
    // lower bound — only a real 201 response increments it.
    const blob = 'x'.repeat(32 * 1024);
    let settled = 0;
    let confirmed = 0;
    let killAt3;
    const third = new Promise((r) => { killAt3 = r; });
    const bump = () => { if (++settled === 3) killAt3(); };
    const volley = [...Array(30)].map((_, i) =>
      post(`/t/${thread.slug}/records`, { author: victim, kind: 'clista.event', payload: { event_type: 'ExecutionStarted', i, blob } })
        .then(() => { confirmed++; bump(); }, () => bump())
    );
    await third;
    await h.kill('SIGKILL');
    await Promise.race([Promise.all(volley), new Promise((r) => setTimeout(r, 2000))]);

    await h.restart(); // same dbPath: reopening runs SQLite WAL recovery
    const { get } = api(h.url);
    assert.strictEqual((await get('/')).instance, 'threadhub.v0');

    // Whole-store integrity sweep: no corrupt threads anywhere.
    for (const t of await get('/threads')) {
      const v = await get(`/t/${t.slug}/verify`);
      assert.strictEqual(v.valid, true, `${t.slug}: ${JSON.stringify(v.problems)}`);
      assert.deepStrictEqual(v.problems, []);
    }
    for (const run of [done1, done2]) {
      assert.strictEqual((await get(`/t/${run.slug}/verify`)).records, 7); // untouched
    }
    // A 201 means the synchronous insert committed before the response, so the
    // survivor count is bounded below by `confirmed`; a write can also commit
    // after its response socket died, so it may exceed it — never fewer.
    const v = await get(`/t/${thread.slug}/verify`);
    assert.ok(v.records >= 1 + confirmed && v.records <= 1 + 30,
      `victim records ${v.records} outside [${1 + confirmed}, 31]`);
    const records = await get(`/t/${thread.slug}.json`);
    records.forEach((env, i) => assert.strictEqual(env.seq, i)); // contiguous prefix
    assert.strictEqual(contentAddress(await get(`/r/${v.head}`)), v.head);
  } finally { await h.stop(); }
});

test('S4: stale-chain and replay of a signed record are rejected with 409', { skip: localOnly }, async () => {
  const h = await startHub();
  try {
    const { post } = api(h.url);
    const { id: owner } = await post('/identities', { display_name: 'replay-owner', kind: 'agent' });
    const thread = await post('/threads', { title: `replay ${uid()}`, author: owner });
    const a = await registerSignedAuthor(h.url, 'replayer');
    const writer = makeSignedWriter({ baseUrl: h.url, slug: thread.slug, authorId: a.authorId, keypair: a.keypair });

    const head0 = await writer.head();
    const accepted = writer.buildEnvelope({ payload: { event_type: 'ExecutionStarted', n: 1 } }, head0);
    const acceptedSig = writer.sign(accepted);
    await writer.post(accepted, acceptedSig); // advances the chain

    // (a) A NEW envelope built against the now-stale head → 409 stale_chain.
    const stale = writer.buildEnvelope({ payload: { event_type: 'ExecutionStarted', n: 2 } }, head0);
    await assert.rejects(() => writer.post(stale, writer.sign(stale)),
      (e) => e.status === 409 && e.code === 'stale_chain');

    // (b) Replaying the exact accepted record → 409 (its prev no longer matches head).
    await assert.rejects(() => writer.post(accepted, acceptedSig),
      (e) => e.status === 409 && e.code === 'stale_chain');
  } finally { await h.stop(); }
});

test('S5: cross-thread evidence — a parent record cites the arm head and the address resolves', async () => {
  const h = REMOTE ? null : await startHub();
  const baseUrl = REMOTE ?? h.url;
  try {
    const arm = await runAgent({ baseUrl, name: 'arm', iterations: REMOTE ? 3 : 5 });
    const { get, post } = api(baseUrl);
    const { id: parentAuthor } = await post('/identities', { display_name: 'parent', kind: 'agent' });
    const parent = await post('/threads', { title: `parent ${uid()}`, author: parentAuthor });
    await post(`/t/${parent.slug}/records`, {
      author: parentAuthor, kind: 'clista.event',
      payload: { event_type: 'CrossThreadEvidence', evidence: { record_hash: arm.verify.head, thread: arm.threadId } },
    });
    // The citation resolves: permanent address → the arm's actual head record.
    const cited = await get(`/r/${arm.verify.head}`);
    assert.strictEqual(cited.thread, arm.threadId);
    assert.strictEqual(cited.seq, arm.verify.records - 1);
    assert.strictEqual(contentAddress(cited), arm.verify.head);
    assert.strictEqual((await get(`/t/${parent.slug}/verify`)).valid, true);
  } finally { if (h) await h.stop(); }
});

test('S6: clock skew — skewed recorded_at is accepted; order authority is seq, not time', { skip: localOnly }, async () => {
  const h = await startHub();
  try {
    const { get, post } = api(h.url);
    const { id: owner } = await post('/identities', { display_name: 'skew-owner', kind: 'agent' });
    const thread = await post('/threads', { title: `skew ${uid()}`, author: owner });
    const a = await registerSignedAuthor(h.url, 'skewer');
    const writer = makeSignedWriter({ baseUrl: h.url, slug: thread.slug, authorId: a.authorId, keypair: a.keypair });

    // Documented actual behavior: appendSigned (src/hub.js) stores the
    // client-supplied recorded_at VERBATIM and performs no clock-skew
    // validation; position authority is seq/prev, never wall-clock. A
    // far-past or far-future timestamp is accepted by design — consumers
    // must order by seq.
    const past = await writer.append({ payload: { event_type: 'ExecutionStarted' }, recordedAt: '1970-01-01T00:00:00.000Z' });
    const future = await writer.append({ payload: { event_type: 'ExecutionCompleted' }, recordedAt: '2099-12-31T23:59:59.000Z' });
    assert.strictEqual(past.seq, 1);
    assert.strictEqual(future.seq, 2);

    const verify = await get(`/t/${thread.slug}/verify`);
    assert.strictEqual(verify.valid, true, JSON.stringify(verify.problems));
    const records = await get(`/t/${thread.slug}.json`);
    assert.strictEqual(records[1].recorded_at, '1970-01-01T00:00:00.000Z');
    assert.strictEqual(records[2].recorded_at, '2099-12-31T23:59:59.000Z');
    records.forEach((env, i) => assert.strictEqual(env.seq, i)); // seq order, not time order
  } finally { await h.stop(); }
});
