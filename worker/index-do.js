import { DurableObject } from 'cloudflare:workers';

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
    // Queue of threads a human asked the autonomous agent (clistahermes) to
    // deliberate. NOT a protocol event — kept out of the append-only log so the
    // chain stays clean. The agent polls listFlags() and clears each after it
    // picks the thread up (agent-ack) or records a decision. The channel/
    // workspace_ref/responders/phase/detail columns carry live A2A deliberation
    // status the agent reports back via recordAgentProgress() (e.g. which Raft
    // workspace it took the question to, how many peer agents engaged).
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
  }

  upsert(card) {
    if (!card || !card.id) return { ok: false };
    this.sql.exec(
      `INSERT INTO threads (id, title, question, status, owner, events, last, updated_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, question=excluded.question, status=excluded.status,
         owner=excluded.owner, events=excluded.events, last=excluded.last,
         updated_ms=excluded.updated_ms`,
      card.id,
      card.title ?? null,
      card.question ?? null,
      card.status ?? 'active',
      card.owner ?? null,
      card.events ?? 0,
      card.last ?? null,
      card.updated_ms ?? 0
    );
    return { ok: true };
  }

  remove(id) {
    if (!id) return { ok: false };
    this.sql.exec('DELETE FROM threads WHERE id = ?', id);
    this.sql.exec('DELETE FROM agent_flags WHERE thread_id = ?', id);
    return { ok: true };
  }

  list() {
    const threads = this.sql
      .exec('SELECT id, title, question, status, owner, events, last FROM threads ORDER BY updated_ms DESC')
      .toArray();
    return { threads };
  }

  // Flag a thread for autonomous agent deliberation (idempotent — re-flagging
  // an in-progress thread just refreshes it to pending). A fresh request clears
  // any prior deliberation status — the agent reports it anew on its next cycle.
  flagForAgent(threadId, requestedBy, at) {
    if (!threadId) return { ok: false };
    this.sql.exec(
      `INSERT INTO agent_flags (thread_id, requested_by, requested_at, status,
         channel, workspace_ref, responders, phase, detail, updated_at)
       VALUES (?, ?, ?, 'pending', NULL, NULL, NULL, NULL, NULL, ?)
       ON CONFLICT(thread_id) DO UPDATE SET
         requested_by=excluded.requested_by, requested_at=excluded.requested_at, status='pending',
         channel=NULL, workspace_ref=NULL, responders=NULL, phase=NULL, detail=NULL, updated_at=excluded.updated_at`,
      threadId,
      requestedBy ?? null,
      at ?? null,
      at ?? null
    );
    return { ok: true, requested: true, since: at ?? null };
  }

  // The agent reports live deliberation status back to the cockpit (which Raft
  // workspace / moltbook channel it used, how many peer agents engaged, phase).
  // UPSERT (status 'claimed' on insert) so it's resilient: a progress report
  // recreates the status row even if the flag was already acked/cleared — the
  // agent reports progress on threads it is actively deliberating. DO metadata
  // only; never touches the append-only log.
  recordAgentProgress(threadId, p = {}) {
    if (!threadId) return { ok: false };
    this.sql.exec(
      `INSERT INTO agent_flags (thread_id, status, channel, workspace_ref, responders, phase, detail, updated_at)
       VALUES (?, 'claimed', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(thread_id) DO UPDATE SET
         channel = COALESCE(excluded.channel, channel),
         workspace_ref = COALESCE(excluded.workspace_ref, workspace_ref),
         responders = COALESCE(excluded.responders, responders),
         phase = COALESCE(excluded.phase, phase),
         detail = COALESCE(excluded.detail, detail),
         updated_at = excluded.updated_at`,
      threadId,
      p.channel ?? null,
      p.workspaceRef ?? null,
      typeof p.responders === 'number' ? p.responders : null,
      p.phase ?? null,
      p.detail ?? null,
      p.at ?? null
    );
    return { ok: true, ...this.flagStatus(threadId) };
  }

  // The agent's poll queue: threads awaiting deliberation.
  listFlags() {
    const flags = this.sql
      .exec(
        `SELECT thread_id AS threadId, requested_by AS requestedBy, requested_at AS requestedAt, status
         FROM agent_flags WHERE status = 'pending' ORDER BY requested_at`
      )
      .toArray();
    return { flags };
  }

  // Single-thread status for the cockpit UI (incl. live deliberation status).
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

  // The agent acks a flag: it has picked the thread up and is now deliberating.
  // Dequeue it (status 'claimed' → listFlags only returns 'pending') but KEEP
  // the row — it carries the live deliberation status the cockpit shows until
  // the thread is decided. (Deleting here is what dropped the reported status.)
  claimFlag(threadId) {
    if (!threadId) return { ok: false };
    this.sql.exec("UPDATE agent_flags SET status = 'claimed' WHERE thread_id = ?", threadId);
    return { ok: true, ...this.flagStatus(threadId) };
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
