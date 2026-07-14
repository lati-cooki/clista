import { DurableObject } from 'cloudflare:workers';
import { assemblePortfolio } from './portfolio-signals.js';

// A single Durable Object holding the thread_id → card index for the list view.
// Per-thread DOs are the source of truth; this is a derived projection updated
// on each successful append/ingest (don't fan out across per-thread DOs to list).
export class IndexDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        title TEXT,
        question TEXT,
        status TEXT,
        owner TEXT,
        events INTEGER,
        last TEXT,
        updated_ms INTEGER
      )`
    );
    // Back-fill the hidden column on DOs created before it existed.
    const threadCols = new Set(this.sql.exec('PRAGMA table_info(threads)').toArray().map((r) => r.name));
    if (!threadCols.has('hidden')) this.sql.exec('ALTER TABLE threads ADD COLUMN hidden INTEGER DEFAULT 0');
    // Portfolio health-signal columns (nullable; back-filled on next append, or
    // in bulk via POST /api/portfolio/rebuild). ADD COLUMN is a no-op once present.
    for (const [name, decl] of [
      ['stage', 'TEXT'],
      ['open_objections', 'INTEGER'],
      ['evidence_count', 'INTEGER'],
      ['claims_total', 'INTEGER'],
      ['claims_grounded', 'INTEGER'],
      ['outstanding_conditions', 'INTEGER'],
      ['re_review', 'INTEGER'],
      ['chain_valid', 'INTEGER'],
    ]) {
      if (!threadCols.has(name)) this.sql.exec(`ALTER TABLE threads ADD COLUMN ${name} ${decl}`);
    }
    // Per-thread status rows (DO metadata, NOT protocol events — kept out of
    // the append-only log so the chain stays clean). Originally the clistahermes
    // deliberation flag queue (agent automation retired 2026-07-07; the queue/
    // ack/progress accessors are gone) — retained as the in-app notification
    // seam: flagReReview() marks a decided thread that received a post-decision
    // objection, and historical deliberation rows keep their provenance.
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS agent_flags (
        thread_id TEXT PRIMARY KEY,
        requested_by TEXT,
        requested_at TEXT,
        status TEXT DEFAULT 'pending',
        channel TEXT,
        workspace_ref TEXT,
        responders INTEGER,
        phase TEXT,
        detail TEXT,
        updated_at TEXT
      )`
    );
    // Back-fill the deliberation-status columns on DOs created before they
    // existed (ADD COLUMN is a no-op once present).
    const cols = new Set(this.sql.exec('PRAGMA table_info(agent_flags)').toArray().map((r) => r.name));
    for (const [name, decl] of [
      ['channel', 'TEXT'],
      ['workspace_ref', 'TEXT'],
      ['responders', 'INTEGER'],
      ['phase', 'TEXT'],
      ['detail', 'TEXT'],
      ['updated_at', 'TEXT'],
    ]) {
      if (!cols.has(name)) this.sql.exec(`ALTER TABLE agent_flags ADD COLUMN ${name} ${decl}`);
    }
    // The triage inbox: proposals/submissions awaiting the owner's judgement.
    // The agent (emergent seeder) and — once the public route ships — outside
    // submitters enqueue here; a human triages every row and is the accountable
    // creator/owner of anything promoted. Strictly QUARANTINED: this is DO
    // metadata, NOT a protocol event and NOT in the threads index, so nothing a
    // non-owner submits is trusted or visible as ledger state until approved.
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS intake (
        id TEXT PRIMARY KEY,
        source TEXT,
        kind TEXT,
        status TEXT DEFAULT 'pending',
        title TEXT,
        question TEXT,
        body TEXT,
        target_thread_id TEXT,
        payload TEXT,
        provenance TEXT,
        submitter TEXT,
        submitted_at TEXT,
        resolved_thread_id TEXT,
        updated_at TEXT
      )`
    );
    // Coarse per-IP rate limit for the PUBLIC intake route (a fixed window). A
    // backstop behind Turnstile, not the primary gate — keeps a single source
    // from flooding the quarantine queue.
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS intake_rate (
        ip TEXT PRIMARY KEY,
        window_start TEXT,
        count INTEGER
      )`
    );
  }

  upsert(card) {
    if (!card || !card.id) return { ok: false };
    this.sql.exec(
      `INSERT INTO threads (id, title, question, status, owner, events, last, updated_ms,
         stage, open_objections, evidence_count, claims_total, claims_grounded, outstanding_conditions, re_review, chain_valid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, question=excluded.question, status=excluded.status,
         owner=excluded.owner, events=excluded.events, last=excluded.last, updated_ms=excluded.updated_ms,
         stage=excluded.stage, open_objections=excluded.open_objections, evidence_count=excluded.evidence_count,
         claims_total=excluded.claims_total, claims_grounded=excluded.claims_grounded,
         outstanding_conditions=excluded.outstanding_conditions, re_review=excluded.re_review, chain_valid=excluded.chain_valid`,
      card.id,
      card.title ?? null,
      card.question ?? null,
      card.status ?? 'active',
      card.owner ?? null,
      card.events ?? 0,
      card.last ?? null,
      card.updated_ms ?? 0,
      card.stage ?? null,
      card.open_objections ?? null,
      card.evidence_count ?? null,
      card.claims_total ?? null,
      card.claims_grounded ?? null,
      card.outstanding_conditions ?? null,
      card.re_review == null ? null : card.re_review ? 1 : 0,
      card.chain_valid == null ? null : card.chain_valid ? 1 : 0
    );
    return { ok: true };
  }

  remove(id) {
    if (!id) return { ok: false };
    this.sql.exec('DELETE FROM threads WHERE id = ?', id);
    this.sql.exec('DELETE FROM agent_flags WHERE thread_id = ?', id);
    return { ok: true };
  }

  // Default view filters hidden cards out and keeps the wire shape unchanged;
  // includeHidden is the audit view — every card plus its hidden flag.
  list(includeHidden = false) {
    const threads = includeHidden
      ? this.sql
          .exec(
            'SELECT id, title, question, status, owner, events, last, COALESCE(hidden, 0) AS hidden FROM threads ORDER BY updated_ms DESC'
          )
          .toArray()
      : this.sql
          .exec(
            'SELECT id, title, question, status, owner, events, last FROM threads WHERE COALESCE(hidden, 0) = 0 ORDER BY updated_ms DESC'
          )
          .toArray();
    return { threads };
  }

  // The portfolio projection: every visible thread's enriched card + a summary.
  // Time-relative signals (staleness/overdue) and attention are computed at read.
  portfolio() {
    const rows = this.sql
      .exec(
        `SELECT id, title, question, status, owner, events, last, updated_ms,
                stage, open_objections, evidence_count, claims_total, claims_grounded,
                outstanding_conditions, re_review, chain_valid
         FROM threads WHERE COALESCE(hidden, 0) = 0 ORDER BY updated_ms DESC`
      )
      .toArray();
    return assemblePortfolio(rows, Date.now());
  }

  // Hide/unhide a thread card in the list projection. DO metadata only — the
  // per-thread log is untouched and the thread stays resolvable by id. For
  // sealed/superseded logs (e.g. a re-issued example revision). upsert() never
  // writes `hidden`, so re-registration on a later append keeps the flag.
  setHidden(id, hidden) {
    if (!id) return { ok: false };
    const rows = this.sql
      .exec('UPDATE threads SET hidden = ? WHERE id = ? RETURNING id', hidden ? 1 : 0, id)
      .toArray();
    return rows.length ? { ok: true, id, hidden: !!hidden } : { ok: false, reason: 'not in index' };
  }



  // A decided thread received a post-decision objection and flipped to
  // re-review (see ThreadDO.append). Record that on the thread's agent_flags
  // row. The cockpit's re-review banner renders from the projection itself
  // (vm.reReview), so this row is the durable seam for FUTURE notification
  // surfaces — external alerting (email/push) and owner-transfer plug in at
  // the router around the call site, not here. DO metadata only; never
  // touches the append-only log.
  flagReReview(threadId, { ownerId, objectorId, objectionId, at } = {}) {
    if (!threadId) return { ok: false };
    const detail = `re-review · owner=${ownerId || 'unknown'} · objection=${objectionId || 'unknown'} · by=${objectorId || 'unknown'}`;
    this.sql.exec(
      `INSERT INTO agent_flags (thread_id, status, phase, detail, updated_at)
       VALUES (?, 're-review', 're-review', ?, ?)
       ON CONFLICT(thread_id) DO UPDATE SET
         status='re-review', phase='re-review', detail=excluded.detail, updated_at=excluded.updated_at`,
      threadId,
      detail,
      at ?? null
    );
    return { ok: true, ...this.flagStatus(threadId) };
  }

  // Single-thread status row (flagReReview's return payload; historical
  // deliberation rows readable here too).
  flagStatus(threadId) {
    const row = this.sql
      .exec(
        `SELECT requested_by AS requestedBy, requested_at AS since, status,
                channel, workspace_ref AS workspaceRef, responders, phase, detail, updated_at AS updatedAt
         FROM agent_flags WHERE thread_id = ?`,
        threadId
      )
      .toArray()[0];
    return row
      ? {
          requested: true,
          since: row.since,
          requestedBy: row.requestedBy,
          status: row.status,
          channel: row.channel || null,
          workspaceRef: row.workspaceRef || null,
          responders: typeof row.responders === 'number' ? row.responders : null,
          phase: row.phase || null,
          detail: row.detail || null,
          updatedAt: row.updatedAt || null,
        }
      : { requested: false };
  }


  // --- Triage inbox -------------------------------------------------------
  // Enqueue a proposal/submission for the owner to triage. `payload` and
  // `provenance` are arbitrary JSON (stored as text). Never touches the
  // append-only log or the threads index — it sits quarantined until approved.
  enqueueIntake(row) {
    if (!row || !row.id) return { ok: false };
    this.sql.exec(
      `INSERT INTO intake (id, source, kind, status, title, question, body,
         target_thread_id, payload, provenance, submitter, submitted_at, resolved_thread_id, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      row.id,
      row.source ?? null,
      row.kind ?? null,
      row.title ?? null,
      row.question ?? null,
      row.body ?? null,
      row.targetThreadId ?? null,
      row.payload != null ? JSON.stringify(row.payload) : null,
      row.provenance != null ? JSON.stringify(row.provenance) : null,
      row.submitter ?? null,
      row.at ?? null,
      row.at ?? null
    );
    return { ok: true, id: row.id };
  }

  listIntake(status = 'pending') {
    const intake = this.sql
      .exec(`SELECT * FROM intake WHERE status = ? ORDER BY submitted_at DESC`, status)
      .toArray()
      .map(intakeRow);
    return { intake };
  }

  getIntake(id) {
    if (!id) return null;
    const row = this.sql.exec(`SELECT * FROM intake WHERE id = ?`, id).toArray()[0];
    return row ? intakeRow(row) : null;
  }

  // Resolve a triage item: 'approved' (carrying the created/targeted thread id),
  // 'dismissed', or 'spam'. Idempotency is enforced by the caller (it refuses to
  // act on a non-pending item).
  resolveIntake(id, { status, threadId, at } = {}) {
    if (!id) return { ok: false };
    this.sql.exec(
      `UPDATE intake SET status = ?, resolved_thread_id = COALESCE(?, resolved_thread_id), updated_at = ?
       WHERE id = ?`,
      status ?? 'approved',
      threadId ?? null,
      at ?? null,
      id
    );
    return { ok: true };
  }

  // Fixed-window per-IP rate limit for public submissions. Returns { ok } —
  // false once `limit` submissions land inside `windowMs`. Missing IP → allowed
  // (Turnstile is the real gate; we don't block when we can't attribute).
  rateLimitIntake(ip, nowIso, limit = 5, windowMs = 600000) {
    if (!ip) return { ok: true };
    const now = Date.parse(nowIso) || 0;
    const row = this.sql.exec('SELECT window_start, count FROM intake_rate WHERE ip = ?', ip).toArray()[0];
    const started = row ? Date.parse(row.window_start) || 0 : 0;
    if (!row || now - started > windowMs) {
      this.sql.exec(
        `INSERT INTO intake_rate (ip, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(ip) DO UPDATE SET window_start = excluded.window_start, count = 1`,
        ip,
        nowIso
      );
      return { ok: true };
    }
    if ((row.count || 0) >= limit) return { ok: false };
    this.sql.exec('UPDATE intake_rate SET count = count + 1 WHERE ip = ?', ip);
    return { ok: true };
  }
}

// Project a raw intake SQLite row into the API shape (JSON fields parsed).
function intakeRow(row) {
  const parse = (v) => {
    if (v == null) return null;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };
  return {
    id: row.id,
    source: row.source,
    kind: row.kind,
    status: row.status,
    title: row.title,
    question: row.question,
    body: row.body,
    targetThreadId: row.target_thread_id || null,
    payload: parse(row.payload),
    provenance: parse(row.provenance),
    submitter: row.submitter,
    submittedAt: row.submitted_at,
    resolvedThreadId: row.resolved_thread_id || null,
    updatedAt: row.updated_at,
  };
}
