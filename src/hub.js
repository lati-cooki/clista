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

function nowISO() { return new Date().toISOString(); }
function rid(prefix) { return `${prefix}_${crypto.randomBytes(6).toString('hex')}`; }
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

class Hub {
  constructor(dbPath) { this.store = new Store(dbPath); }

  // --- identities (custodial keys in v1) ---
  createIdentity({ id, displayName, kind }) {
    const { publicKeyHex, privateKeyPem } = identity.generateKeypair();
    const row = {
      id: id ?? rid('id'),
      displayName, kind,
      publicKey: publicKeyHex,
      privateKey: privateKeyPem,
      createdAt: nowISO(),
    };
    this.store.insertIdentity(row);
    return { id: row.id, displayName, kind, publicKey: publicKeyHex };
  }

  // --- threads ---
  createThread({ title, question, authorId, slug, id }) {
    const author = this.store.getIdentity(authorId);
    if (!author) throw new Error(`unknown identity: ${authorId}`);
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
    if (!thread) throw new Error(`unknown thread: ${threadId}`);
    const author = this.store.getIdentity(authorId);
    if (!author) throw new Error(`unknown identity: ${authorId}`);
    if (!author.private_key) throw new Error(`no custodial key for ${authorId}; submit signed record instead`);

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
      body: canonicalize(envelope),
      signature,
    });
    return { record_hash, seq: envelope.seq, signature, envelope };
  }

  // --- ingest a ClisTa NDJSON event log as one thread ---
  ingestClistaEvents({ events, authorId, title, slug }) {
    if (!events.length) throw new Error('empty event log');
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
      throw new Error('payloadHash must be "sha256:<64 hex>"');
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
    if (!thread) throw new Error(`unknown thread: ${threadIdOrSlug}`);
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
    if (!thread) throw new Error(`unknown thread: ${threadIdOrSlug}`);
    return this.store.recordsOf(thread.id).map(r => JSON.parse(r.body));
  }
}

module.exports = { Hub, RECORD_SCHEMA };
