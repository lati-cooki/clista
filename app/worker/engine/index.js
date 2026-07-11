// Public surface of the ported ClisTa engine consumed by the ThreadDO and the
// parity test. The modules below are vendored verbatim from
// lati-club/ClisTa-Protocol (src/*.js); only integrity.js (crypto) and events.js
// (storage shell) were adapted for the Workers runtime — the projection and
// validation logic is unchanged, so state replays identically to the CLI.
const integrity = require("./integrity");
const projector = require("./projector");
const validator = require("./validator");
const events = require("./events");

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
