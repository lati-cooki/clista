// Proves the genesis log the Worker mints for POST /api/threads
// (ParticipantDeclared → ThreadCreated) validates, hash-chains, and projects to
// a live thread with the creator as its first participant. Mirrors the event
// shapes built in worker/index.js so a drift there is caught here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const engine = require(join(here, '..', 'worker', 'engine', 'index.js'));

function genesisLog({ actorId, name, title, question }) {
  const threadId = engine.newId('thd', question);
  const at = engine.nowIso();
  return {
    threadId,
    events: [
      {
        event_id: engine.newId('evt', 'ParticipantDeclared'),
        event_type: 'ParticipantDeclared',
        thread_id: threadId,
        actor_id: actorId,
        timestamp: at,
        payload: {
          participant: { id: actorId, object: 'participant', kind: 'human', name, role: 'decision owner' },
        },
      },
      {
        event_id: engine.newId('evt', 'ThreadCreated'),
        event_type: 'ThreadCreated',
        thread_id: threadId,
        actor_id: actorId,
        timestamp: at,
        payload: {
          thread: {
            id: threadId,
            object: 'thread',
            title,
            question,
            status: 'active',
            participantIds: [actorId],
            createdAt: at,
            updatedAt: at,
          },
        },
      },
    ],
  };
}

const { threadId, events } = genesisLog({
  actorId: 'par_troylati',
  name: 'troylati',
  title: 'Beta cut-over',
  question: 'Should we cut the beta over to the live cockpit this week?',
});

test('genesis log validates and the chain re-validates', () => {
  const chained = engine.chainEvents(events);
  const validation = engine.validateEvents(chained);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
  const integrity = engine.verifyEventIntegrity(chained, { strict: true });
  assert.equal(integrity.valid, true, JSON.stringify(integrity.reasons, null, 2));
});

test('projection yields a live thread owned by the creator', () => {
  const state = engine.selectThreadState(engine.projectEvents(events), threadId);
  assert.equal(state.thread.id, threadId);
  assert.equal(state.thread.status, 'active');
  const participants = (state.identityState && state.identityState.participants) || [];
  assert.deepEqual(participants.map((p) => p.id), ['par_troylati']);
  assert.equal(participants[0].role, 'decision owner');
});

test('a thread.id that disagrees with thread_id is rejected (fail-closed)', () => {
  const bad = engine.chainEvents(genesisLog({
    actorId: 'par_x', name: 'X', title: 't', question: 'a sufficiently long question here',
  }).events.map((e, i) => (i === 1 ? { ...e, payload: { thread: { ...e.payload.thread, id: 'thd_mismatch' } } } : e)));
  const validation = engine.validateEvents(bad);
  assert.equal(validation.valid, false);
});
