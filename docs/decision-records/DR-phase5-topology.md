# Decision Record: Phase 5 Topology — One Witnessed Stack

> **Provenance:** clista@a1cea18545756ed876c25aca7cc67c8e7c8e6b96 · prompt-studio@8788709c120fd87db4d9093d59cd94251cb5ff2e

**Status:** APPROVED — owner challenge pass 2026-07-12, four objections
resolved by pre-seal amendment (see Amendments); sealing through the studio
seal flow in progress; on seal this section records the slug/hash and flips
to ADOPTED. Originally an agent-authored draft without a separate challenge
pass — disclosed, per the 2026-07-10 monorepo precedent; the owner checkpoint
was named as the challenge gate for this record, and that gate has now run.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** `lati-cooki/clista` (packages/protocol, packages/threadhub,
docs), `lati-cooki/prompt-studio`, and — mapping only until Phase 6 —
`clista-octopus-swarm`
**Evidence base:** `docs/new/mutual-reliance-proposal.md` §3 Commitments 1
and 4; T1 sealed run
`packages/protocol/runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/`;
`docs/decision-records/FINDINGS-T1-T2.md`; the swarm's
`DR-hive-mind-cache-integrity.md` (root of `clista-octopus-swarm`)

---

## Decision Question

Phase 5 binds four workstreams — prompt-studio, the clista protocol,
ThreadHub, and (in Phase 6) the octopus swarm — into one witnessed stack.
Today each workstream carries its own store, its own event names, and its own
implicit answer to "where does the record of record live." That is the
canonical-source ambiguity of DR-2026-07-08 reproduced one level down: not
two repos claiming to be the documentation source, but four systems claiming,
by default, to be the record source. What is the binding topology — where do
sealed records accumulate, which artifacts derive from which, how do three
emitters share one event ontology, what do anchors prove, and who holds
writer keys?

One question, five decision areas. Every later Phase 5 slice cites this
record; each area below carries its own options and its own numbered binding
rules.

## Decision 1 — ThreadHub is the sole accumulation layer

### Options Considered

**Option A — Federated co-equal stores.** Each workstream keeps its own
authoritative store (Firestore `clista_hive_mind` for the swarm,
`prompt_studio.db` for the studio, run directories for the protocol,
`hub.db` for the hub), cross-referencing by convention.
- *Rejected because:* co-equal stores have no supremacy rule, so a conflict
  between them is unresolvable on the record — the exact discoverable
  finding DR-2026-07-08 closed for documentation. And the 07-10/11 probe
  already showed what convention-held provenance does under pressure: the
  swarm's recall path wrote no record at all. Federation multiplies the
  places where that class of silence can live.

**Option B — Single accumulation layer, everything else demoted.** ThreadHub
accumulates; all other stores are declared projections.
- *Accepted.*

### Binding rules

1.1. **ThreadHub is the sole accumulation layer** for sealed records across
     the studio, the protocol harnesses, and (Phase 6) the swarm. The
     canonical store is `packages/threadhub`: hash-chained `hub.db` with
     per-record author attribution.

1.2. **Firestore `clista_hive_mind`, studio SQLite `prompt_studio.db`, and
     the registry `INDEX.json` are caches/projections with declared
     provenance — never co-equal sources.** In any conflict, the hub record
     governs (supremacy, the DR-2026-07-08 rule 1 pattern applied to
     records).

1.3. **Citation shape.** There is NO hub-global sequence. External
     references cite `record_hash` + `(thread_id, seq)` + `verify.head`. A
     citation that presumes a global ordering the hub does not have is
     malformed.

## Decision 2 — Direction of derivation: canonical vs projection

### Options Considered

**Option A — Bidirectional sync, most-recent-writer wins.** Let projections
write back; reconcile on conflict.
- *Rejected because:* reconciliation is arbitration, and the swarm's
  Arbitrator is the standing exhibit for what unwitnessed arbitration does
  (`gateway.py:477` hardcodes `confidence=1.0`, collapsing dissent).
  Bidirectional derivation also makes provenance undeclarable — a row that
  is sometimes source and sometimes copy can honestly pin nothing.

**Option B — Declared one-way derivation.**
- *Accepted.*

### Binding rules

2.1. **Canonical artifacts:** hub records; and a protocol run's
     `thread.jsonl` for that run *until its records are accumulated into the
     hub*, after which the hub record governs and the run directory is its
     retained projection. Anchoring (Decision 4) is a distinct act: an
     external timestamp on an already-canonical artifact, and it never
     changes canonicality. *(Amended by pre-seal amendment, 2026-07-12 —
     resolves `obj_canonicality-boundary`.)*

2.2. **Projections:** studio DB rows, `INDEX.json`, Firestore documents, and
     rendered `.md` reports. Every projection carries declared provenance to
     the canonical artifact it derives from.

2.3. **Derivation is one-way.** A projection is never written back into a
     canonical artifact. A broken projection is regenerated from canonical;
     a wrong canonical record is corrected by appending, never by rewriting
     (append-only holds at every layer).

## Decision 3 — One event ontology, three emitters

### Options Considered

**Option A — Per-emitter ontologies with pairwise adapters.** Studio, swarm,
and harness each keep their own vocabulary; adapters translate at each
boundary.
- *Rejected because:* three emitters means adapters grow pairwise, and every
  adapter is a translation layer where meaning shifts unwitnessed —
  ventriloquism at the vocabulary level. It also leaves the `RECALL` name
  collision (below) permanently ambiguous, resolved differently by each
  adapter.

**Option B — One target ontology: the protocol registry.** The 107-type
registry at `packages/protocol/src/event-types.js` is the shared vocabulary;
each emitter maps into it exactly once, here.
- *Accepted.*

### The mapping

| Emitter event (family-qualified) | Protocol vocabulary | Notes |
|---|---|---|
| studio `ThreadCreated` | `ThreadCreated` | Studio's decision-as-claim sequence is already protocol grammar; rows here record identity, not translation. |
| studio `ParticipantAdded` | `ParticipantAdded` | — |
| studio `EvidenceCommitted` | `EvidenceCommitted` | — |
| studio `ClaimCreated` | `ClaimCreated` | — |
| studio `ObjectionRaised` | `ObjectionRaised` | — |
| studio `ObjectionResolved` | `ObjectionResolved` | The Slice 6 objection lifecycle emits raise → resolve; the Wave 5 gate checks the terminal record carries both. *(Added by pre-seal amendment, 2026-07-12 — resolves `obj_mapping-completeness`.)* |
| harness `SealedReport` | `SealedReport` | Native (DR-2026-07-12-claim-citation-events). |
| harness `PrecedentReference` | `PrecedentReference` | Native (DR-2026-07-12-precedent-as-citation). |
| harness `GateRejectionRecorded` | `GateRejectionRecorded` | Native (silent-action DR rule 2, closed 2026-07-12). |
| swarm `firestore:CRYSTALLIZATION` | `ClaimCreated` + `CrossThreadEvidence` | Original compute archived as precedent: the conclusion as a claim, its cross-thread reach as evidence import. Mapping only; build in Phase 6. |
| swarm `firestore:RECALL` | `PrecedentReference` | Citation of prior compute — the archived witness of a reuse. Mapping only; build in Phase 6. |
| swarm `stream:RECALL` | `PrecedentReference` | The gateway's Mantle stream event (emitted on a hit, never `CONSENSUS`) is the at-action-time witness of the same reuse the `firestore:RECALL` document archives — one recall act, two swarm-side traces, exactly one `PrecedentReference` emission (rule 3.5). Mapping only; build in Phase 6. |
| swarm arbitration | labeled arbitrated: `ClaimCreated` carrying the arbitrated outcome + `PositionTaken` per arm + `MinorityReportFiled` for preserved dissent | Arbitrated resolutions are labeled arbitrated with dissent preserved, never laundered as confidence 1.0 (silent-action DR rule 2). The outcome itself travels as a `ClaimCreated` labeled arbitrated. Today's Arbitrator does the opposite (`gateway.py:477`); its own DR is still owed — this row records the mapping, not a fix. Build in Phase 6. *(Outcome carrier added by pre-seal amendment, 2026-07-12 — resolves `obj_mapping-completeness`.)* |

Every protocol-side name above appears verbatim in
`packages/protocol/src/event-types.js`.

### Binding rules

3.1. **The protocol registry is the single target ontology.** Emitters map
     into it; the registry never grows a type to mirror an emitter's private
     name when an existing type carries the meaning.

3.2. **The table above is the binding mapping.** An emitter event family not
     in the table does not flow into the hub until a mapping row is added by
     amendment to this DR.

3.3. **Name-collision rule, resolved here once:** `RECALL` exists in two
     swarm families — the Mantle event *stream* and the Firestore
     *entry_type*. In every cross-system reference the name is
     family-qualified (`stream:RECALL`, `firestore:RECALL`); an unqualified
     `RECALL` in a cross-system context is malformed.

3.4. **Swarm rows are mapping-only in Phase 5.** The emission code is Phase
     6 work; adopting this DR commits the vocabulary, not the
     implementation. The Arbitrator's forced-confidence behavior remains a
     disclosed nonconformance owed its own DR — out of scope here.

3.5. **One recall act, one emission.** A single recall emits exactly ONE
     `PrecedentReference`. `stream:RECALL` and `firestore:RECALL` are two
     swarm-side traces of the *same act* and MUST dedupe to that single
     emission; emitting two `PrecedentReference` events for one recall is
     malformed. *(Added by pre-seal amendment, 2026-07-12 — resolves
     `obj_recall-double-emission`.)*

## Decision 4 — Anchors doctrine

### Options Considered

**Option A — One central anchors file (hub or monorepo) for all emitters.**
- *Rejected because:* it couples every emitter's seal flow to one repo's
  push access, and it detaches the anchor from the history that witnessed
  the work — the anchor commit would be authored by a courier, not the
  emitter. Courier hops are what this architecture exists to remove.

**Option B — External timestamp authority (RFC 3161 TSA, or a public
chain).**
- *Rejected because:* it buys a stronger proof than the current threat model
  needs, at the cost of an external dependency in every seal flow — and it
  tempts overclaiming. The house discipline is the reverse: take the weak
  proof that hosted git gives for free, and state its weakness plainly.

**Option C — Anchors live in the emitting repo; weak proof, disclosed as
weak.**
- *Accepted.*

### Binding rules

4.1. **Anchor files live in the emitting repo.** The studio's `ANCHORS.md`
     anchors studio seals; the protocol repo's `anchors/ANCHORS.md` anchors
     run heads.

4.2. **What an anchor proves:** a weak external timestamp — the anchored
     hash existed no later than the anchor commit's push, witnessed by the
     hosting provider's git history.

4.3. **What an anchor does not prove:** cryptographic notarization. There is
     no trusted timestamp authority; a host, or a force-push, can rewrite
     history. Any claim made about an anchor states the weak form; the
     strong form is an overclaim and treated as a defect.

4.4. This doctrine closes the T1 run's second `knownGaps` entry ("seal head
     not anchored externally"); Decision 5 closes the first.

## Decision 5 — Custody doctrine

### Options Considered

**Option A — Non-custodial keys for every writer, immediately.**
- *Rejected because:* studio writers (operator, delegate, objectors) are
  humans in a UI with no per-writer key management today; requiring it
  blocks all of Phase 5 on a key-UX build, and the realistic interim —
  unsigned studio writes — is strictly worse than custody.

**Option B — Custodial identities for every writer (hub mints and holds all
keys).**
- *Rejected because:* it defeats Commitment 4 exactly where it is already
  satisfiable. T1 harness writers can sign at reasoning time now; putting
  their keys in the hub would let one keyholder wear every mask — the
  orchestrator-ventriloquism hole the T1 run's own `knownGaps` names.

**Option C — The split: harness non-custodial, studio custodial, upgrade
path disclosed.**
- *Accepted.*

### Binding rules

5.1. **T1 harness writers are non-custodial.** Per-run ed25519 keys,
     generated for the run, signing each event at reasoning time, submitted
     via `POST /t/:slug/records/signed` as `threadhub.record.v0` envelopes
     (reference client: `packages/threadhub/adapters/octopus.js`).

5.2. **Studio writers are custodial.** Operator, delegate, and objectors
     each get a *distinct* identity minted via `POST /identities`; the hub
     holds the private key. One identity per writer, never shared — the
     semantic-author-equals-transport-writer invariant holds even under
     custody.

5.3. **Custody is disclosed, and it downgrades.** A custodial record is
     verifiable, but its independence claim is explicitly downgraded per
     Commitment 4: the hub could technically have signed as that writer.
     Consumers of the record can tell which custody regime produced it.

5.4. **Upgrade path (custodial → non-custodial), append-only.** A writer
     presents their own public key; a successor non-custodial identity is
     minted and linked to the custodial one; every prior custodial record
     stands un-rewritten, with the linkage disclosed on the record. No
     re-authoring, no retroactive re-signing — history keeps the custody it
     was written under. *The specifics of this path are part of what the
     owner approves at the Wave 0 checkpoint.*

5.5. **No key material in any repo or doc.** Ever.

5.6. **The custody disclosure reaches the objector.** The custody-regime
     disclosure of rule 5.3 travels with objector-facing artifacts: the
     Slice 6 objection receipt states the custody regime of the objection
     record it points at — custodial identity, independence downgraded per
     5.3, upgrade path per 5.4 available — so the objector sees the regime
     on the receipt itself, without querying the hub. *(Added by pre-seal
     amendment, 2026-07-12 — resolves `obj_custody-disclosure-reach`.)*

## Evidence Basis

- **T1 sealed run**
  `packages/protocol/runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/` —
  sealHash `660953ee…`, PASS (28 events, chain valid, 12/12 claims cited).
  Its `knownGaps` are exactly two: writers as gate-registered strings, and
  no external anchor. Decisions 5 and 4 are those gaps, closed as doctrine.
- **`docs/decision-records/FINDINGS-T1-T2.md`** — the mechanism this
  topology accumulates (forced citation, sealed runs) works; what was
  missing was where the records land and under whose keys.
- **Swarm DR** — `DR-hive-mind-cache-integrity.md` at the root of the
  `clista-octopus-swarm` repo: the `CRYSTALLIZATION`/`RECALL` provenance
  separation Decision 3 maps, the silent-recall defect that motivates
  Decision 1's single accumulation layer, and the forced-confidence residual
  Decision 3.4 fences out.
- **`docs/new/mutual-reliance-proposal.md`** — Commitment 1 (no unwitnessed
  work) requires somewhere for witnesses to accumulate (Decisions 1–2);
  Commitment 4 (writer identity is bound, not asserted) is what Decision 5
  phases in.
- **Studio state** — five FCP promotions sealed; session thread
  `prompt-studio-2026-07-12-threads-phase-4-ships` (`sha256:ea7098fb…`).
  `prompt_studio.db` and `INDEX.json` exist today as exactly the projections
  Decisions 1–2 classify.

## Consequences Accepted

- **Projection lag.** Studio DB rows, `INDEX.json`, and Firestore documents
  drift between refreshes; drift is disclosed via declared provenance, not
  prevented.
- **Anchor-hook coupling.** Seal UX is coupled to git push: a seal is not
  externally anchored until its anchor commit is pushed, and an offline seal
  waits. Accepted — the alternative is a stronger external dependency
  (Decision 4 Option B) or no anchor at all.
- **Custodial trust in the hub.** Until a studio writer upgrades (rule 5.4),
  the hub could sign as that writer. Accepted as a disclosed, downgraded
  regime — not hidden, not permanent.
- **Ontology-mapping maintenance.** The Decision 3 table is one more
  artifact that can go stale; every emitter vocabulary change costs a
  mapping row by amendment. Machine-checking the table against the registry
  is future work, not promised here.
- **Longer citations.** Rule 1.3's three-part citation shape is more verbose
  than a global sequence number would be; the hub does not have one, and
  pretending otherwise would be worse.

## Amendments

- **2026-07-12 (pre-seal):** Owner challenge pass on the PROPOSED draft
  (Phase 5 Wave 0 checkpoint) raised four objections, each resolved by
  amendment above; the objections file as `ObjectionRaised` events in the
  seal thread under these ids:
  - `obj_mapping-completeness` — the Decision 3 table omitted the studio
    `ObjectionResolved` half of the Slice 6 objection lifecycle and named
    no carrier for the arbitrated outcome itself. Resolved: `ObjectionResolved`
    row added; the arbitration row now carries the outcome as a
    `ClaimCreated` labeled arbitrated, alongside `PositionTaken` per arm
    and `MinorityReportFiled` for dissent.
  - `obj_canonicality-boundary` — rule 2.1's "accumulated/anchored"
    conflated two distinct acts. Resolved: canonicality transfers on
    accumulation into the hub; anchoring is an external timestamp on an
    already-canonical artifact and never changes canonicality.
  - `obj_custody-disclosure-reach` — the rule 5.3 custody disclosure
    stopped at the hub. Resolved: rule 5.6 threads it through to the
    Slice 6 objection receipt, so the objector sees the regime without
    querying the hub.
  - `obj_recall-double-emission` — the mapping sent both `stream:RECALL`
    and `firestore:RECALL` to `PrecedentReference` without saying how many
    emissions one recall act produces. Resolved: rule 3.5 — one recall act,
    exactly one `PrecedentReference`; the two swarm traces dedupe to it.

## Seal

Pending — seals through the studio seal flow after owner approval (Wave 0
checkpoint); the seal record's slug/hash will be recorded here by amendment.
