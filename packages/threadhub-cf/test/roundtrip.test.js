// roundtrip.test.js — full write→read→verify round trip through the Worker
// with operator auth: custodial and non-custodial identities, thread
// creation, plain append, client-signed append (including the stale_chain
// conflict and a bad signature), attestation, then chain verification.
//
// canonical.js and identity.js are imported UNCHANGED from the Node package
// — the test signs exactly the way a real non-custodial client would, so a
// green run proves hash/signature parity between the client and the DO.
import { it, expect } from 'vitest';
import { contentAddress } from '../../threadhub/src/canonical.js';
import { generateKeypair, sign } from '../../threadhub/src/identity.js';
import { opPost, opGet } from './helpers.js';

it('operator round trip: identity → thread → append → appendSigned → attest → verify', async () => {
  // Custodial identity (hub holds the key).
  const troyRes = await opPost('/identities', { display_name: 'Troy', kind: 'human' });
  expect(troyRes.status).toBe(201);
  const troy = await troyRes.json();
  expect(troy.custodial).toBe(true);

  // Non-custodial identity (client holds the key; hub sees only the pubkey).
  const pair = generateKeypair();
  const scribeRes = await opPost('/identities', {
    display_name: 'Scribe', kind: 'agent', public_key: pair.publicKeyHex,
  });
  expect(scribeRes.status).toBe(201);
  const scribe = await scribeRes.json();
  expect(scribe.custodial).toBe(false);

  // Thread (genesis is record 0).
  const threadRes = await opPost('/threads', {
    title: 'Port the hub to Cloudflare', question: 'Same bytes, new substrate?', author: troy.id,
  });
  expect(threadRes.status).toBe(201);
  const thread = await threadRes.json();
  expect(thread.genesisHash).toMatch(/^sha256:[0-9a-f]{64}$/);

  // Custodial append (hub signs).
  const noteRes = await opPost(`/t/${thread.slug}/records`, {
    author: troy.id, kind: 'note', payload: { text: 'workerd, one DO, same record' },
  });
  expect(noteRes.status).toBe(201);
  expect((await noteRes.json()).seq).toBe(1);

  // Client-signed append: build the envelope against the live head, hash
  // and sign it client-side, submit envelope+signature.
  let verify = await (await opGet(`/t/${thread.slug}/verify`)).json();
  const envelope = {
    hub: 'threadhub.record.v0',
    thread: thread.id,
    seq: verify.records,
    prev: verify.head,
    author: scribe.id,
    author_key: pair.publicKeyHex,
    recorded_at: new Date().toISOString(),
    kind: 'note',
    payload: { text: 'signed where the key lives, not where the hub lives' },
  };
  const recordHash = contentAddress(envelope);
  const signature = sign(recordHash.slice('sha256:'.length), pair.privateKeyPem);

  // A bad signature is rejected before anything lands.
  const badSig = await opPost(`/t/${thread.slug}/records/signed`, {
    envelope, signature: signature.replace(/^../, signature.startsWith('00') ? '11' : '00'),
  });
  expect(badSig.status).toBe(400);
  expect((await badSig.json()).code).toBe('invalid_signature');

  const signedRes = await opPost(`/t/${thread.slug}/records/signed`, { envelope, signature });
  expect(signedRes.status).toBe(201);
  const signed = await signedRes.json();
  expect(signed.record_hash).toBe(recordHash);
  expect(signed.seq).toBe(2);

  // Replaying the same envelope is a stale chain position: 409.
  const replay = await opPost(`/t/${thread.slug}/records/signed`, { envelope, signature });
  expect(replay.status).toBe(409);
  expect((await replay.json()).code).toBe('stale_chain');

  // Hash-only attestation.
  const attestRes = await opPost(`/t/${thread.slug}/attest`, {
    author: troy.id, payload_hash: `sha256:${'ab'.repeat(32)}`, claim: 'external artifact existed',
  });
  expect(attestRes.status).toBe(201);
  expect((await attestRes.json()).seq).toBe(3);

  // The chain verifies: 4 records, structure valid, trusted never true.
  verify = await (await opGet(`/t/${thread.slug}/verify`)).json();
  expect(verify).toMatchObject({ records: 4, valid: true, trusted: false, problems: [] });
  expect(verify.head).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(verify.head).not.toBe(recordHash); // head moved on: it is the attestation now

  // Export surfaces every envelope in witnessed order; the record fetched
  // by content address is the record that was written.
  const exported = await (await opGet(`/t/${thread.slug}.json`)).json();
  expect(exported.map((e) => e.seq)).toEqual([0, 1, 2, 3]);
  expect(exported[0].kind).toBe('genesis');
  expect(exported[3].kind).toBe('attestation');

  const byHash = await (await opGet(`/r/${recordHash}`)).json();
  expect(byHash).toEqual(envelope);
});
