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
}
