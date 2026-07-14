// sandbox-store.js — the Store contract (packages/threadhub/src/store.js) over
// a Durable Object's SQLite storage, in a DELIBERATELY RELAXED variant for the
// ephemeral sandbox.
//
// THE ONE DIFFERENCE from the production store (threadhub-cf/src/store-do.js):
// the two append-only triggers (records_no_update / records_no_delete) are
// OMITTED. The production trigger blocks DELETE — that is exactly why a TTL
// sweep needs a trigger-free variant here (owner ruling D-TTLSTORE). Sandbox
// records are ephemeral demos, NOT governance records: they are never anchored,
// every sandbox view discloses "expires within 24h / not a governance record",
// and deletion is the entire point. test/store-parity.test.js pins that the
// ONLY divergence from store.js is the removed triggers, so the relaxation
// cannot silently widen.
//
// Everything else — table shapes, FKs, CHECKs, UNIQUE constraints, error
// semantics — is byte-for-byte the production schema, so hub.js's invariants
// (hash chain, signing, sequence) hold identically. The WAL pragma and
// PRAGMA foreign_keys are omitted for the same reasons as store-do.js (DO
// SQLite enforces FKs by default; journal mode is meaningless in DO storage).

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

CREATE INDEX IF NOT EXISTS idx_records_thread ON records(thread_id, seq);
`;

export class SandboxStore {
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
  countThreads() {
    return this.sql.exec('SELECT COUNT(*) AS n FROM threads').one().n;
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

  // --- ephemeral TTL support (sandbox-only; impossible on the prod store,
  //     whose records_no_delete trigger would RAISE(ABORT) on every DELETE) ---

  // Threads whose created_at is strictly older than the ISO cutoff, EXCLUDING
  // any whose slug is in exemptSlugs (the pinned demo). Used by the DO alarm to
  // find what to sweep — the exemption is enforced in SQL (`slug NOT IN (...)`)
  // so a pinned thread is never even returned to the cascade delete. Uses the
  // existing `slug` column; no schema change (store-parity stays intact).
  threadsOlderThan(cutoffISO, exemptSlugs = []) {
    if (exemptSlugs.length === 0) {
      return this.sql.exec(
        'SELECT * FROM threads WHERE created_at < ? ORDER BY created_at', cutoffISO
      ).toArray();
    }
    const placeholders = exemptSlugs.map(() => '?').join(', ');
    return this.sql.exec(
      `SELECT * FROM threads WHERE created_at < ? AND slug NOT IN (${placeholders}) ORDER BY created_at`,
      cutoffISO, ...exemptSlugs
    ).toArray();
  }

  // Delete one sandbox thread and everything unique to it: its records first
  // (FK: records.thread_id → threads.id), then the thread, then its custodial
  // writer identity. Each POST /try mints a fresh writer 1:1 with its thread,
  // so the identity is safe to drop; the guard skips it if anything still
  // references it (defensive — the id could be shared in a future variant).
  deleteThreadCascade(threadId) {
    const thread = this.getThread(threadId);
    if (!thread) return false;
    this.sql.exec('DELETE FROM records WHERE thread_id = ?', thread.id);
    this.sql.exec('DELETE FROM threads WHERE id = ?', thread.id);
    const writer = thread.created_by;
    const stillUsedByThread = this.#one(
      'SELECT 1 AS x FROM threads WHERE created_by = ? LIMIT 1', writer);
    const stillUsedByRecord = this.#one(
      'SELECT 1 AS x FROM records WHERE author_id = ? LIMIT 1', writer);
    if (!stillUsedByThread && !stillUsedByRecord) {
      this.sql.exec('DELETE FROM identities WHERE id = ?', writer);
    }
    return true;
  }
}
