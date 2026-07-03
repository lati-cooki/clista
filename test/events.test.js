// Proves the shared event builders in src/events.js produce engine-valid payloads
// and — critically — set the NESTED participant id to the acting actor for every
// kind. The server forces only the top-level actor_id; a wrong nested id fails
// closed (422), so this is the exact trap the single-builder extraction prevents.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import {
  buildObjection, buildAssumption, buildClaim, buildPosition, buildDecisionRequest, buildReview, guard,
} from '../src/events.js';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const engine = require(join(here, '..', 'worker', 'engine', 'index.js'));

const ACTOR = 'par_test';
const threadId = engine.newId('thd', 'Should inline cockpit affordances build valid events?');

// Wrap a builder's { event_type, payload } in the full event envelope the server
// would mint (server sets event_id/thread_id/actor_id/timestamp).
const envelope = (built) => ({
  event_id: engine.newId('evt', built.event_type),
  event_type: built.event_type,
  thread_id: threadId,
  actor_id: ACTOR,
  timestamp: engine.nowIso(),
  payload: built.payload,
});

const genesis = [
  {
    event_id: engine.newId('evt', 'ParticipantDeclared'),
    event_type: 'ParticipantDeclared',
    thread_id: threadId,
    actor_id: ACTOR,
    timestamp: engine.nowIso(),
    payload: { participant: { id: ACTOR, object: 'participant', kind: 'human', name: 'Test', role: 'decision owner' } },
  },
  {
    event_id: engine.newId('evt', 'ThreadCreated'),
    event_type: 'ThreadCreated',
    thread_id: threadId,
    actor_id: ACTOR,
    timestamp: engine.nowIso(),
    payload: {
      thread: {
        id: threadId, object: 'thread', title: 'Inline affordances',
        question: 'Should inline cockpit affordances build valid events?',
        status: 'active', participantIds: [ACTOR], createdAt: engine.nowIso(), updatedAt: engine.nowIso(),
      },
    },
  },
];

// Build each kind through the shared builders, threading real ids so the chain
// references resolve (objection/position target the claim; review targets the DRQ).
const claim = buildClaim({ threadId, actorId: ACTOR, text: 'A base claim for the substrate', id: 'clm_base' });
const assumption = buildAssumption({ threadId, actorId: ACTOR, text: 'A base premise the decision rests on', confidence: 0.75, id: 'asm_base' });
const objection = buildObjection({ threadId, actorId: ACTOR, target: 'clm_base', text: 'A recorded challenge to the claim', id: 'obj_1' });
const position = buildPosition({ threadId, actorId: ACTOR, target: 'clm_base', stance: 'support', reason: 'stands with it', id: 'pos_1' });
const drq = buildDecisionRequest({ threadId, actorId: ACTOR, proposal: 'Decide the matter precisely now', refs: { claims: ['clm_base'], assumptions: ['asm_base'] }, id: 'drq_1' });
const review = buildReview({ threadId, actorId: ACTOR, decisionRequestId: 'drq_1', status: 'approve', conditions: 'carry this forward\n', comment: 'looks sound', id: 'rev_1' });

const fullLog = [
  ...genesis,
  envelope(claim), envelope(assumption), envelope(objection), envelope(position), envelope(drq), envelope(review),
];

test('all six builders produce a chain that validates and re-chains', () => {
  const chained = engine.chainEvents(fullLog);
  const validation = engine.validateEvents(chained);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
  const integrity = engine.verifyEventIntegrity(chained, { strict: true });
  assert.equal(integrity.valid, true, JSON.stringify(integrity.reasons, null, 2));
});

test('every builder sets the nested participant id to the actor (the 422 trap)', () => {
  assert.equal(objection.payload.objection.participantId, ACTOR);
  assert.equal(assumption.payload.assumption.declaredByParticipantId, ACTOR);
  assert.equal(claim.payload.claim.createdByParticipantId, ACTOR);
  assert.equal(position.payload.position.participantId, ACTOR);
  assert.equal(drq.payload.decisionRequest.openedByParticipantId, ACTOR);
  assert.equal(review.payload.review.reviewerParticipantId, ACTOR);
});

test('an objection is typed by its target id — decision challenges attach to the request (drq_*)', () => {
  // Mirrors the engine CLI's inferTargetType: the validator has no "decision"
  // type, so the cockpit offers the decision's request id as the target.
  const onClaim = buildObjection({ threadId, actorId: ACTOR, target: 'clm_x', text: 'x'.repeat(12) });
  const onRequest = buildObjection({ threadId, actorId: ACTOR, target: 'drq_abc', text: 'x'.repeat(12) });
  const onAssumption = buildObjection({ threadId, actorId: ACTOR, target: 'asm_y', text: 'x'.repeat(12) });
  const onEvidence = buildObjection({ threadId, actorId: ACTOR, target: 'evd_z', text: 'x'.repeat(12) });
  assert.equal(onClaim.payload.objection.targetObjectType, 'claim');
  assert.equal(onRequest.payload.objection.targetObjectType, 'decisionRequest');
  assert.equal(onAssumption.payload.objection.targetObjectType, 'assumption');
  assert.equal(onEvidence.payload.objection.targetObjectType, 'evidence');
});

test('guard mirrors the engine rules (target/open-DRQ/min-12, optional text for position+review)', () => {
  assert.match(guard('objection', { target: '', text: 'long enough text here' }), /target is required/);
  assert.match(guard('position', { target: '', text: '' }), /target is required/);
  assert.match(guard('review', { decisionRequest: null }), /no open decision request/);
  assert.match(guard('claim', { text: 'too short' }), /min 12 chars/);
  assert.equal(guard('objection', { target: 'clm_1', text: 'a sufficiently long objection' }), null);
  assert.equal(guard('position', { target: 'clm_1', text: '' }), null); // reason optional
  assert.equal(guard('review', { decisionRequest: { id: 'drq_1' }, text: '' }), null); // comment optional
});
