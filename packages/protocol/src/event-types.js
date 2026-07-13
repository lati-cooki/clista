// Canonical registry of every protocol event type.
//
// This is the SINGLE SOURCE OF TRUTH for which event types exist. The
// validator's `switch (event.event_type)` and the projector's
// `switch (eventType(event))` must each enumerate exactly this set — no more,
// no less. `test/event-type-registry.test.js` enforces that agreement by
// extracting both switches' case labels and asserting they equal this list.
//
// Why this exists: validator and projector historically drifted (a type added
// to one switch but not the other silently fell through — validator to a
// loud `unsupported event_type` error, projector to a silent `default: break`).
// That is the #40 / #45 fail-open class. Adding a new event type now forces
// three coordinated edits — this registry, the validator switch, and the
// projector switch — or the conformance test fails loudly. See issue #51.
//
// Maintenance: keep this array sorted and unique. When you add an event type,
// add it here AND to both switches.
const EVENT_TYPES = Object.freeze([
  "AdaptationReviewRecorded",
  "AlignmentCalculated",
  "AssumptionDeclared",
  "CapabilitySetDeclared",
  "ClaimCreated",
  "CompatibilityAcceptanceRecorded",
  "CompatibilityCheckRecorded",
  "CompatibilityDegradationRecorded",
  "CompatibilityFailureRecorded",
  "ContributionAttributed",
  "ContributionAttributionCorrected",
  "ContributionAttributionDisputed",
  "ContributionAttributionRevoked",
  "CrossThreadEvidence",
  "DecisionGateReviewRecommended",
  "DecisionMerged",
  "DecisionRequestOpened",
  "DecisionScored",
  "DelegatedActionRecorded",
  "DelegationExpired",
  "DelegationGranted",
  "DelegationRevoked",
  "DelegationViolationRecorded",
  "EvidenceCommitted",
  "EvidenceRequirementReviewRecommended",
  "ExecutionCompleted",
  "ExecutionFailed",
  "ExecutionRolledBack",
  "ExecutionStarted",
  "ExecutionViolationRecorded",
  "ExpectedOutcomeDeclared",
  "FederatedPacketRejected",
  "FederatedPacketVerified",
  "FederatedStateReferenceRecorded",
  "FederationBoundaryRecorded",
  "FederationContextDeclared",
  "FederationPeerRecorded",
  "GateRejectionRecorded",
  "GovernanceReviewRecommended",
  "InteroperabilityAcceptanceRecorded",
  "InteroperabilityCheckRecorded",
  "InteroperabilityFailureRecorded",
  "InteroperabilityProfileDeclared",
  "LearningDisputed",
  "LearningRecommendationRecorded",
  "LearningSignalDerived",
  "LearningSignalRecorded",
  "LearningViolationRecorded",
  "LessonRecorded",
  "MergeCompleted",
  "MergeConflictDeclared",
  "MergeConflictResolved",
  "MergeRequestOpened",
  "MergeReviewSubmitted",
  "MinorityReportFiled",
  "ModelPruned",
  "NegotiationConstraintDeclared",
  "NegotiationDegradationAccepted",
  "NegotiationDifferenceRecorded",
  "NegotiationFailureRecorded",
  "NegotiationRequested",
  "NegotiationTermsAccepted",
  "NegotiationTermsProposed",
  "NegotiationTermsRejected",
  "ObjectDeprecated",
  "ObjectionRaised",
  "ObjectionResolved",
  "OutcomeAudited",
  "OutcomeDisputed",
  "OutcomeEvaluated",
  "OutcomeExpected",
  "OutcomeObserved",
  "OutcomeReviewRecorded",
  "OutcomeViolationRecorded",
  "ParticipantAdded",
  "ParticipantAuthorityGranted",
  "ParticipantAuthorityRevoked",
  "ParticipantDeclared",
  "ParticipantRoleAssigned",
  "PatternObservationRecorded",
  "PositionTaken",
  "PrecedentReference",
  "ProtocolAmendmentApproved",
  "ProtocolAmendmentProposed",
  "ProtocolAmendmentRejected",
  "ProtocolAmendmentReviewed",
  "ProtocolAmendmentSuperseded",
  "PruningReviewInitiated",
  "RecoveryApplied",
  "RecoveryPlanCreated",
  "RecoveryQuarantined",
  "RecoveryRequested",
  "RecoveryVerified",
  "RecoveryViolationRecorded",
  "ReviewCompleted",
  "ReviewDisputed",
  "ReviewOpened",
  "ReviewRequired",
  "ReviewSubmitted",
  "ReviewTriggered",
  "ReviewViolationRecorded",
  "RevisitTriggerReviewRecommended",
  "SealedReport",
  "SemanticDegradationRecorded",
  "SemanticMappingRecorded",
  "ThreadCreated",
  "ThreadForked"
]);

// The M39 branch introduced the same registry under these names; both are
// public API (test/event-type-registry.test.js imports both spellings), so
// they alias the one canonical list rather than duplicating it.
const PROTOCOL_EVENT_TYPES = EVENT_TYPES;

// Dissent-bearing event types (T2b curation check,
// DR-2026-07-12-curation-check). A SealedReport must either claim-cite every
// earlier same-thread event of one of these types or disclose it in its
// omitted_dissent[] block with a reason — silent omission fails curation
// (src/report.js check 4).
//
// EXPLICIT ENUMERATION, deliberately: no wildcard/suffix matching happens at
// runtime. Every `*FailureRecorded` and `*ViolationRecorded` type in the
// registry above is listed by name; test/curation-check.test.js sweeps the
// registry for those suffixes at TEST time, so adding a new failure/violation
// event type forces a deliberate classification here or fails loudly — the
// same three-coordinated-edits discipline as the registry itself.
//
// Dispositions of dissent are themselves dissent-bearing: ObjectionResolved
// is listed deliberately, so a report that cites an objection but not its
// resolution fails curation — the disposition of dissent is part of the
// dissent (DR-2026-07-12-curation-check, Consequences).
//
// Maintenance: keep this array sorted and unique; every name must appear
// verbatim in EVENT_TYPES.
const DISSENT_BEARING_TYPES = Object.freeze([
  "CompatibilityFailureRecorded",
  "ContributionAttributionDisputed",
  "DelegationViolationRecorded",
  "ExecutionViolationRecorded",
  "GateRejectionRecorded",
  "InteroperabilityFailureRecorded",
  "LearningDisputed",
  "LearningViolationRecorded",
  "MinorityReportFiled",
  "NegotiationDifferenceRecorded",
  "NegotiationFailureRecorded",
  "NegotiationTermsRejected",
  "ObjectionRaised",
  "ObjectionResolved",
  "OutcomeDisputed",
  "OutcomeViolationRecorded",
  "PositionTaken",
  "RecoveryViolationRecorded",
  "ReviewDisputed",
  "ReviewViolationRecorded"
]);

const DISSENT_BEARING_TYPE_SET = new Set(DISSENT_BEARING_TYPES);

const EVENT_TYPE_SET = new Set(EVENT_TYPES);
const PROTOCOL_EVENT_TYPE_SET = EVENT_TYPE_SET;

function isKnownEventType(type) {
  return EVENT_TYPE_SET.has(type);
}


// The payload key holding each event primary domain object, in resolution
// order. This is the UNION of the keys validator.js and projector.js previously
// resolved separately (they had drifted: ~30 event types differed), so both now
// agree via one shared primaryObject (#51 phase 4). Order is immaterial in
// practice: every event carries at most one of these keys.
const PRIMARY_OBJECT_KEYS = Object.freeze([
  "thread",
  "threadFork",
  "participant",
  "participantRole",
  "participantAuthority",
  "participantAuthorityRevocation",
  "contributionAttribution",
  "attributionCorrection",
  "attributionDispute",
  "attributionRevocation",
  "learningSignal",
  "patternObservation",
  "outcomeReview",
  "learningRecommendation",
  "adaptationReview",
  "governanceReviewRecommendation",
  "evidenceRequirementReviewRecommendation",
  "revisitTriggerReviewRecommendation",
  "decisionGateReviewRecommendation",
  "protocolAmendment",
  "amendment",
  "protocolAmendmentReview",
  "amendmentReview",
  "protocolAmendmentApproval",
  "amendmentApproval",
  "protocolAmendmentRejection",
  "amendmentRejection",
  "protocolAmendmentSupersession",
  "amendmentSupersession",
  "evidence",
  "assumption",
  "claim",
  "position",
  "objection",
  "alignmentSnapshot",
  "decisionRequest",
  "review",
  "decisionRecord",
  "minorityReport",
  "mergeRequest",
  "mergeReview",
  "mergeConflict",
  "mergeConflictResolution",
  "mergeCompletion",
  "expectedOutcome",
  "outcomeAudit",
  "decisionScore",
  "executionRecord",
  "executionViolation",
  "outcomeRecord",
  "outcomeDispute",
  "outcomeViolation",
  "outcomeLearningSignal",
  "outcomeLesson",
  "outcomeLearningDispute",
  "outcomeLearningViolation",
  "protocolReview",
  "protocolReviewCompletion",
  "protocolReviewDispute",
  "protocolReviewViolation",
  "recoveryRequest",
  "recoveryPlan",
  "recoveryQuarantine",
  "recoveryApplication",
  "recoveryVerification",
  "recoveryViolation",
  "federationContext",
  "federationPeer",
  "federatedStateReference",
  "federatedPacketVerification",
  "federatedPacketRejection",
  "federationBoundary",
  "negotiationRequest",
  "negotiationConstraint",
  "negotiationDifference",
  "negotiationTerms",
  "negotiationFailure",
  "sealedReport",
  "precedentReference",
  "gateRejection"
]);

// The event primary domain object, or null. Faithful to the prior `||` chains
// (first truthy payload value, else null).
function primaryObject(event) {
  const payload = (event && event.payload) || {};
  for (const key of PRIMARY_OBJECT_KEYS) {
    if (payload[key]) {
      return payload[key];
    }
  }
  return null;
}

module.exports = {
  DISSENT_BEARING_TYPES,
  DISSENT_BEARING_TYPE_SET,
  EVENT_TYPES,
  EVENT_TYPE_SET,
  PRIMARY_OBJECT_KEYS,
  PROTOCOL_EVENT_TYPES,
  PROTOCOL_EVENT_TYPE_SET,
  isKnownEventType,
  primaryObject
};
