#!/usr/bin/env node
// generate-founding-thread.js — emit the Hub's own founding architecture
// decision as a ClisTa Protocol event log (threads/founding-architecture.ndjson).
//
// Dogfood rule: Thread Hub's first real thread is the decision to build
// Thread Hub the way it is built. The log is authored with the protocol
// repo's own integrity tooling so every content_hash and the
// previous_hash chain validate under `clista validate`, not a lookalike.
//
// Deterministic on purpose: fixed ids and timestamps, so regenerating
// produces byte-identical output and the committed NDJSON is auditable.
//
// Usage: node scripts/generate-founding-thread.js [path-to-clista-protocol]
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const PROTO = process.argv[2]
  ?? process.env.CLISTA_PROTOCOL_DIR
  ?? path.join(process.env.HOME, 'ClisTa-Protocol');
const { contentHash, chainEvents } = require(path.join(PROTO, 'src/integrity.js'));

const THREAD = 'thd_threadhub_founding';
const T = (m, s = 0) =>
  new Date(Date.UTC(2026, 5, 10, 21, m, s)).toISOString(); // build night, 2026-06-10

// Inner protocol objects carry their own contentHash, computed over the
// object without the hash field — same convention as the event envelope.
const withHash = (obj) => ({ ...obj, contentHash: contentHash(obj) });

const ev = (n, type, actor, payload, minute) => ({
  event_id: `evt_thf_${String(n).padStart(3, '0')}`,
  event_type: type,
  thread_id: THREAD,
  actor_id: actor,
  timestamp: T(minute),
  payload,
});

const events = [
  ev(1, 'ParticipantAdded', 'par_troy', {
    participant: { id: 'par_troy', object: 'participant', kind: 'human', name: 'Troy', role: 'decision owner' },
  }, 0),

  ev(2, 'ParticipantAdded', 'par_fable', {
    participant: { id: 'par_fable', object: 'participant', kind: 'agent', name: 'Fable', role: 'architect / builder' },
  }, 0),

  ev(3, 'ThreadCreated', 'par_troy', {
    thread: {
      id: THREAD, object: 'thread',
      title: 'Thread Hub founding architecture',
      question: 'What substrate guarantees make Thread Hub the canonical home for ClisTa Protocol threads?',
      status: 'active',
      participantIds: ['par_troy', 'par_fable'],
      createdAt: T(1), updatedAt: T(1),
    },
  }, 1),

  ev(4, 'EvidenceCommitted', 'par_fable', {
    evidence: withHash({
      id: 'evd_working_build', object: 'evidence', threadId: THREAD,
      source: 'threadhub v0.1.0 build',
      finding: 'A zero-dependency Node 22 implementation (ed25519 + SQLite built-ins) holds signed, hash-chained, content-addressed records with 10/10 moat-claim tests passing: tamper detection, forged-signature detection, DB-level append-only, hash-only attestation with zero content leakage, portable verification.',
      confidence: 0.95,
      committedByParticipantId: 'par_fable',
      committedAt: T(2),
      artifactIds: ['art_threadhub_v0_1_0'],
    }),
  }, 2),

  ev(5, 'EvidenceCommitted', 'par_fable', {
    evidence: withHash({
      id: 'evd_clista_roundtrip', object: 'evidence', threadId: THREAD,
      source: 'fixtures/events.ndjson — the real first ClisTa Protocol thread',
      finding: 'The actual first ClisTa thread ingests as clista.event records and round-trips losslessly: exported payloads are deep-equal to the original NDJSON events. Thread Hub is ClisTa-native, not ClisTa-adjacent.',
      confidence: 0.95,
      committedByParticipantId: 'par_fable',
      committedAt: T(3),
      artifactIds: ['art_clista_first_thread'],
    }),
  }, 3),

  ev(6, 'AssumptionDeclared', 'par_troy', {
    assumption: withHash({
      id: 'asm_state_is_moat', object: 'assumption', threadId: THREAD,
      text: 'Implementation is collapsing toward free; accumulated, verifiable state is not. Every clever feature is one-shottable by the next model; a substrate that holds records reliably is not. Boring is the strategy.',
      status: 'active',
      evidenceIds: ['evd_working_build'],
      confidence: 0.85,
      declaredByParticipantId: 'par_troy',
      declaredAt: T(4),
    }),
  }, 4),

  ev(7, 'ClaimCreated', 'par_fable', {
    claim: {
      id: 'clm_self_verifying_records', object: 'claim', threadId: THREAD,
      text: 'Records must self-verify with nothing but the records: recompute each content address, check the prev-hash chain, check each ed25519 signature against the embedded public key. Instances are hosting, not authority; the content hash is the permanent citation address and /t/slug is convenience. This is what lets a self-hosted instance and a canonical public instance coexist.',
      status: 'endorsed',
      evidenceIds: ['evd_working_build', 'evd_clista_roundtrip'],
      contradictingEvidenceIds: [],
      createdByParticipantId: 'par_fable',
      createdAt: T(5),
      assumptionIds: ['asm_state_is_moat'],
    },
  }, 5),

  ev(8, 'ClaimCreated', 'par_fable', {
    claim: {
      id: 'clm_custodial_keys_v1', object: 'claim', threadId: THREAD,
      text: 'v1 keystore is custodial: writer private keys live in the hub database so human writers never touch key material. Identity is keys, reputation is the canonical instance; the record format does not know or care, so non-custodial submission stays open as the self-host path.',
      status: 'endorsed',
      evidenceIds: ['evd_working_build'],
      contradictingEvidenceIds: [],
      createdByParticipantId: 'par_fable',
      createdAt: T(6),
      assumptionIds: ['asm_state_is_moat'],
    },
  }, 6),

  ev(9, 'ObjectionRaised', 'par_fable', {
    objection: {
      id: 'obj_custodial_trust_concession', object: 'objection', threadId: THREAD,
      participantId: 'par_fable',
      targetObjectId: 'clm_custodial_keys_v1',
      targetObjectType: 'claim',
      assumption: 'Writer adoption requires that onboarding a human writer involves zero key ceremony — Darrell must never touch key material.',
      text: 'Custodial keys are a trust concession: the hub operator holds writer private keys and could sign records as any custodial writer. Signatures from custodial identities therefore prove the hub vouched for authorship, not that the writer authored. This is accepted deliberately as the price of writer adoption, and only tolerable if a non-custodial pre-signed submission path ships so self-hosters and agents can hold their own keys.',
      status: 'open',
      raisedAt: T(7),
    },
  }, 7),

  ev(10, 'DecisionRequestOpened', 'par_fable', {
    decisionRequest: {
      id: 'drq_founding_architecture', object: 'decisionRequest', threadId: THREAD,
      proposal: 'Adopt the five founding decisions: (1) records self-verify, instances are hosting not authority; (2) two-layer addressing — content hash permanent, slug convenience; (3) identity = keys with custodial v1, reputation = canonical instance; (4) federation = selective publication starting with hash-only attestation, no sync protocol in v1; (5) no viewer investment until three writers exist.',
      status: 'review',
      supportingEvidenceIds: ['evd_working_build', 'evd_clista_roundtrip'],
      supportingClaimIds: ['clm_self_verifying_records', 'clm_custodial_keys_v1'],
      objectionIds: ['obj_custodial_trust_concession'],
      openedByParticipantId: 'par_fable',
      openedAt: T(8),
      supportingAssumptionIds: ['asm_state_is_moat'],
    },
  }, 8),

  ev(11, 'ReviewSubmitted', 'par_troy', {
    review: {
      id: 'rev_troy_founding', object: 'review', threadId: THREAD,
      decisionRequestId: 'drq_founding_architecture',
      reviewerParticipantId: 'par_troy',
      status: 'approve_with_conditions',
      conditions: [
        'Non-custodial pre-signed submission path is the next build task, not a someday item',
        'No viewer, reputation, federation-sync, or auth-UI work until three writers exist',
        'Every new guarantee ships as a test or it does not exist',
      ],
      comment: 'Approved. The custodial objection is real and stays on the record; it is traded for writer adoption, not waved away.',
      reviewedAt: T(9),
    },
  }, 9),

  ev(12, 'DecisionMerged', 'par_troy', {
    decisionRecord: withHash({
      id: 'dcr_founding_architecture', object: 'decisionRecord', threadId: THREAD,
      decisionRequestId: 'drq_founding_architecture',
      status: 'approved',
      summary: 'Thread Hub is built as a signed, hash-chained, content-addressed record substrate: self-verifying records, two-layer addressing, key-based identity with custodial v1, attestation-first federation, and deliberate viewer austerity.',
      rationale: 'Protocol open, gravity proprietary — git : GitHub :: ClisTa : Thread Hub. The moat is accumulated verifiable state, not features. Verification must be a pure function of the records so hosting never becomes authority and trusted:false never escalates.',
      conditions: [
        'Ship POST /t/:slug/records/signed (client-held keys) next',
        'Out of scope until three writers: viewer features, reputation graph, federation sync, auth UI',
        'Append-only stays enforced at the database layer, not in calling code',
      ],
      supportingEvidenceIds: ['evd_working_build', 'evd_clista_roundtrip'],
      supportingClaimIds: ['clm_self_verifying_records', 'clm_custodial_keys_v1'],
      preservedObjectionIds: ['obj_custodial_trust_concession'],
      minorityReportIds: ['mnr_custodial_trust'],
      nextAction: 'Ingest this log as the hub’s own thread #1, then build the non-custodial write path.',
      decidedByParticipantId: 'par_troy',
      decidedAt: T(10),
      supportingAssumptionIds: ['asm_state_is_moat'],
    }),
  }, 10),

  ev(13, 'MinorityReportFiled', 'par_fable', {
    minorityReport: withHash({
      id: 'mnr_custodial_trust', object: 'minorityReport', threadId: THREAD,
      decisionRecordId: 'dcr_founding_architecture',
      participantId: 'par_fable',
      text: 'Custodial v1 means hub signatures attest custody, not authorship. Until the non-custodial path exists and writers who care use it, no custodial record should be cited as cryptographic proof that a specific human wrote it — only that the hub recorded it under their identity. This report is preserved so the concession is never silently forgotten.',
      objectionIds: ['obj_custodial_trust_concession'],
      filedAt: T(11),
    }),
  }, 11),
];

const chained = chainEvents(events);
const out = path.join(__dirname, '..', 'threads', 'founding-architecture.ndjson');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, chained.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
console.log(`wrote ${chained.length} events -> ${out}`);
