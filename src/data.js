// The concrete sample thread — "support-assistant beta" — that the cockpit
// renders. Ported verbatim from the design. (Phase 1 replaces this with state
// projected from the real ClisTa event log in a per-thread Durable Object.)

export const participants = [
  { initial: 'M', name: 'Maya', role: 'decision owner' },
  { initial: 'RL', name: 'Research Lead', role: 'analyst' },
  { initial: 'DL', name: 'Delivery Lead', role: 'implementer' },
  { initial: 'PR', name: 'Privacy Reviewer', role: 'challenger' },
];

export const nextSteps = [
  { n: '1', text: 'Stand up the redaction pipeline check against assumption asm_1.' },
  { n: '2', text: 'Enrol an opt-in cohort, capped at 12 agents.' },
  { n: '3', text: 'Run a 2-week beta on redacted sample tickets only.' },
  { n: '4', text: 'Re-identification audit gates any scope expansion.' },
];

export const evidence = [
  { id: 'evd_1', text: 'Median first-response time exceeded the service target for 3 consecutive weeks.', source: 'support_metrics', sourceType: 'internal dataset', conf: 0.87, hash: 'sha256:9f2a4c…e1b7', event: 'evt_1b8c', existed: true },
  { id: 'evd_2', text: 'A pilot cohort of 12 agents resolved redacted tickets 31% faster in a dry-run.', source: 'pilot_dryrun_2026q2', sourceType: 'experiment log', conf: 0.74, hash: 'sha256:3c7d10…a902', event: 'evt_2d41', existed: true },
  { id: 'evd_3', text: 'Privacy review flagged 3 ticket fields as re-identifying if left unredacted.', source: 'privacy_review_doc', sourceType: 'review document', conf: 0.91, hash: 'sha256:b81e55…7f3c', event: 'evt_3a9f', existed: true },
  { id: 'evd_4', text: 'Comparable orgs reported assistant drift on long threads without scoped context.', source: 'external_postmortems', sourceType: 'external citation', conf: 0.62, hash: 'sha256:0d44ab…11e9', event: 'evt_4e72', existed: false },
];

export const assumptions = [
  { id: 'asm_1', text: 'The redaction pipeline removes the 3 flagged fields before any ticket reaches the assistant.', sourceType: 'declared premise', event: 'evt_2d41', basis: 'declared, not derived — carries no evidence of its own' },
  { id: 'asm_2', text: 'The beta cohort stays opt-in; no customer-facing reply is sent without human approval.', sourceType: 'declared premise', event: 'evt_2e55', basis: 'declared, not derived — carries no evidence of its own' },
];

export const claims = [
  { id: 'clm_1', text: 'A scoped beta can run without exposing re-identifying fields.', from: 'evd_3 + asm_1', sourceType: 'interpretation', event: 'evt_3a9f' },
  { id: 'clm_2', text: 'A limited beta is likely to reduce first-response time for the cohort.', from: 'evd_1 + evd_2', sourceType: 'interpretation', event: 'evt_3b1c' },
  { id: 'clm_3', text: 'Unscoped rollout now carries drift risk a beta would surface early.', from: 'evd_4', sourceType: 'interpretation', event: 'evt_3c40' },
];

export const reviews = [
  { id: 'rev_1', who: 'Delivery Lead', verdict: 'approved · conditional', good: true, text: 'Scope is buildable inside the redaction pipeline. Sign-off conditional on asm_1 holding in production.' },
  { id: 'rev_2', who: 'Research Lead', verdict: 'approved', good: true, text: 'Evidence reviewed. Confidence on evd_4 is low and flagged as assumption-adjacent, not load-bearing.' },
];

export const risks = [
  { id: 'risk_1', text: 'Re-identification via ticket free-text', owner: 'Privacy Reviewer', trigger: 'any raw free-text field logged before the audit passes' },
  { id: 'risk_2', text: 'Assistant drift on long threads', owner: 'Delivery Lead', trigger: 'cohort thread length exceeds the scoped context window' },
];

export const auditDecided = [
  { t: 'thread.opened', id: 'evt_0a1f', actor: 'maya', ts: '06-18 09:14:02Z', sig: null },
  { t: 'evidence.added', id: 'evt_1b8c', actor: 'research_lead', ts: '06-18 09:31:47Z', sig: 'evidence' },
  { t: 'assumption.declared', id: 'evt_2d41', actor: 'delivery_lead', ts: '06-18 10:02:11Z', sig: null },
  { t: 'claim.made', id: 'evt_3a9f', actor: 'research_lead', ts: '06-18 10:48:33Z', sig: null },
  { t: 'objection.raised', id: 'evt_5b6d', actor: 'privacy_reviewer', ts: '06-19 14:20:09Z', sig: 'objection', note: 'privacy' },
  { t: 'review.submitted', id: 'evt_6c1e', actor: 'delivery_lead', ts: '06-20 11:05:52Z', sig: null },
  { t: 'decision.requested', id: 'evt_7f88', actor: 'maya', ts: '06-20 16:40:00Z', sig: null },
  { t: 'decision.recorded', id: 'evt_8a02', actor: 'maya', ts: '06-20 17:12:24Z', sig: 'decided', note: 'over objection' },
  { t: 'minority_report.filed', id: 'evt_9d3b', actor: 'privacy_reviewer', ts: '06-20 17:31:10Z', sig: null },
  { t: 'chain.validated', id: 'evt_a4ff', actor: 'protocol', ts: '06-20 17:31:12Z', sig: 'ok' },
];

export const auditDegraded = auditDecided.slice(0, 8).concat([
  { t: 'replay.diverged', id: 'evt_7c2a', actor: 'protocol', ts: '06-21 08:00:03Z', sig: 'fail', note: 'state mismatch' },
  { t: 'chain.replay_failed', id: 'evt_b900', actor: 'protocol', ts: '06-21 08:00:03Z', sig: 'fail' },
]);

export const threadsAll = [
  { id: 'th_8f3ac1', q: 'Should the support team run a limited assistant beta before broader rollout?', status: 'decided', owner: 'Maya', last: '2h ago', events: '10' },
  { id: 'th_2b07e9', q: 'Adopt vendor Atlas for encrypted log storage?', status: 'active', owner: 'Devon', last: '11m ago', events: '4' },
  { id: 'th_5c14aa', q: 'Deprecate the legacy CSV export endpoint?', status: 'degraded', owner: 'Priya', last: '1d ago', events: '7' },
  { id: 'th_9d62f0', q: 'Move the nightly batch to the new scheduler?', status: 'decided', owner: 'Sam', last: '3d ago', events: '12' },
  { id: 'th_0e41b7', q: 'Grant the assistant write access to the ticket store?', status: 'failed', owner: 'Maya', last: '5d ago', events: '9' },
  { id: 'th_7a33c8', q: 'Standardize incident severity levels org-wide?', status: 'active', owner: 'Lin', last: '6d ago', events: '3' },
];

export const composeTargets = [
  { v: '', label: '— select what this challenges —' },
  { v: 'clm_1', label: 'clm_1 · A scoped beta can run without exposing re-identifying fields' },
  { v: 'clm_2', label: 'clm_2 · A limited beta is likely to reduce first-response time' },
  { v: 'clm_3', label: 'clm_3 · Unscoped rollout carries drift risk' },
  { v: 'dec_4b9e2f', label: 'dec_4b9e2f · the decision itself' },
];

export const auditSigColors = {
  evidence: '#7f9cff',
  objection: '#d6a64a',
  decided: '#e8ebf2',
  ok: '#57c98a',
  fail: '#e0676d',
};
