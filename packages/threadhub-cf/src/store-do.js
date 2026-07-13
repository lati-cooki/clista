// store-do.js — the Store contract (packages/threadhub/src/store.js) over a
// Durable Object's SQLite storage (ctx.storage.sql).
//
// Same schema, same row shapes, same error semantics: UNIQUE/FK violations
// surface as throws, and the append-only triggers make immutability a
// property of the database, not a convention of the calling code (the
// phase-0 spike proved RAISE(ABORT) triggers fire in DO SQLite). The WAL
// pragma from store.js is omitted — journal mode is meaningless in DO
// storage — and PRAGMA foreign_keys is skipped because DO SQLite enforces
// foreign keys by default (also spike-proven).
//
// SCHEMA below is copied VERBATIM from store.js (which does not export it);
// test/store-contract.test.js asserts byte equality against the source so
// the copy cannot drift.

export const SCHEMA = `
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

export class DOStore {
  constructor(sql) {
    this.sql = sql;
    this.sql.exec(SCHEMA);
  }

  #one(query, ...args) {
    return this.sql.exec(query, ...args).toArray()[0] ?? null;
  }

  // --- identities ---
  insertIdentity(row) {
    this.sql.exec(
      `INSERT INTO identities (id, display_name, kind, public_key, private_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      row.id, row.displayName, row.kind, row.publicKey, row.privateKey ?? null, row.createdAt
    );
  }
  getIdentity(id) {
    return this.#one('SELECT * FROM identities WHERE id = ?', id);
  }
  listIdentities() {
    return this.sql.exec(
      'SELECT id, display_name, kind, public_key, created_at FROM identities ORDER BY created_at'
    ).toArray();
  }

  // --- threads ---
  insertThread(row) {
    this.sql.exec(
      `INSERT INTO threads (id, slug, title, created_by, created_at, genesis_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      row.id, row.slug, row.title, row.createdBy, row.createdAt, row.genesisHash ?? null
    );
  }
  setGenesis(threadId, hash) {
    this.sql.exec('UPDATE threads SET genesis_hash = ? WHERE id = ?', hash, threadId);
  }
  getThread(idOrSlug) {
    return this.#one('SELECT * FROM threads WHERE id = ? OR slug = ?', idOrSlug, idOrSlug);
  }
  listThreads() {
    return this.sql.exec('SELECT * FROM threads ORDER BY created_at').toArray();
  }

  // --- records ---
  insertRecord(row) {
    this.sql.exec(
      `INSERT INTO records (record_hash, thread_id, seq, prev_hash, author_id, author_key,
                            kind, recorded_at, body, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.recordHash, row.threadId, row.seq, row.prevHash, row.authorId,
      row.authorKey, row.kind, row.recordedAt, row.body, row.signature
    );
  }
  headOf(threadId) {
    return this.#one(
      'SELECT * FROM records WHERE thread_id = ? ORDER BY seq DESC LIMIT 1', threadId
    );
  }
  recordsOf(threadId) {
    return this.sql.exec(
      'SELECT * FROM records WHERE thread_id = ? ORDER BY seq', threadId
    ).toArray();
  }
  getRecord(hash) {
    return this.#one('SELECT * FROM records WHERE record_hash = ?', hash);
  }
  countRecords() {
    return this.sql.exec('SELECT COUNT(*) AS n FROM records').one().n;
  }

  // --- admin extensions (not part of the Store contract) ---
  // Verbatim row import: snake_case rows exactly as exported from a hub.db
  // (scripts/export-hubdb.mjs) or from /admin/export. body, record_hash,
  // signature, timestamps land untouched — NEVER recomputed, NEVER
  // re-canonicalized: the whole point of the record format is that the
  // bytes are the authority. Idempotent: a row whose primary key already
  // exists is skipped and counted.
  importRows({ identities = [], threads = [], records = [] } = {}) {
    const imported = { identities: 0, threads: 0, records: 0 };
    const skipped = { identities: 0, threads: 0, records: 0 };
    for (const r of identities) {
      if (this.#one('SELECT 1 AS x FROM identities WHERE id = ?', r.id)) { skipped.identities++; continue; }
      this.sql.exec(
        `INSERT INTO identities (id, display_name, kind, public_key, private_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        r.id, r.display_name, r.kind, r.public_key, r.private_key ?? null, r.created_at
      );
      imported.identities++;
    }
    for (const r of threads) {
      if (this.#one('SELECT 1 AS x FROM threads WHERE id = ?', r.id)) { skipped.threads++; continue; }
      this.sql.exec(
        `INSERT INTO threads (id, slug, title, created_by, created_at, genesis_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
        r.id, r.slug, r.title, r.created_by, r.created_at, r.genesis_hash ?? null
      );
      imported.threads++;
    }
    // Records go in (thread_id, seq) order so every prev_hash's row precedes
    // it and partial imports still leave each thread a valid prefix.
    const ordered = [...records].sort((a, b) =>
      a.thread_id < b.thread_id ? -1 : a.thread_id > b.thread_id ? 1 : a.seq - b.seq);
    for (const r of ordered) {
      if (this.#one('SELECT 1 AS x FROM records WHERE record_hash = ?', r.record_hash)) { skipped.records++; continue; }
      this.sql.exec(
        `INSERT INTO records (record_hash, thread_id, seq, prev_hash, author_id, author_key,
                              kind, recorded_at, body, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.record_hash, r.thread_id, r.seq, r.prev_hash, r.author_id,
        r.author_key, r.kind, r.recorded_at, r.body, r.signature
      );
      imported.records++;
    }
    return { imported, skipped };
  }

  // Full dump of all three tables, rows verbatim. Ordering is pinned
  // (identities/threads by id, records by thread_id, seq) and matched by
  // scripts/export-hubdb.mjs so a laptop export and a DO export of the same
  // data byte-diff clean at cutover.
  exportRows() {
    return {
      identities: this.sql.exec('SELECT * FROM identities ORDER BY id').toArray(),
      threads: this.sql.exec('SELECT * FROM threads ORDER BY id').toArray(),
      records: this.sql.exec('SELECT * FROM records ORDER BY thread_id, seq').toArray(),
    };
  }
}
