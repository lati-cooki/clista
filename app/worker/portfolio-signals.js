// Pure health-signal derivation for the Portfolio dashboard. No engine, no DO:
// callers pass an already-projected `state` (ThreadDO.indexCard) or stored `rows`
// (IndexDO.portfolio). Kept pure so it unit-tests under plain `node --test`.

export const OVERDUE_DAYS = 7;
const DAY_MS = 86400000;
const STAGES = ['active', 'in_review', 'decided', 'decided_with_conditions', 're_review', 'degraded', 'failed'];
const ATTENTION = ['re_review', 'contested', 'overdue', 'unevidenced', 'with_conditions'];

// Raw thread status -> lifecycle stage enum (does not account for conditions).
export function statusToStage(status) {
  switch (status) {
    case 'failed': return 'failed';
    case 'degraded': return 'degraded';
    case 're-review': return 're_review';
    case 'decided': return 'decided';
    case 'review': return 'in_review';
    default: return 'active';
  }
}

// Lifecycle stage from the projected thread status (+ conditions splits decided).
export function deriveStage(state) {
  const status = (state.thread && state.thread.status) || 'active';
  const stage = statusToStage(status);
  if (stage === 'decided') {
    const d = state.decisionStatus && state.decisionStatus.decisionRecord;
    return d && Array.isArray(d.conditions) && d.conditions.length > 0 ? 'decided_with_conditions' : 'decided';
  }
  return stage;
}

// Time-invariant signals (staleness/overdue are computed at read, see computeTiming).
export function deriveSignals(state, { chainValid }) {
  const stage = deriveStage(state);
  const claims = state.claims || [];
  const decision = state.decisionStatus && state.decisionStatus.decisionRecord;
  return {
    stage,
    open_objections: (state.unresolvedObjections || []).length,
    evidence_count: (state.allEvidence || []).length,
    claims_total: claims.length,
    claims_grounded: claims.filter((c) => (c.evidenceIds || []).length > 0).length,
    outstanding_conditions: decision && Array.isArray(decision.conditions) ? decision.conditions.length : 0,
    re_review: stage === 're_review',
    chain_valid: chainValid,
  };
}

// Full index card: the lite fields (mirrors the pre-existing indexCard) + signals.
export function buildCard(state, { chainValid, eventCount, lastTimestamp }) {
  const thread = state.thread || {};
  const participants = (state.identityState && state.identityState.participants) || [];
  const decision = state.decisionStatus && state.decisionStatus.decisionRecord;
  const ownerId =
    (decision && decision.decidedByParticipantId) ||
    (participants.find((p) => /owner/.test(p.role || '')) || participants[0] || {}).id;
  const ownerName = (participants.find((p) => p.id === ownerId) || {}).name || ownerId || 'unknown';
  const last = lastTimestamp || thread.updatedAt || null;
  return {
    id: thread.id || null,
    title: thread.title || null,
    question: thread.question || null,
    status: thread.status || 'active',
    owner: ownerName,
    events: eventCount,
    last,
    updated_ms: last ? Date.parse(last) : 0,
    ...deriveSignals(state, { chainValid }),
  };
}

// Read-time timing: staleness is a function of "now", so it is never stored.
export function computeTiming(stage, updatedMs, nowMs) {
  const staleness_days = updatedMs ? Math.max(0, (nowMs - updatedMs) / DAY_MS) : null;
  const overdue = stage === 'in_review' && staleness_days != null && staleness_days > OVERDUE_DAYS;
  return { staleness_days, overdue };
}

// Attention triggers a card trips, in rank order.
export function deriveAttention(card) {
  const t = [];
  if (card.re_review) t.push('re_review');
  if ((card.open_objections || 0) > 0) t.push('contested');
  if (card.overdue) t.push('overdue');
  if (['in_review', 'decided', 'decided_with_conditions'].includes(card.stage) && card.claims_grounded === 0) t.push('unevidenced');
  if ((card.outstanding_conditions || 0) > 0) t.push('with_conditions');
  return t;
}

export function summarize(cards) {
  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0]));
  const attention = Object.fromEntries(ATTENTION.map((a) => [a, 0]));
  let allChainValid = true;
  for (const c of cards) {
    if (byStage[c.stage] != null) byStage[c.stage] += 1;
    for (const a of c.attention || []) attention[a] += 1;
    if (c.chain_valid === false) allChainValid = false;
  }
  return { total: cards.length, byStage, attention, allChainValid };
}

// Stored rows -> the wire shape the Portfolio screen consumes. Normalizes the
// SQLite integer booleans and adds read-time timing + attention.
export function assemblePortfolio(rows, nowMs) {
  const threads = rows.map((r) => {
    const stage = r.stage || statusToStage(r.status);
    const { staleness_days, overdue } = computeTiming(stage, r.updated_ms || 0, nowMs);
    const card = {
      ...r,
      stage,
      re_review: !!r.re_review,
      chain_valid: r.chain_valid == null ? null : !!r.chain_valid,
      staleness_days,
      overdue,
    };
    return { ...card, attention: deriveAttention(card) };
  });
  return { summary: summarize(threads), threads };
}
