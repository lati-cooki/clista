// The single source for the ClisTa event payloads a human can append. Both the
// Compose/Append screen and the cockpit's inline affordances build through here,
// so the nested participant id (which the server does NOT force — only the
// top-level actor_id) is minted correctly in exactly one place. A wrong nested id
// fails closed (422), so one builder = one place to get it right.

// Option vocabularies (mirror the engine's accepted values).
export const SEVERITIES = ['minor', 'major', 'blocking'];
export const STANCES = ['support', 'oppose', 'neutral'];
export const REVIEW_STATUSES = ['approve', 'approve_with_conditions', 'request_changes', 'reject'];
export const CONFIDENCE = [
  { v: 0.6, label: 'tentative' },
  { v: 0.75, label: 'working' },
  { v: 0.9, label: 'strong' },
];

// Object-id prefix per kind. The server mints the event_id; this is the nested
// object's id, client-minted (mirrors the engine's id convention).
export const ID_PREFIX = {
  objection: 'obj',
  assumption: 'asm',
  claim: 'clm',
  position: 'pos',
  decisionRequest: 'drq',
  review: 'rev',
  reviewTrigger: 'rvt',
};

export function rid(prefix) {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  return prefix + '_' + Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

const nowIso = () => new Date().toISOString();

// ── Pure per-kind builders ───────────────────────────────────────────────────
// Each returns { event_type, payload }. id/at default so callers may omit them;
// the nested participant id is always the joined actor.

// Mirrors the engine CLI's inferTargetType — the validator accepts exactly these
// types (claim/assumption/decisionRequest/position/evidence/thread). There is no
// "decision" target: a decision is challenged via its request (drq_*), never the
// decision record itself.
function inferTargetType(id) {
  if (!id) return undefined;
  if (id.startsWith('clm_')) return 'claim';
  if (id.startsWith('asm_')) return 'assumption';
  if (id.startsWith('drq_')) return 'decisionRequest';
  if (id.startsWith('pos_')) return 'position';
  if (id.startsWith('evd_')) return 'evidence';
  return 'thread';
}

export function buildObjection({ threadId, actorId, target, text, basis, id = rid(ID_PREFIX.objection), at = nowIso() }) {
  return {
    event_type: 'ObjectionRaised',
    payload: {
      objection: {
        id, object: 'objection', threadId, participantId: actorId,
        targetObjectId: target, targetObjectType: inferTargetType(target),
        text: (text || '').trim(), status: 'open', raisedAt: at,
        ...(basis ? { assumption: basis } : {}),
      },
    },
  };
}

export function buildAssumption({ threadId, actorId, text, confidence, id = rid(ID_PREFIX.assumption), at = nowIso() }) {
  return {
    event_type: 'AssumptionDeclared',
    payload: {
      assumption: {
        id, object: 'assumption', threadId, text: (text || '').trim(),
        status: 'active', confidence, declaredByParticipantId: actorId, declaredAt: at,
      },
    },
  };
}

export function buildClaim({ threadId, actorId, text, id = rid(ID_PREFIX.claim), at = nowIso() }) {
  return {
    event_type: 'ClaimCreated',
    payload: {
      claim: {
        id, object: 'claim', threadId, text: (text || '').trim(),
        status: 'proposed', createdByParticipantId: actorId, createdAt: at,
      },
    },
  };
}

export function buildPosition({ threadId, actorId, target, stance, reason, id = rid(ID_PREFIX.position), at = nowIso() }) {
  return {
    event_type: 'PositionTaken',
    payload: {
      position: {
        id, object: 'position', threadId, participantId: actorId,
        targetObjectId: target, targetObjectType: 'claim', stance,
        reason: (reason || '').trim(), takenAt: at,
      },
    },
  };
}

export function buildDecisionRequest({ threadId, actorId, proposal, refs, id = rid(ID_PREFIX.decisionRequest), at = nowIso() }) {
  const r = refs || {};
  return {
    event_type: 'DecisionRequestOpened',
    payload: {
      decisionRequest: {
        id, object: 'decisionRequest', threadId, proposal: (proposal || '').trim(), status: 'review',
        supportingEvidenceIds: r.evidence || [],
        supportingClaimIds: r.claims || [],
        supportingAssumptionIds: r.assumptions || [],
        objectionIds: r.objections || [],
        openedByParticipantId: actorId, openedAt: at,
      },
    },
  };
}

export function buildReview({ threadId, actorId, decisionRequestId, status, conditions, comment, id = rid(ID_PREFIX.review), at = nowIso() }) {
  const conds = (conditions || '').split('\n').map((c) => c.trim()).filter(Boolean);
  return {
    event_type: 'ReviewSubmitted',
    payload: {
      review: {
        id, object: 'review', threadId,
        decisionRequestId,
        reviewerParticipantId: actorId, status,
        conditions: conds, comment: (comment || '').trim(), reviewedAt: at,
      },
    },
  };
}

// Re-review trigger. The server (ThreadDO.append) auto-emits this when a
// post-decision objection lands on a decided thread; the decision stays in
// force, the thread flips to 're-review'. This client builder exists so the
// event vocabulary has one canonical shape (used by tests/tools) — the browser
// never appends ReviewTriggered directly.
export function buildReviewTrigger({ threadId, actorId, decisionRecordId, triggeringObjectionId, reason = 'post_decision_objection', id = rid(ID_PREFIX.reviewTrigger), at = nowIso() }) {
  return {
    event_type: 'ReviewTriggered',
    payload: {
      reviewTrigger: {
        id, object: 'reviewTrigger', threadId,
        decisionRecordId, triggeringObjectionId, reason,
        triggeredByParticipantId: actorId, triggeredAt: at,
      },
    },
  };
}

// Client-side guard — a fast local rejection mirroring the engine's rules, so the
// human sees the same reason the server would return without a round trip. Returns
// a reason string, or null when the draft passes. `text` is the recorded substance
// for every kind except position (reason) and review (comment), where it is optional.
export function guard(kind, { target, text, decisionRequest } = {}) {
  if (kind === 'objection' && !target) {
    return 'objection.target is required — every objection must attach to a claim or the decision. Append rejected; reasoning state unchanged.';
  }
  if (kind === 'position' && !target) {
    return 'position.target is required — a position attaches to the claim it stands on. Append rejected; reasoning state unchanged.';
  }
  if (kind === 'review' && !(decisionRequest && decisionRequest.id)) {
    return 'no open decision request to review — open one first. Append rejected; reasoning state unchanged.';
  }
  const textRequired = kind !== 'position' && kind !== 'review';
  if (textRequired && (text || '').trim().length < 12) {
    return `${kind}.text must state precisely what is recorded (min 12 chars). Append rejected; reasoning state unchanged.`;
  }
  return null;
}
