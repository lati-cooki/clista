// Re-review notification helpers (issue #21). Pure module — no cloudflare:*
// imports — so the node test suite can exercise owner resolution and the alert
// path with a fake env. The router (worker/index.js) is the only caller.

// Resolve the CURRENT decision owner of a thread from its projected identity
// state: the latest ACTIVE decision_owner authority that applies to the thread.
// Grants and revocations replay in event order, so after an owner transfer
// (ParticipantAuthorityRevoked + ParticipantAuthorityGranted) this resolves to
// the new holder — NOT the frozen decisionRecord.decidedByParticipantId, and
// not the index card's display name. Returns the participant record (carrying
// name/email when declared) or null when no active authority exists.
export function currentDecisionOwner(state, threadId) {
  const identity = state && state.identityState;
  if (!identity) return null;
  const applicable = (identity.activeAuthorities || []).filter(
    (a) => a.authority === 'decision_owner' && (a.scope === 'global' || a.threadId === threadId)
  );
  const holder = applicable[applicable.length - 1];
  if (!holder) return null;
  const participant = (identity.participants || []).find((p) => p.id === holder.participantId);
  return participant || { id: holder.participantId };
}

// The alert message for a re-review flip, as a send_email-binding payload.
// Plain text only — this is an operational notification, not marketing.
export function buildReReviewEmail(owner, card, trigger, { from, appOrigin = 'https://app.clista.ai' } = {}) {
  const threadId = (trigger && trigger.threadId) || (card && card.id) || '';
  const title = (card && (card.title || card.question)) || threadId || 'a decision thread';
  const lines = [
    `A decision you own was flipped to re-review.`,
    ``,
    `Thread: ${title}`,
    `Decision record: ${(trigger && trigger.decisionRecordId) || 'unknown'}`,
    `Triggering objection: ${(trigger && trigger.triggeringObjectionId) || 'unknown'} (raised by ${(trigger && trigger.triggeredByParticipantId) || 'unknown'})`,
    ``,
    `The decision record itself is unchanged and still in force — the thread status`,
    `flipped to re-review because a post-decision objection landed on it. Review the`,
    `objection and either resolve it or open a new decision request to supersede.`,
    ``,
    `${appOrigin}/#${threadId}`,
  ];
  return {
    to: owner.email,
    from,
    subject: `ClisTa re-review: ${title}`,
    text: lines.join('\n'),
  };
}

// Best-effort external alert: fires only when BOTH a send_email binding
// (env.EMAIL) is configured AND the resolved owner declared an email at
// participation. Never throws — alerting must never fail the append that
// triggered it. Returns true only when the send succeeded.
export async function sendReReviewAlert(env, owner, card, trigger) {
  if (!env || !env.EMAIL || !owner || !owner.email) return false;
  const from = { email: env.EMAIL_FROM || 'notify@clista.ai', name: 'ClisTa' };
  try {
    await env.EMAIL.send(buildReReviewEmail(owner, card, trigger, { from }));
    return true;
  } catch {
    return false;
  }
}
