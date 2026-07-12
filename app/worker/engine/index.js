// Public surface of the ClisTa engine consumed by the ThreadDO and the parity
// test. DE-VENDORED 2026-07-12 (monorepo cutover item 3): the modules below are
// imported DIRECTLY from the in-repo protocol package — the same files the
// protocol's own test suite runs against — instead of vendored copies.
// Provenance is the monorepo commit itself; there is no drift to check.
//
// Runtime notes:
// - integrity.js hashes via node:crypto.createHash (synchronous) — available
//   in workerd under the nodejs_compat flag (wrangler.jsonc), byte-identical
//   to the js-sha256 port it replaces (test/engine-parity.test.js proves the
//   fixture chain still replays).
// - events.js imports node:fs/node:path for its CLI store I/O; the worker
//   bundles them (nodejs_compat) but only ever calls the pure builders
//   (createEvent, createParticipant, newId, nowIso). The DO's SQLite log is
//   the store here; nothing in the worker reads or writes .clista/.
const integrity = require("../../../packages/protocol/src/integrity.js");
const projector = require("../../../packages/protocol/src/projector.js");
const validator = require("../../../packages/protocol/src/validator.js");
const events = require("../../../packages/protocol/src/events.js");

module.exports = {
  // versions
  PROTOCOL_VERSION: integrity.PROTOCOL_VERSION,
  EVENT_HASH_VERSION: integrity.EVENT_HASH_VERSION,
  // integrity / hash chain
  prepareEventForAppend: integrity.prepareEventForAppend,
  chainEvents: integrity.chainEvents,
  computeEventHash: integrity.computeEventHash,
  verifyEventIntegrity: integrity.verifyEventIntegrity,
  serializeEventsNdjson: integrity.serializeEventsNdjson,
  stableStringify: integrity.stableStringify,
  // projection
  projectEvents: projector.projectEvents,
  selectThreadState: projector.selectThreadState,
  selectDecisionSummary: projector.selectDecisionSummary,
  selectAudit: projector.selectAudit,
  exportProtocol: projector.exportProtocol,
  // validation (validate-before-trust, fail-closed)
  validateEvents: validator.validateEvents,
  assertValidEvents: validator.assertValidEvents,
  ValidationError: validator.ValidationError,
  formatValidationErrors: validator.formatValidationErrors,
  // event builders
  createEvent: events.createEvent,
  createParticipant: events.createParticipant,
  newId: events.newId,
  nowIso: events.nowIso
};
