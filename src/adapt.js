// Map the engine's projection (clista.threadState.v0 + audit + validate) onto the
// cockpit's view model. The projection is the source of truth; anything the UI
// shows is derived here, never invented.

const initials = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

// "2026-06-07T15:00:00.000Z" → "06-07 15:00:00Z"
const fmtTs = (iso) => (iso ? `${iso.slice(5, 10)} ${iso.slice(11, 19)}Z` : '');

const AUDIT_SIG = [
  [/evidence/i, 'evidence'],
  [/objection/i, 'objection'],
  [/decision(merged|recorded)/i, 'decided'],
  [/chain.*valid/i, 'ok'],
];
const sigFor = (type) => {
  for (const [re, sig] of AUDIT_SIG) if (re.test(type)) return sig;
  return null;
};

// The deliberation back-channel an attested contribution came in through, derived
// from the event's `source` string. clistahermes tags attestations by convention:
//   Raft:     "raft workspace <name> — message <id>"
//   moltbook: "moltbook u/clistahermes — reply comment <id>"
// Provenance only — never affects trust; just shows the human where input entered.
export function channelFromSource(source) {
  if (!source) return null;
  const s = String(source).toLowerCase();
  if (s.includes('raft')) return 'raft';
  if (s.includes('moltbook')) return 'moltbook';
  return null;
}

// A channel string ("raft", "moltbook", "raft+moltbook") → a friendly label for
// the live deliberation-status banner.
export function channelLabel(channel) {
  if (!channel) return null;
  const s = String(channel).toLowerCase();
  const raft = s.includes('raft');
  const molt = s.includes('moltbook');
  if (raft && molt) return 'Raft + moltbook';
  if (raft) return 'Raft';
  if (molt) return 'moltbook';
  return channel;
}

// Decision-rooted provenance tree (mirrors the engine's `provenance trace`):
// decision → its supporting claims → each claim's grounding evidence/assumptions
// and the objections targeting it. Built from projection links only.
function buildProvenance(r, dec) {
  const decisionId = dec.id || (r.decision && r.decision.id) || null;
  if (!decisionId) return null;
  const evById = Object.fromEntries((r.evidence || []).map((e) => [e.id, e]));
  const asmById = Object.fromEntries((r.assumptions || []).map((a) => [a.id, a]));
  const claimsById = Object.fromEntries((r.claims || []).map((c) => [c.id, c]));
  const objections = r.objections || [];
  const supportIds =
    dec.supportingClaimIds && dec.supportingClaimIds.length
      ? dec.supportingClaimIds
      : (r.claims || []).map((c) => c.id);
  const claims = supportIds
    .map((cid) => claimsById[cid])
    .filter(Boolean)
    .map((c) => ({
      id: c.id,
      text: c.text,
      status: c.status || '',
      evidence: (c.evidenceIds || []).map((id) => ({ id, text: (evById[id] || {}).finding || '', channel: channelFromSource((evById[id] || {}).source) })),
      assumptions: (c.assumptionIds || []).map((id) => ({ id, text: (asmById[id] || {}).text || '' })),
      objections: objections
        .filter((o) => o.targetObjectId === c.id)
        .map((o) => ({ id: o.id, text: o.text, status: o.status, survived: o.status === 'preserved' })),
    }));
  if (!claims.length) return null;
  return { decisionId, answer: dec.summary || (r.decision && r.decision.summary) || '', claims };
}

export function adaptCockpit(state, audit, validate) {
  const r = state.reasoningState || {};
  const ds = state.decisionStatus || {};
  const thread = state.thread || {};
  const parts = (state.identityState && state.identityState.participants) || [];
  const byId = Object.fromEntries(parts.map((p) => [p.id, p]));
  const nameOf = (id) => (byId[id] && byId[id].name) || id || 'unknown';
  const roleOf = (id) => (byId[id] && byId[id].role) || '';

  const dec = ds.decisionRecord || {};
  const integrityOk = !!(validate && validate.integrity && validate.integrity.valid);
  const validationOk = !!(validate && validate.validation && validate.validation.valid);
  const verified = integrityOk && validationOk;

  const objection = r.objections && r.objections[0];
  const minority = r.minority_reports && r.minority_reports[0];

  // Residual risks derived from preserved (surviving) objections.
  const risks = (r.objections || [])
    .filter((o) => o.status === 'preserved')
    .map((o) => ({
      id: o.id,
      text: o.assumption || 'Unretired objection carried forward',
      owner: nameOf(o.participantId),
      trigger: o.text,
    }));

  return {
    threadId: thread.id || null,
    title: thread.title || '',
    question: thread.question || '',
    opened: (thread.createdAt || '').slice(0, 10),
    status: thread.status || 'active',
    verified,

    participants: parts.map((p) => ({ id: p.id, initial: initials(p.name), name: p.name, role: p.role })),
    participantIds: parts.map((p) => p.id),

    decision: {
      id: dec.id || (r.decision && r.decision.id) || null,
      summary: dec.summary || (r.decision && r.decision.summary) || '',
      why: dec.rationale || r.rationale || '',
      conditions: dec.conditions || [],
      nextAction: dec.nextAction || r.next_action || '',
      status: dec.status || (r.decision && r.decision.status) || '',
      decidedAt: dec.decidedAt || '',
    },

    // Re-review: a post-decision objection flagged the in-force decision for
    // re-validation (thread.status === 're-review'). Surface the objection(s)
    // raised after the decision so the cockpit can explain WHY, and the owner
    // can open a new decision request to reaffirm or supersede.
    reReview:
      thread.status === 're-review'
        ? {
            decidedAt: dec.decidedAt || '',
            objections: (r.objections || [])
              .filter((o) => dec.decidedAt && o.raisedAt && Date.parse(o.raisedAt) >= Date.parse(dec.decidedAt))
              .map((o) => ({
                id: o.id,
                text: o.text,
                who: nameOf(o.participantId),
                role: roleOf(o.participantId),
                raisedAt: o.raisedAt,
                status: o.status,
                channel: channelFromSource(o.source),
              })),
          }
        : null,

    objection: objection
      ? {
          id: objection.id,
          text: objection.text,
          who: nameOf(objection.participantId),
          role: roleOf(objection.participantId),
          survived: objection.status === 'preserved',
          status: objection.status,
          channel: channelFromSource(objection.source),
        }
      : null,

    evidence: (r.evidence || []).map((e) => ({
      id: e.id,
      text: e.finding,
      source: e.source,
      channel: channelFromSource(e.source),
      conf: typeof e.confidence === 'number' ? e.confidence : null,
      hash: e.contentHash,
      sourceType: e.artifactIds && e.artifactIds.length ? `artifact · ${e.artifactIds.join(', ')}` : 'committed evidence',
      introducedBy: e.committedByParticipantId,
      committedAt: e.committedAt,
    })),

    assumptions: (r.assumptions || []).map((a) => ({
      id: a.id,
      text: a.text,
      sourceType: 'declared premise',
      introducedBy: a.declaredByParticipantId,
      basis: a.evidenceIds && a.evidenceIds.length ? `grounded in ${a.evidenceIds.join(', ')}` : 'declared, not derived — carries no evidence of its own',
    })),

    claims: (r.claims || []).map((c) => ({
      id: c.id,
      text: c.text,
      from: [...(c.evidenceIds || []), ...(c.assumptionIds || [])].join(' + ') || '—',
      sourceType: 'interpretation',
      introducedBy: c.createdByParticipantId,
    })),

    // Stances participants took on claims. Carries the channel badge so a
    // harvested A2A position (e.g. an owner's Raft "#all" reply attested as a
    // PositionTaken) shows its via-Raft / via-moltbook provenance, not just a
    // bare row in the audit chain.
    positions: (r.positions || []).map((p) => ({
      id: p.id,
      stance: p.stance || '',
      text: p.reason || p.statement || p.rationale || '',
      who: nameOf(p.participantId),
      role: roleOf(p.participantId),
      target: p.targetObjectId || '',
      source: p.source || '',
      channel: channelFromSource(p.source),
    })),

    reviews: (ds.reviews || []).map((rv) => ({
      id: rv.id,
      who: nameOf(rv.reviewerParticipantId),
      verdict: (rv.status || '').replace(/_/g, ' '),
      text: rv.comment || '',
    })),

    minority: minority
      ? { id: minority.id, text: minority.text, who: nameOf(minority.participantId), role: roleOf(minority.participantId) }
      : null,

    risks,

    provenance: buildProvenance(r, dec),

    audit: {
      count: (audit && audit.auditTrail && audit.auditTrail.length) || (validate && validate.event_count) || 0,
      validateOk: validationOk,
      replayOk: integrityOk,
      headHash: (validate && validate.head_hash) || null,
      events: ((audit && audit.auditTrail) || []).map((ev) => ({
        t: ev.event_type,
        id: ev.event_id,
        actor: ev.actor_id,
        ts: fmtTs(ev.timestamp),
        sig: sigFor(ev.event_type),
      })),
    },

    // Compose targets: real claims + the decision itself. The engine has no
    // "decision" target type — challenging the decision attaches to its request
    // (drq_*), so that entry carries the decisionRequestId, labeled as the decision.
    composeTargets: [
      { v: '', label: '— select what this challenges —' },
      ...(r.claims || []).map((c) => ({ v: c.id, label: `${c.id} · ${c.text}` })),
      ...(dec.id && dec.decisionRequestId
        ? [{ v: dec.decisionRequestId, label: `${dec.id} · the decision itself` }]
        : []),
    ],

    // Reference lists for the Compose pickers (position target, decision-request
    // support sets, review target). Each is { id, text } drawn from the projection.
    refLists: {
      claims: (r.claims || []).map((c) => ({ id: c.id, text: c.text })),
      evidence: (r.evidence || []).map((e) => ({ id: e.id, text: e.finding })),
      assumptions: (r.assumptions || []).map((a) => ({ id: a.id, text: a.text })),
      objections: (r.objections || []).map((o) => ({ id: o.id, text: o.text })),
    },
    // The open decision request a review attaches to (latest opened, if any),
    // carrying the support sets + the reviews on it so the decision owner can
    // record (merge) the decision from the cockpit.
    decisionRequest: state.currentProposal
      ? {
          id: state.currentProposal.id,
          proposal: state.currentProposal.proposal,
          status: state.currentProposal.status,
          openedAt: state.currentProposal.openedAt || '',
          supportingClaimIds: state.currentProposal.supportingClaimIds || [],
          supportingEvidenceIds: state.currentProposal.supportingEvidenceIds || [],
          supportingAssumptionIds: state.currentProposal.supportingAssumptionIds || [],
          objectionIds: state.currentProposal.objectionIds || [],
          reviewIds: (ds.reviews || [])
            .filter((rv) => rv.decisionRequestId === state.currentProposal.id)
            .map((rv) => rv.id),
        }
      : null,
  };
}

// "2026-06-07T..." → "15d ago" (compact relative time for the index).
export function relativeTime(iso) {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
