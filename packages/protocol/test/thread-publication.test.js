// ThreadPublished / ThreadPublicationRevoked — the publication vocabulary
// (DR-2026-07-13-record-is-the-interface). Publication is a witnessed
// per-thread governance act: a public read surface serves a thread ONLY when
// the last publication event on it is an effective publish. Revocation is
// itself an appended event, never a deletion — the effective state is the
// LAST publication event on the thread, and both acts stay in the record.
//
// Registered vocabulary, deliberately: a hub-level attestation marker without
// registry vocabulary was rejected in the DR because publication is a
// governance act other emitters will need to speak, and unregistered
// vocabulary is how the RECALL collision happened (DR-phase5-topology 3.3).
const assert = require("node:assert/strict");
const test = require("node:test");

const { chainEvents } = require("../src/integrity");
const { formatValidationErrors, validateEvents } = require("../src/validator");
const { projectEvents } = require("../src/projector");
const { EVENT_TYPES, primaryObject } = require("../src/event-types");

const THREAD = "thd_publication_test";

function baseEvents() {
  return [
    {
      event_id: "evt_participant_operator",
      event_type: "ParticipantAdded",
      thread_id: THREAD,
      actor_id: "par_operator",
      timestamp: "2026-07-13T00:00:00.000Z",
      payload: {
        participant: { id: "par_operator", object: "participant", kind: "human", name: "operator", role: "owner" }
      }
    },
    {
      event_id: "evt_thread_created",
      event_type: "ThreadCreated",
      thread_id: THREAD,
      actor_id: "par_operator",
      timestamp: "2026-07-13T00:00:01.000Z",
      payload: {
        thread: {
          id: THREAD, object: "thread", title: "publication test",
          question: "is the publication witnessed?", status: "active",
          participantIds: ["par_operator"],
          createdAt: "2026-07-13T00:00:01.000Z", updatedAt: "2026-07-13T00:00:01.000Z"
        }
      }
    }
  ];
}

function publicationPayload(overrides = {}, removals = []) {
  const payload = {
    threadPublication: {
      id: "tpb_test_1",
      object: "threadPublication",
      threadId: THREAD,
      action: "publish",
      scope: "public-read",
      publishedByParticipantId: "par_operator",
      publishedAt: "2026-07-13T00:00:02.000Z",
      ...overrides
    }
  };
  for (const key of removals) {
    delete payload.threadPublication[key];
  }
  return payload;
}

function publicationEvent(eventType, overrides = {}, removals = []) {
  return {
    event_id: `evt_publication_${eventType}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: eventType,
    thread_id: THREAD,
    actor_id: "par_operator",
    timestamp: "2026-07-13T00:00:02.000Z",
    payload: publicationPayload(overrides, removals)
  };
}

function logWith(...events) {
  return chainEvents([...baseEvents(), ...events]);
}

// ---- registry ----

test("registry lists ThreadPublished and ThreadPublicationRevoked", () => {
  assert.ok(EVENT_TYPES.includes("ThreadPublished"));
  assert.ok(EVENT_TYPES.includes("ThreadPublicationRevoked"));
});

test("primaryObject resolves threadPublication", () => {
  const publication = { id: "tpb_x" };
  assert.equal(primaryObject({ payload: { threadPublication: publication } }), publication);
});

// ---- validator ----

test("a well-formed ThreadPublished validates", () => {
  const result = validateEvents(logWith(publicationEvent("ThreadPublished")));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("a well-formed ThreadPublicationRevoked validates", () => {
  const result = validateEvents(logWith(
    publicationEvent("ThreadPublished"),
    publicationEvent("ThreadPublicationRevoked", { id: "tpb_test_2", action: "revoke" })
  ));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("note is optional and rides when present", () => {
  const result = validateEvents(logWith(
    publicationEvent("ThreadPublished", { note: "first public thread" })
  ));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

for (const field of ["action", "scope", "publishedAt", "publishedByParticipantId"]) {
  test(`ThreadPublished missing ${field} is rejected`, () => {
    const result = validateEvents(logWith(publicationEvent("ThreadPublished", {}, [field])));
    assert.equal(result.valid, false);
    assert.match(formatValidationErrors(result.errors), new RegExp(`ThreadPublished missing ${field}`));
  });
}

test("action must match the event type: ThreadPublished carrying revoke is rejected", () => {
  const result = validateEvents(logWith(publicationEvent("ThreadPublished", { action: "revoke" })));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /ThreadPublished action must be "publish"/);
});

test("action must match the event type: ThreadPublicationRevoked carrying publish is rejected", () => {
  const result = validateEvents(logWith(
    publicationEvent("ThreadPublicationRevoked", { id: "tpb_test_2", action: "publish" })
  ));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /ThreadPublicationRevoked action must be "revoke"/);
});

test("an unregistered scope is rejected (fail closed: only public-read exists today)", () => {
  const result = validateEvents(logWith(publicationEvent("ThreadPublished", { scope: "everyone" })));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /unsupported scope everyone/);
});

test("publication by an unknown participant is rejected", () => {
  const result = validateEvents(logWith(
    publicationEvent("ThreadPublished", { publishedByParticipantId: "par_ghost" })
  ));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /unknown participant par_ghost/);
});

test("publication of an unknown thread is rejected", () => {
  const result = validateEvents(logWith(publicationEvent("ThreadPublished", { threadId: "thd_ghost" })));
  assert.equal(result.valid, false);
});

// ---- projector ----

test("projector projects publication acts into threadPublications (both acts retained)", () => {
  const projection = projectEvents(logWith(
    publicationEvent("ThreadPublished"),
    publicationEvent("ThreadPublicationRevoked", { id: "tpb_test_2", action: "revoke" })
  ));
  const acts = Object.values(projection.threadPublications);
  assert.equal(acts.length, 2);
  assert.deepEqual(acts.map((a) => a.action).sort(), ["publish", "revoke"]);
});
