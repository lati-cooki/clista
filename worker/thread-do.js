import { DurableObject } from 'cloudflare:workers';
import * as engine from './engine/index.js';

// One Durable Object per decision thread. Its SQLite holds that thread's
// append-only, hash-chained event log — the source of truth. Projection and
// validation run here against the ported ClisTa engine, so state is always
// derived from events and replays deterministically.
export class ThreadDO extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        raw TEXT NOT NULL
      )`
    );
  }

  // All stored (chained) events in append order.
  _readAll() {
    return this.sql
      .exec('SELECT raw FROM events ORDER BY seq')
      .toArray()
      .map((row) => JSON.parse(row.raw));
  }

  _headHash() {
    const rows = this.sql.exec('SELECT content_hash FROM events ORDER BY seq DESC LIMIT 1').toArray();
    return rows.length ? rows[0].content_hash : undefined;
  }

  // Append one event: validate-before-trust against the full prospective log,
  // fail-closed on rejection (event_id + reasons), otherwise hash-chain and store.
  append(rawEvent) {
    const stored = this._readAll();
    // Server-authoritative: the DO mints event_id + timestamp when absent.
    const event = {
      ...rawEvent,
      event_id: rawEvent.event_id || engine.newId('evt', rawEvent.event_type),
      timestamp: rawEvent.timestamp || engine.nowIso(),
    };
    const prepared = engine.prepareEventForAppend(event, this._headHash());
    const candidate = [...stored, prepared];

    const validation = engine.validateEvents(candidate);
    if (!validation.valid) {
      // validator returns `errors`; surface only the new event's, fail-closed.
      const scoped = validation.errors.filter(
        (e) => !e.event_id || e.event_id === prepared.event_id
      );
      return {
        ok: false,
        event_id: prepared.event_id,
        reasons: scoped.length ? scoped : validation.errors,
      };
    }

    this.sql.exec(
      'INSERT INTO events (event_id, content_hash, raw) VALUES (?, ?, ?)',
      prepared.event_id,
      prepared.content_hash,
      engine.stableStringify(prepared)
    );
    return { ok: true, event: prepared, head_hash: prepared.content_hash };
  }

  // Seed/replay a batch of raw events as one chained log (used to ingest the
  // canonical scenario-demo log). Validates the whole set before storing any.
  ingest(rawEvents) {
    if (this._readAll().length > 0) {
      return { ok: false, reasons: [{ reason: 'thread already has events; ingest only into an empty thread' }] };
    }
    const chained = engine.chainEvents(rawEvents);
    const validation = engine.validateEvents(chained);
    if (!validation.valid) {
      return { ok: false, reasons: validation.errors };
    }
    for (const event of chained) {
      this.sql.exec(
        'INSERT INTO events (event_id, content_hash, raw) VALUES (?, ?, ?)',
        event.event_id,
        event.content_hash,
        engine.stableStringify(event)
      );
    }
    return { ok: true, count: chained.length, head_hash: chained.at(-1)?.content_hash ?? null };
  }

  // Projected thread state (clista.threadState.v0).
  state(threadId) {
    return engine.selectThreadState(engine.projectEvents(this._readAll()), threadId);
  }

  // Phase 0 "answer view" (clista.decisionSummary.v0).
  summary(threadId) {
    return engine.selectDecisionSummary(engine.projectEvents(this._readAll()), threadId);
  }

  // Append-only audit view (clista.audit.v0).
  audit(threadId) {
    return engine.selectAudit(engine.projectEvents(this._readAll()), threadId);
  }

  // Lightweight card for the thread index (derived from projected state).
  indexCard() {
    const events = this._readAll();
    if (!events.length) return null;
    const state = engine.selectThreadState(engine.projectEvents(events));
    const thread = state.thread || {};
    const participants = (state.identityState && state.identityState.participants) || [];
    const decision = state.decisionStatus && state.decisionStatus.decisionRecord;
    const ownerId =
      (decision && decision.decidedByParticipantId) ||
      (participants.find((p) => /owner/.test(p.role || '')) || participants[0] || {}).id;
    const ownerName = (participants.find((p) => p.id === ownerId) || {}).name || ownerId || 'unknown';
    const last = thread.updatedAt || events.at(-1)?.timestamp || null;
    return {
      id: thread.id || null,
      title: thread.title || null,
      question: thread.question || null,
      status: thread.status || 'active',
      owner: ownerName,
      events: events.length,
      last,
      updated_ms: last ? Date.parse(last) : 0,
    };
  }

  // Purge this thread's log. The router only calls this for ORPHAN threads
  // (no ThreadCreated → never registered in the index), so append-only integrity
  // for legitimate threads is preserved — this is cleanup for malformed/junk DOs.
  purge() {
    const had = this._readAll().length;
    this.sql.exec('DELETE FROM events');
    return { ok: true, purged: true, removed_events: had };
  }

  // Re-validate the stored chain: structural validation + hash-chain integrity.
  validate() {
    const events = this._readAll();
    const integrity = engine.verifyEventIntegrity(events, { strict: events.length > 0 });
    const validation = engine.validateEvents(events);
    return {
      ok: integrity.valid && validation.valid,
      event_count: events.length,
      head_hash: integrity.headHash,
      integrity,
      validation,
    };
  }
}
