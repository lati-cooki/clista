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

    participants: parts.map((p) => ({ initial: initials(p.name), name: p.name, role: p.role })),

    decision: {
      id: dec.id || (r.decision && r.decision.id) || null,
      summary: dec.summary || (r.decision && r.decision.summary) || '',
      why: dec.rationale || r.rationale || '',
      conditions: dec.conditions || [],
      nextAction: dec.nextAction || r.next_action || '',
      status: dec.status || (r.decision && r.decision.status) || '',
    },

    objection: objection
      ? {
          id: objection.id,
          text: objection.text,
          who: nameOf(objection.participantId),
          role: roleOf(objection.participantId),
          survived: objection.status === 'preserved',
          status: objection.status,
        }
      : null,

    evidence: (r.evidence || []).map((e) => ({
      id: e.id,
      text: e.finding,
      source: e.source,
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

    // Compose targets: real claims + the decision itself.
    composeTargets: [
      { v: '', label: '— select what this challenges —' },
      ...(r.claims || []).map((c) => ({ v: c.id, label: `${c.id} · ${c.text}` })),
      ...(dec.id ? [{ v: dec.id, label: `${dec.id} · the decision itself` }] : []),
    ],
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
