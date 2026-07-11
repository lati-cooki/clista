// store.js — append-only record store on node:sqlite.
// Immutability is enforced at the database layer with triggers:
// UPDATE or DELETE on records raises an error. Append-only is a
// property of the store, not a convention of the calling code.
'use strict';
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS identities (
  id            TEXT PRIMARY KEY,            -- e.g. "id_troy"
  display_name  TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('human','agent','org')),
  public_key    TEXT NOT NULL UNIQUE,        -- hex, raw ed25519
  private_key   TEXT,                        -- PEM; NULL for non-custodial
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS threads (
  id            TEXT PRIMARY KEY,            -- e.g. "thd_..."
  slug          TEXT NOT NULL UNIQUE,        -- human URI segment
  title         TEXT NOT NULL,
  created_by    TEXT NOT NULL REFERENCES identities(id),
  created_at    TEXT NOT NULL,
  genesis_hash  TEXT                          -- hash of record seq 0
);

CREATE TABLE IF NOT EXISTS records (
  record_hash   TEXT PRIMARY KEY,            -- "sha256:..." content address
  thread_id     TEXT NOT NULL REFERENCES threads(id),
  seq           INTEGER NOT NULL,
  prev_hash     TEXT,                        -- NULL only at seq 0
  author_id     TEXT NOT NULL REFERENCES identities(id),
  author_key    TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('genesis','clista.event','attestation','note')),
  recorded_at   TEXT NOT NULL,
  body          TEXT NOT NULL,               -- canonical JSON of the full record
  signature     TEXT NOT NULL,               -- ed25519 over record_hash hex
  UNIQUE (thread_id, seq)
);

CREATE TRIGGER IF NOT EXISTS records_no_update
BEFORE UPDATE ON records BEGIN
  SELECT RAISE(ABORT, 'records are append-only');
END;

CREATE TRIGGER IF NOT EXISTS records_no_delete
BEFORE DELETE ON records BEGIN
  SELECT RAISE(ABORT, 'records are append-only');
END;

CREATE INDEX IF NOT EXISTS idx_records_thread ON records(thread_id, seq);
`;

class Store {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(SCHEMA);
  }

  // --- identities ---
  insertIdentity(row) {
    this.db.prepare(
      `INSERT INTO identities (id, display_name, kind, public_key, private_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(row.id, row.displayName, row.kind, row.publicKey, row.privateKey ?? null, row.createdAt);
  }
  getIdentity(id) {
    return this.db.prepare('SELECT * FROM identities WHERE id = ?').get(id) ?? null;
  }
  listIdentities() {
    return this.db.prepare(
      'SELECT id, display_name, kind, public_key, created_at FROM identities ORDER BY created_at'
    ).all();
  }

  // --- threads ---
  insertThread(row) {
    this.db.prepare(
      `INSERT INTO threads (id, slug, title, created_by, created_at, genesis_hash)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(row.id, row.slug, row.title, row.createdBy, row.createdAt, row.genesisHash ?? null);
  }
  setGenesis(threadId, hash) {
    this.db.prepare('UPDATE threads SET genesis_hash = ? WHERE id = ?').run(hash, threadId);
  }
  getThread(idOrSlug) {
    return this.db.prepare('SELECT * FROM threads WHERE id = ? OR slug = ?')
      .get(idOrSlug, idOrSlug) ?? null;
  }
  listThreads() {
    return this.db.prepare('SELECT * FROM threads ORDER BY created_at').all();
  }

  // --- records ---
  insertRecord(row) {
    this.db.prepare(
      `INSERT INTO records (record_hash, thread_id, seq, prev_hash, author_id, author_key,
                            kind, recorded_at, body, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(row.recordHash, row.threadId, row.seq, row.prevHash, row.authorId,
          row.authorKey, row.kind, row.recordedAt, row.body, row.signature);
  }
  headOf(threadId) {
    return this.db.prepare(
      'SELECT * FROM records WHERE thread_id = ? ORDER BY seq DESC LIMIT 1'
    ).get(threadId) ?? null;
  }
  recordsOf(threadId) {
    return this.db.prepare(
      'SELECT * FROM records WHERE thread_id = ? ORDER BY seq'
    ).all(threadId);
  }
  getRecord(hash) {
    return this.db.prepare('SELECT * FROM records WHERE record_hash = ?').get(hash) ?? null;
  }
  countRecords() {
    return this.db.prepare('SELECT COUNT(*) AS n FROM records').get().n;
  }
}

module.exports = { Store };
