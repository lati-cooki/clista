import { DurableObject } from 'cloudflare:workers';
import * as engine from './engine/index.js';
import { buildCard } from './portfolio-signals.js';

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
  //
  // Re-review loop: when the accepted event is an ObjectionRaised on an
  // already-decided thread, the DO mints a companion ReviewTriggered in the SAME
  // call and stores both atomically. This keeps the trigger inside the
  // hash-chained log (replayable, no external actor) — the finance model-risk
  // "monitoring breach → re-validate" loop, in-protocol. The decision record is
  // never touched; only the thread status flips to "re-review".
  append(rawEvent) {
    const stored = this._readAll();
    // Server-authoritative: the DO mints event_id + timestamp when absent.
    const event = {
      ...rawEvent,
      event_id: rawEvent.event_id || engine.newId('evt', rawEvent.event_type),
      timestamp: rawEvent.timestamp || engine.nowIso(),
    };
    const prepared = engine.prepareEventForAppend(event, this._headHash());

    const companions = this._reReviewCompanions(stored, prepared);
    const toStore = [prepared, ...companions];
    const candidate = [...stored, ...toStore];

    const validation = engine.validateEvents(candidate);
    if (!validation.valid) {
      // validator returns `errors`; surface only the new events', fail-closed.
      const newIds = new Set(toStore.map((e) => e.event_id));
      const scoped = validation.errors.filter((e) => !e.event_id || newIds.has(e.event_id));
      return {
        ok: false,
        event_id: prepared.event_id,
        reasons: scoped.length ? scoped : validation.errors,
      };
    }

    for (const e of toStore) {
      this.sql.exec(
        'INSERT INTO events (event_id, content_hash, raw) VALUES (?, ?, ?)',
        e.event_id,
        e.content_hash,
        engine.stableStringify(e)
      );
    }
    const trigger = companions.find((e) => e.event_type === 'ReviewTriggered');
    return {
      ok: true,
      event: prepared,
      events: toStore,
      head_hash: toStore.at(-1).content_hash,
      ...(trigger
        ? { reReviewTriggered: true, reviewTrigger: trigger.payload.reviewTrigger }
        : {}),
    };
  }

  // If `prepared` is a post-decision objection on a decided thread, build the
  // companion ReviewTriggered event (chained onto the objection). Returns [] in
  // every other case. Only objections on threads that already carry a
  // DecisionMerged pay the projection cost (cheap pre-scan first).
  _reReviewCompanions(stored, prepared) {
    if (prepared.event_type !== 'ObjectionRaised') return [];
    if (!stored.some((e) => e.event_type === 'DecisionMerged')) return [];

    const threadId = prepared.thread_id;
    const state = engine.selectThreadState(engine.projectEvents(stored), threadId);
    // Only flip from a settled decision. 're-review' is already flagged (one
    // trigger per decision epoch — further objections just accrue); 'review'
    // means a re-decision is already in progress; both skip emission.
    if (state.thread?.status !== 'decided') return [];

    const decision = state.decisionStatus?.decisionRecord;
    const objection = prepared.payload?.objection;
    if (!decision || !objection) return [];

    // "Post-decision" is guaranteed by append order, NOT by timestamps: this
    // objection is landing on a log that already carries the DecisionMerged
    // (status is 'decided'), so in seq order it follows the decision. We do not
    // consult the client-supplied objection.raisedAt — trusting it would let a
    // backdated objection silently suppress the trigger (the harvester is the
    // actor we least control). The trigger time is the server's own clock.
    const triggeredAt = engine.nowIso();
    const triggerEvent = engine.createEvent({
      type: 'ReviewTriggered',
      threadId,
      actorId: objection.participantId, // the objector is the accountable actor
      at: triggeredAt,
      payload: {
        reviewTrigger: {
          id: engine.newId('rvt'),
          object: 'reviewTrigger',
          threadId,
          decisionRecordId: decision.id,
          triggeringObjectionId: objection.id,
          reason: 'post_decision_objection',
          triggeredByParticipantId: objection.participantId,
          triggeredAt,
        },
      },
    });
    return [engine.prepareEventForAppend(triggerEvent, prepared.content_hash)];
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

  // The raw, chained event log — the archival export. Unlike the projected
  // views this is the source of truth verbatim (event ids, hashes, chain
  // fields included), so an external archive (e.g. ThreadHub ingest) stores
  // exactly what this DO holds and stays independently re-verifiable.
  export() {
    return this._readAll();
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
    const integrity = engine.verifyEventIntegrity(events, { strict: events.length > 0 });
    const validation = engine.validateEvents(events);
    const lastTimestamp = (state.thread && state.thread.updatedAt) || events.at(-1)?.timestamp || null;
    return buildCard(state, {
      chainValid: integrity.valid && validation.valid,
      eventCount: events.length,
      lastTimestamp,
    });
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
