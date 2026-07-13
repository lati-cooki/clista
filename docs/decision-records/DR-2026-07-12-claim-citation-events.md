# Decision Record: Claim-Citation Report Events (`SealedReport`)
> **Provenance:** clista@c56b406600df36ccc8e5fdc7153c5fedf57324db

**Status:** ADOPTED by owner direction — the Mutual Reliance transfer prompt
(committed `c56b406`, drafted 2026-07-11) directs this DR and its
implementation; the full evidence chain is sealed to a ClisTa thread in
Slice 8 of that prompt. Agent-authored draft without a separate challenge
pass — disclosed here, per the 2026-07-10 monorepo precedent.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** `packages/protocol` (engine + gate), `docs/` (this atlas)
**Evidence base:** `docs/new/mutual-reliance-proposal.md` §3 Commitment 3, §6
(T1/T2); Hive Mind three-phase probe of 2026-07-10/11 (ventriloquism at
cache, audit, and toolchain layers)

---

## Decision Question

A report derived from a thread must be structured as claims, where every
claim carries a citation to an event hash within the same thread, with
versioned rendering rules recorded in the thread — so that verification of
the *report layer* is as mechanical as verification of the *log layer*.
What event vocabulary carries this?

**Non-negotiable decision criterion:** the resulting verification must be
three checks with no judgment, each a pure function:

1. **Chain** — the thread's event chain verifies (existing
   `validateEvents` / hash-chain verification, unchanged).
2. **Existence** — every cited hash resolves to the `content_hash` of an
   event in the same thread.
3. **Coverage** — no claim lacks a citation.

An option that cannot support all three as pure functions loses.

## Options Considered

**Option A — Extend `CrossThreadEvidence` to permit intra-thread (inward)
references.**

*Rejected*, on three grounds, the second decisive:

1. **Semantics.** `CrossThreadEvidence` models *importing another thread's
   decision output as evidence*: the validator requires
   `sourceDecisionRecordId`, restricts `derivation` to a closed cross-thread
   vocabulary (`decision_output`, `preserved_objection`, `minority_report`,
   `assumption_propagation`, `evidence_propagation`), and registers the
   payload into `state.evidence` (src/validator/thread.js:105–158). A report
   claim is a *derived rendering of this thread*, not evidence entering the
   decision graph. Permitting inward references would let a thread's own
   report feed back into its evidence pool — circular self-witnessing, the
   exact laundering pattern this workstream exists to prevent.
2. **The coverage check is inexpressible.** One evidence-shaped event per
   citation gives the log no representation of "the report's claims as a
   whole." Every citation event that exists carries a reference by
   construction — but a claim the renderer *omitted* simply never appears,
   and its absence is unfalsifiable from inside the log. Check 3 cannot be
   written as a pure function over the thread. This is the silence defect
   (proposal §1) reproduced at the vocabulary level: Option A fails the
   non-negotiable criterion outright.
3. **No slot for ordering or rendering rules.** A report is an *ordered*
   claim list rendered under versioned rules; `crossThreadEvidence` carries
   neither ordering nor a rendering-rule field, and adding them would
   overload an object that other validators already consume as evidence.

**Option B — New event type `SealedReport`: a single event whose payload is
the ordered claim list.**

*Accepted.* One event carries the whole report:

```
event_type: "SealedReport"
payload.sealedReport: {
  id:                       "rpt_<hex>",
  threadId:                 <thread id>,
  renderingRuleVersion:     <string, required — the versioned rendering rules>,
  renderedByParticipantId:  <required, must resolve to a declared participant>,
  renderedAt:               <ISO timestamp>,
  claims: [                 // ordered; order is part of the hashed content
    { text: <non-empty string>,
      citedEventHashes: [ "sha256:<64hex>", ... ]  // ≥1, see rules below
    }, ...
  ]
}
```

Within Option B the prompt left open per-claim `ReportClaim` events vs a
single `SealedReport`. Per-claim events re-create Option A's coverage hole —
nothing marks "these are ALL the claims" — so the single event wins: its own
`claims` array is the closed world the coverage check runs over.

One deliberate deviation from the prompt's working shape: the prompt sketched
`rendering_rule_version` per claim item; this DR puts it **per report**. One
rendering pass produces one artifact under one set of rules; per-claim
versions would imply mixed renderers inside a single report and add a
judgment call ("which version governs?") to what must stay mechanical. If a
mixed-renderer report ever becomes real, that is a new DR, not a field.

## Decision

Adopt Option B. Binding rules:

1. **`SealedReport` is a first-class protocol event type**, added to the
   canonical registry (`src/event-types.js`), the validator switch, and the
   projector switch in the same change — the three coordinated edits the
   registry's conformance test enforces.
2. **Citations are `content_hash` values of events that appear EARLIER in
   the same thread.** Later or self citation is invalid: a report witnesses
   only its past. Under `clista.event_hash.v2` the report's own
   `content_hash` commits to `previous_hash` and therefore, transitively, to
   every event it can legally cite — the report *seals* what it renders.
   That is what "Sealed" in the name means; it introduces no new terminal
   state (ThreadHub still has none; "final event" remains a convention
   enforced by harnesses and tests, not by the store).
3. **`verifyReport(events)` implements exactly the three mechanical checks**
   as a pure function (zero deps, stdlib crypto only), validated through the
   same path as any event (`prepareEventForAppend` → `validateEvents`).
   Failure outputs are examiner-facing and specific: which claim (index and
   text), which missing hash, which uncovered claim.
4. **A `SealedReport` does not register into `state.evidence`.** Reports are
   renderings, not evidence; a report consumed by *another* thread crosses
   via `CrossThreadEvidence` like any other decision output (out of scope
   here; noted for the Slice 3 precedent DR).
5. **Multiple `SealedReport` events per thread are legal** (reports get
   re-issued); each verifies independently against its own prefix.

## Evidence Basis

- The 2026-07-10/11 probe showed prose *about* a log detaching from the log
  at three layers while the chain itself stayed valid — chain verification
  says nothing about the report layer (proposal §1, §3).
- `validateCrossThreadEvidence` source (src/validator/thread.js:105) — the
  Option A rejection is grounded in what the validator actually requires,
  not in preference.
- The registry discipline (src/event-types.js header, issue #51) — adding a
  type is a known, tested, three-edit operation; Option B's cost is bounded.

## Consequences Accepted

- A new event type expands the grammar all consumers must know (validator,
  projector, app vendoring — the app inherits it at the next de-vendor pass,
  monorepo cutover checklist item 3).
- Report prose remains free-form *outside* the claims array; only structure
  is verifiable. A sentence smuggled into `text` with a decorative citation
  passes checks 1–3 — the T2 harness (ventriloquism diff) exists precisely
  to surface how far mechanical coverage gets and where human/agent review
  must still look. The checks are necessary, not sufficient, and are named
  as such in examiner-facing output.
- ThreadHub schema is untouched (constraint honored); if hub-side awareness
  is ever needed, that is a filed issue, not a silent change.
