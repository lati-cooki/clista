// PrecedentReference (DR-2026-07-12 precedent-as-citation). A reuse of a
// prior conclusion is witnessed as a tagged citation: the HOLDING travels;
// the rationale does not — the shape has no rationale field, and the
// validator rejects one outright (transplant is unrepresentable, not
// discouraged). Context discipline is carried by hashes of DECLARED
// decision-relevant context, so a verifier can recompute them.
const assert = require("node:assert/strict");
const test = require("node:test");

const { chainEvents, contentHash } = require("../src/integrity");
const { formatValidationErrors, validateEvents } = require("../src/validator");
const { projectEvents } = require("../src/projector");

const THREAD = "thd_precedent_test";
const SOURCE_HASH = `sha256:${"ab".repeat(32)}`;

function baseEvents() {
  return [
    {
      event_id: "evt_participant_reuser",
      event_type: "ParticipantAdded",
      thread_id: THREAD,
      actor_id: "par_reuser",
      timestamp: "2026-07-12T00:00:00.000Z",
      payload: {
        participant: { id: "par_reuser", object: "participant", kind: "agent", name: "reuser", role: "writer" }
      }
    },
    {
      event_id: "evt_thread_created",
      event_type: "ThreadCreated",
      thread_id: THREAD,
      actor_id: "par_reuser",
      timestamp: "2026-07-12T00:00:01.000Z",
      payload: {
        thread: {
          id: THREAD,
          object: "thread",
          title: "precedent test",
          question: "may we lean on the prior holding?",
          status: "active",
          participantIds: ["par_reuser"],
          createdAt: "2026-07-12T00:00:01.000Z",
          updatedAt: "2026-07-12T00:00:01.000Z"
        }
      }
    }
  ];
}

function precedentPayload(overrides = {}) {
  return {
    precedentReference: {
      id: "pre_test_1",
      object: "precedentReference",
      threadId: THREAD,
      sourceThreadId: "thd_original_decision",
      sourceEventHash: SOURCE_HASH,
      sourceDecisionRecordId: "dcr_original_1",
      holding: "annual-cycle revalidation is sufficient for a stable-population PD model",
      contextHash: contentHash({ psi: 0.08, auc: 0.82, monthsSinceValidation: 8, regime: "stable" }),
      sourceContextHash: contentHash({ psi: 0.08, auc: 0.82, monthsSinceValidation: 8, regime: "stable" }),
      precedentDate: "2026-07-10T23:29:00.000Z",
      reusedAt: "2026-07-12T00:00:02.000Z",
      regrounding: "templated_precedent",
      reusedByParticipantId: "par_reuser",
      ...overrides
    }
  };
}

function logWithPrecedent(overrides = {}, removals = []) {
  const payload = precedentPayload(overrides);
  for (const key of removals) {
    delete payload.precedentReference[key];
  }
  return chainEvents([
    ...baseEvents(),
    {
      event_id: "evt_precedent_1",
      event_type: "PrecedentReference",
      thread_id: THREAD,
      actor_id: "par_reuser",
      timestamp: "2026-07-12T00:00:02.000Z",
      payload
    }
  ]);
}

test("a well-formed PrecedentReference validates", () => {
  const result = validateEvents(logWithPrecedent());
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("sourceContextHash is optional (fail-open systems may not have one — they recompute)", () => {
  const result = validateEvents(logWithPrecedent({}, ["sourceContextHash"]));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

test("sourceDecisionRecordId is optional (the holding need not be a decision)", () => {
  const result = validateEvents(logWithPrecedent({}, ["sourceDecisionRecordId"]));
  assert.deepEqual(result, { valid: true, errors: [] }, formatValidationErrors(result.errors));
});

for (const field of ["sourceThreadId", "sourceEventHash", "holding", "contextHash", "precedentDate", "reusedAt"]) {
  test(`PrecedentReference missing ${field} is rejected`, () => {
    const result = validateEvents(logWithPrecedent({}, [field]));
    assert.equal(result.valid, false);
    assert.match(formatValidationErrors(result.errors), new RegExp(`PrecedentReference missing ${field}`));
  });
}

test("a rationale field is rejected outright — holdings travel, rationale does not", () => {
  const result = validateEvents(logWithPrecedent({ rationale: "the original context showed no degradation" }));
  assert.equal(result.valid, false);
  assert.match(
    formatValidationErrors(result.errors),
    /PrecedentReference must not carry a rationale — cite the holding, re-ground against the live context/
  );
});

test("sourceRationale is rejected the same way", () => {
  const result = validateEvents(logWithPrecedent({ sourceRationale: "verbatim prior justification" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference must not carry a rationale/);
});

test("malformed contextHash is rejected", () => {
  const result = validateEvents(logWithPrecedent({ contextHash: "not-a-hash" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference contextHash is not a sha256 hash/);
});

test("malformed sourceEventHash is rejected", () => {
  const result = validateEvents(logWithPrecedent({ sourceEventHash: "sha1:abcd" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference sourceEventHash is not a sha256 hash/);
});

test("unknown regrounding mode is rejected", () => {
  const result = validateEvents(logWithPrecedent({ regrounding: "verbatim" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference unsupported regrounding verbatim/);
});

test("missing regrounding is rejected", () => {
  const result = validateEvents(logWithPrecedent({}, ["regrounding"]));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference missing regrounding/);
});

test("reuse by an unknown participant is rejected", () => {
  const result = validateEvents(logWithPrecedent({ reusedByParticipantId: "par_ghost" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /precedentReference reused by unknown participant par_ghost/);
});

test("reusedAt before precedentDate is rejected — age must be non-negative", () => {
  const result = validateEvents(logWithPrecedent({ reusedAt: "2026-07-09T00:00:00.000Z" }));
  assert.equal(result.valid, false);
  assert.match(formatValidationErrors(result.errors), /PrecedentReference reusedAt precedes precedentDate/);
});

test("projector surfaces precedent references; they do NOT register as evidence", () => {
  const projection = projectEvents(logWithPrecedent());
  const refs = Object.values(projection.precedentReferences);
  assert.equal(refs.length, 1);
  assert.equal(refs[0].id, "pre_test_1");
  assert.equal(refs[0].holding, "annual-cycle revalidation is sufficient for a stable-population PD model");
  assert.deepEqual(Object.values(projection.evidence), [], "a precedent citation is not evidence");
});
