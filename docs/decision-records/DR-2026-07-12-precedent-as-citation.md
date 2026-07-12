# Decision Record: Precedent-as-Citation Semantics (`PrecedentReference`)
> **Provenance:** clista@b9be54ecf9ef727f9ee2c632c473c60fa577190b

**Status:** ADOPTED by owner direction — Mutual Reliance transfer prompt
(committed `c56b406`, drafted 2026-07-11), Slice 3. Agent-authored draft
without a separate challenge pass — disclosed, per the 2026-07-10 monorepo
precedent. Evidence chain sealed in Slice 8. Event-shape implementation was
deliberately NOT in Slice 4 (which implemented only the Slice 1 vocabulary);
**implemented 2026-07-12** as a follow-up slice against this DR:
`PrecedentReference` is a first-class event type (registry + validator +
projector), the validator rejects any `rationale`/`sourceRationale` field
outright (rule 2 made mechanical), and precedent age is enforced
non-negative, never stored (rule 1). Tests: `test/precedent-reference.test.js`.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** `packages/protocol` grammar; any ClisTa-governed system
that caches, remembers, or otherwise reuses prior conclusions
**Evidence base:** `docs/new/mutual-reliance-proposal.md` §1, §3
Commitment 2; Hive Mind Phase 1–2 probe of 2026-07-10/11 — a pre-recession
precedent recalled into a stated-recession query, served with the ORIGINAL
rationale ("no compelling evidence of performance degradation") while the
contradicting evidence sat in the logged prompt; the control probe showed
the cache insensitive to material vs cosmetic context change

---

## Decision Question

Reuse of past conclusions is a feature — it is what makes precedent, case
law, and caching valuable. Reuse of past *justifications* is fabrication,
because a justification is indexed to the facts it was reasoned against.
How does the protocol permit the first while making the second
structurally visible?

## Decision

**Prior sealed conclusions may be reused only as tagged citations, never by
serving the prior rationale verbatim.** The case-law model: cite the
holding; never read the prior opinion's facts into the current record.
Binding rules:

1. **Every reuse is witnessed** (this is the Slice 2 prohibition applied to
   the recall class) by a `PrecedentReference` event — a reuse event,
   type-distinct from any fresh-computation event:

   ```
   event_type: "PrecedentReference"
   payload.precedentReference: {
     id:                      "pre_<hex>",
     threadId:                <this thread>,
     sourceThreadId:          <original thread>,
     sourceEventHash:         <content_hash of the original conclusion event>,
     sourceDecisionRecordId:  <original decision id, when the holding is a decision>,
     holding:                 <the conclusion as reused — the holding, nothing else>,
     contextHash:             <sha256 of the DECLARED decision-relevant context of the LIVE query>,
     sourceContextHash:       <same, for the original context, when available>,
     precedentDate:           <original decision date, ISO>,
     reusedAt:                <ISO timestamp>,
     regrounding:             "fresh" | "templated_precedent",
     reusedByParticipantId:   <must resolve to a declared participant>
   }
   ```

   Precedent *age* is `reusedAt − precedentDate`, derivable mechanically;
   it is not stored as a third field that could disagree with the two it
   derives from.

2. **The holding travels; the rationale does not.** `holding` carries the
   conclusion. There is no field for the original rationale, deliberately:
   the shape makes rationale transplant unrepresentable rather than
   discouraged. The live record's rationale is either recomputed against
   the live context (`regrounding: "fresh"`) or explicitly templated as a
   precedent reference — "we follow <cite> because its context matches
   ours per contextHash comparison" (`regrounding: "templated_precedent"`).
   Prose that restates the original context's facts as if they were the
   live context's is ventriloquism, and T3-class probes exist to catch it.
3. **Cache keys are hashes of declared decision-relevant context**, never
   similarity over surface tokens. What is "decision-relevant" must itself
   be declared (schema'd per domain) so `contextHash` is reproducible by a
   verifier — a hash over an undeclared bag of fields verifies nothing.
   The Phase 2/3 probe pair is the acceptance test: a material change
   (collapsed economy) MUST miss; a cosmetic change (renamed bank) MAY hit,
   with precedent metadata and no transplanted facts.
4. **Fail open to fresh computation.** On ANY ambiguity about context
   match — missing `sourceContextHash`, undeclared context schema, hash
   mismatch, staleness policy unset — the system recomputes. It never
   falls back to stale recall. Recomputing when reuse was possible costs
   compute; reusing when recomputation was required costs correctness in
   production with no witness. The asymmetry decides.
5. **Relation to `CrossThreadEvidence`:** CTE imports a prior thread's
   *output* as evidence into the current decision graph. `PrecedentReference`
   witnesses the *act of reuse* and its context discipline. A reused
   conclusion that also serves as evidence needs both events; neither
   substitutes for the other.

## Options Considered

**Option A — Reuse via `CrossThreadEvidence` alone.** *Rejected:* CTE
records that content crossed threads, but carries no live-context hash, no
regrounding discipline, and registers into evidence — it answers "where did
this come from," not "was it legitimate to serve it HERE." The probe's
failure was exactly a legitimate-looking cross-reference served into the
wrong context.

**Option B — Tagged-citation event with context hashes and mandatory
regrounding (`PrecedentReference`).** *Accepted*, as specified above.

## Consequences Accepted

- Systems must declare, per domain, what context is decision-relevant —
  real up-front design work, and the declaration itself becomes contestable
  (that is a feature: an examiner can challenge the schema, which is
  impossible when the cache key is an embedding similarity).
- Fresh-compute fallback raises cost under ambiguity; accepted per rule 4.
- The grammar grows by one event type (implementation deferred; the three
  coordinated registry edits apply when it lands).
