// hub.js — the substrate.
//
// A Thread Hub *record* is a signed, hash-chained envelope:
//
//   {
//     hub: "threadhub.record.v0",
//     thread: "thd_...",
//     seq: 4,
//     prev: "sha256:..." | null,        // hash of record seq-1
//     author: "id_troy",
//     author_key: "<hex ed25519 pubkey>",
//     recorded_at: "ISO-8601",
//     kind: "genesis" | "clista.event" | "attestation" | "note",
//     payload: { ... }                   // ClisTa event, attestation, etc.
//   }
//
// record_hash = contentAddress(envelope)         (permanent citation target)
// signature   = ed25519(author_priv, record_hash)
//
// Verification needs nothing but the records themselves: recompute each
// hash from the body, check the chain, check each signature against the
// embedded public key. trusted: false by default — verification of
// structure is never endorsement of content.
'use strict';
const crypto = require('node:crypto');
const { canonicalize, contentAddress } = require('./canonical');
const identity = require('./identity');
const { Store } = require('./store');

const RECORD_SCHEMA = 'threadhub.record.v0';
const MAX_RECORD_BYTES = 256 * 1024; // per-record cap: the body column stays citable, not a blob store

// Errors carry a stable machine code; the HTTP layer maps code -> status.
class HubError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new HubError(code, message); };

function checkRecordSize(body) {
  const bytes = Buffer.byteLength(body, 'utf8');
  if (bytes > MAX_RECORD_BYTES) {
    fail('payload_too_large', `record is ${bytes} bytes; cap is ${MAX_RECORD_BYTES}`);
  }
  return body;
}

function nowISO() { return new Date().toISOString(); }
function rid(prefix) { return `${prefix}_${crypto.randomBytes(6).toString('hex')}`; }
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

class Hub {
  constructor(dbPath) { this.store = new Store(dbPath); }

  // --- identities (custodial keys in v1) ---
  // Pass publicKey to register non-custodially: the hub stores only the
  // public key and the writer signs records client-side (appendSigned).
  createIdentity({ id, displayName, kind, publicKey }) {
    const pair = publicKey ? null : identity.generateKeypair();
    const row = {
      id: id ?? rid('id'),
      displayName, kind,
      publicKey: publicKey ?? pair.publicKeyHex,
      privateKey: pair?.privateKeyPem ?? null,
      createdAt: nowISO(),
    };
    this.store.insertIdentity(row);
    return { id: row.id, displayName, kind, publicKey: row.publicKey, custodial: !publicKey };
  }

  // --- threads ---
  createThread({ title, question, authorId, slug, id }) {
    const author = this.store.getIdentity(authorId);
    if (!author) fail('not_found', `unknown identity: ${authorId}`);
    const thread = {
      id: id ?? rid('thd'),
      slug: slug ?? slugify(title),
      title,
      createdBy: authorId,
      createdAt: nowISO(),
    };
    this.store.insertThread(thread);
    const genesis = this.append({
      threadId: thread.id,
      authorId,
      kind: 'genesis',
      payload: { title, question: question ?? null, created_by: authorId },
    });
    this.store.setGenesis(thread.id, genesis.record_hash);
    return { ...thread, genesisHash: genesis.record_hash };
  }

  // --- the only write path ---
  append({ threadId, authorId, kind, payload, recordedAt }) {
    const thread = this.store.getThread(threadId);
    if (!thread) fail('not_found', `unknown thread: ${threadId}`);
    const author = this.store.getIdentity(authorId);
    if (!author) fail('not_found', `unknown identity: ${authorId}`);
    if (!author.private_key) fail('bad_request', `no custodial key for ${authorId}; submit signed record instead`);

    const head = this.store.headOf(thread.id);
    const envelope = {
      hub: RECORD_SCHEMA,
      thread: thread.id,
      seq: head ? head.seq + 1 : 0,
      prev: head ? head.record_hash : null,
      author: author.id,
      author_key: author.public_key,
      recorded_at: recordedAt ?? nowISO(),
      kind,
      payload,
    };
    const body = checkRecordSize(canonicalize(envelope));
    const record_hash = contentAddress(envelope);
    const signature = identity.sign(record_hash.slice(7), author.private_key);

    this.store.insertRecord({
      recordHash: record_hash,
      threadId: thread.id,
      seq: envelope.seq,
      prevHash: envelope.prev,
      authorId: author.id,
      authorKey: author.public_key,
      kind,
      recordedAt: envelope.recorded_at,
      body,
      signature,
    });
    return { record_hash, seq: envelope.seq, signature, envelope };
  }

  // --- non-custodial write path: client holds the key ---
  // The client builds and signs the full envelope; the hub only checks
  // it before insert. Authority stays with the records: a record the
  // hub could not have forged (it never saw the private key).
  appendSigned({ threadId, envelope, signature }) {
    const thread = this.store.getThread(threadId);
    if (!thread) fail('not_found', `unknown thread: ${threadId}`);
    if (!envelope || typeof envelope !== 'object') fail('bad_request', 'missing envelope');
    if (envelope.hub !== RECORD_SCHEMA) fail('bad_request', `envelope.hub must be ${RECORD_SCHEMA}`);
    if (envelope.thread !== thread.id) fail('bad_request', 'envelope.thread does not match thread');
    if (envelope.kind === 'genesis') fail('bad_request', 'genesis records are created with the thread');

    const author = this.store.getIdentity(envelope.author);
    if (!author) fail('not_found', `unknown identity: ${envelope.author}`);
    if (envelope.author_key !== author.public_key) {
      fail('author_key_mismatch', 'author_key does not match registered key for author');
    }

    const body = checkRecordSize(canonicalize(envelope));
    const record_hash = contentAddress(envelope);
    if (!identity.verify(record_hash.slice(7), signature ?? '', envelope.author_key)) {
      fail('invalid_signature', 'invalid signature');
    }

    // Chain position is checked against the live head; the UNIQUE
    // (thread_id, seq) constraint backstops the read-check-insert race.
    const head = this.store.headOf(thread.id);
    if (envelope.prev !== head.record_hash || envelope.seq !== head.seq + 1) {
      fail('stale_chain', `stale chain position: head is seq ${head.seq} (${head.record_hash})`);
    }

    this.store.insertRecord({
      recordHash: record_hash,
      threadId: thread.id,
      seq: envelope.seq,
      prevHash: envelope.prev,
      authorId: author.id,
      authorKey: envelope.author_key,
      kind: envelope.kind,
      recordedAt: envelope.recorded_at,
      body,
      signature,
    });
    return { record_hash, seq: envelope.seq, signature, envelope };
  }

  // --- ingest a ClisTa NDJSON event log as one thread ---
  ingestClistaEvents({ events, authorId, title, slug }) {
    if (!events.length) fail('bad_request', 'empty event log');
    const threadTitle = title ?? events.find(e => e.event_type === 'ThreadCreated')
      ?.payload?.thread?.title ?? 'Imported ClisTa thread';
    const thread = this.createThread({ title: threadTitle, authorId, slug });
    const appended = [];
    for (const ev of events) {
      appended.push(this.append({
        threadId: thread.id,
        authorId,
        kind: 'clista.event',
        payload: ev,
      }));
    }
    return { thread, records: appended };
  }

  // --- hash-only attestation: prove existence without disclosure ---
  // Notarize an external payload (e.g. a thread on an air-gapped
  // instance) by recording only its content address.
  attest({ threadId, authorId, payloadHash, claim }) {
    if (!/^sha256:[0-9a-f]{64}$/.test(payloadHash)) {
      fail('bad_request', 'payloadHash must be "sha256:<64 hex>"');
    }
    return this.append({
      threadId, authorId,
      kind: 'attestation',
      payload: { payload_hash: payloadHash, claim: claim ?? null, disclosed: false },
    });
  }

  // --- verification: pure function of the records ---
  verifyThread(threadIdOrSlug) {
    const thread = this.store.getThread(threadIdOrSlug);
    if (!thread) fail('not_found', `unknown thread: ${threadIdOrSlug}`);
    const rows = this.store.recordsOf(thread.id);
    const problems = [];
    let prevHash = null;

    rows.forEach((row, i) => {
      let envelope;
      try { envelope = JSON.parse(row.body); }
      catch { problems.push({ seq: row.seq, error: 'unparseable body' }); return; }

      const recomputed = contentAddress(envelope);
      if (recomputed !== row.record_hash) {
        problems.push({ seq: row.seq, error: 'hash mismatch (body altered)',
                        stored: row.record_hash, recomputed });
      }
      if (envelope.seq !== i) {
        problems.push({ seq: row.seq, error: `sequence gap: expected ${i}, got ${envelope.seq}` });
      }
      if (envelope.prev !== prevHash) {
        problems.push({ seq: row.seq, error: 'broken chain (prev does not match prior record)' });
      }
      if (!identity.verify(row.record_hash.slice(7), row.signature, envelope.author_key)) {
        problems.push({ seq: row.seq, error: 'invalid signature' });
      }
      prevHash = row.record_hash;
    });

    return {
      thread: thread.id,
      slug: thread.slug,
      records: rows.length,
      head: prevHash,
      valid: problems.length === 0,
      trusted: false, // structure verified ≠ content endorsed. Always.
      problems,
    };
  }

  exportThread(threadIdOrSlug) {
    const thread = this.store.getThread(threadIdOrSlug);
    if (!thread) fail('not_found', `unknown thread: ${threadIdOrSlug}`);
    return this.store.recordsOf(thread.id).map(r => JSON.parse(r.body));
  }
}

module.exports = { Hub, HubError, RECORD_SCHEMA, MAX_RECORD_BYTES };
