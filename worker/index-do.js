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
    // picks the thread up (agent-ack) or records a decision.
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS agent_flags (
        thread_id TEXT PRIMARY KEY,
        requested_by TEXT,
        requested_at TEXT,
        status TEXT DEFAULT 'pending'
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
  // an in-progress thread just refreshes it to pending).
  flagForAgent(threadId, requestedBy, at) {
    if (!threadId) return { ok: false };
    this.sql.exec(
      `INSERT INTO agent_flags (thread_id, requested_by, requested_at, status)
       VALUES (?, ?, ?, 'pending')
       ON CONFLICT(thread_id) DO UPDATE SET
         requested_by=excluded.requested_by, requested_at=excluded.requested_at, status='pending'`,
      threadId,
      requestedBy ?? null,
      at ?? null
    );
    return { ok: true, requested: true, since: at ?? null };
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

  // Single-thread status for the cockpit UI.
  flagStatus(threadId) {
    const row = this.sql
      .exec(
        `SELECT requested_by AS requestedBy, requested_at AS since, status
         FROM agent_flags WHERE thread_id = ?`,
        threadId
      )
      .toArray()[0];
    return row ? { requested: true, since: row.since, requestedBy: row.requestedBy, status: row.status } : { requested: false };
  }

  clearFlag(threadId) {
    if (!threadId) return { ok: false };
    this.sql.exec('DELETE FROM agent_flags WHERE thread_id = ?', threadId);
    return { ok: true, requested: false };
  }
}
