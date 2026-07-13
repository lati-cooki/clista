# Decision Record: The Curation Check (`omitted_dissent` + verifyReport check 4)
> **Provenance:** clista@6bf906fe6b49a3d5f048e9648dc03291e302c4b6

**Status:** ADOPTED by owner direction — the Phase 5 plan (Wave 2 / Slice 4,
under DR-phase5-topology) directs this DR and its implementation.
Agent-authored draft without a separate challenge pass — disclosed here, per
the 2026-07-10 monorepo precedent.
**Seal:** Pending — to be sealed by the controller through the studio flow;
no seal is claimed by this document.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** `packages/protocol` (engine + gate + CLI + harness),
`docs/` (this atlas)
**Evidence base:** DR-2026-07-12-claim-citation-events (the coverage check
this extends); `docs/decision-records/FINDINGS-T1-T2.md` — "T2b — curation
check baseline against the T1 sealed run" (the check's single untuned
first measurement, recorded 2026-07-12)

---

## Decision Question

Chain verification proves the log; coverage proves every claim cites a
witness. Neither catches CURATION failure: a report whose claims are all
cited but which silently omits the thread's dissent. A renderer can produce
a fully-witnessed report that never mentions the objection that almost
killed the decision — every check passes, and the dissent has vanished from
the artifact a reader actually consumes. What mechanical rule closes this,
and what schema carries it?

**Non-negotiable decision criterion** (inherited from the claim-citation
DR): the resulting verification must be a pure function with no judgment —
mechanical set-comparison only. An option that requires deciding what a
sentence *means* loses.

## Options Considered

**Option A — Prose-judgment curation: ask whether the report "fairly
represents" the thread's dissent.**

*Rejected.* Fair representation is a semantic property of free text; no
pure function computes it. This is the same boundary the claim-citation DR
drew for coverage (its Consequences section: the checks prove structure,
not faithful rendering — the residue belongs to probe-style evaluation,
T3/T4 territory). Reproducing that judgment inside a mechanical gate would
make the gate's verdict unfalsifiable and un-replayable.

**Option B — Per-claim dissent tags: each claim declares which dissent it
answers.**

*Rejected.* This re-creates the exact coverage hole the claim-citation DR's
Option A analysis identified at the vocabulary level: a tag that exists is
witnessed by construction, but dissent the renderer *omitted* simply never
appears, and its absence is unfalsifiable from inside the report. The
closed world needed for a mechanical completeness check cannot live on the
items; it must be computed against the thread itself.

**Option C — Registry-enumerated dissent set + report-level disclosure
block, checked by set-comparison.**

*Accepted.* The thread's own event list is the closed world: the protocol
registry already names which event types carry dissent. A report must
account for every one of them in its strict past — by citation or by
disclosed omission. Silence is the only thing that fails, and silence is
mechanically detectable.

## Decision

Adopt Option C. Binding rules:

1. **`DISSENT_BEARING_TYPES` is part of the event-type registry**
   (`src/event-types.js`, beside `EVENT_TYPES`): an explicit, sorted,
   frozen enumeration — `ObjectionRaised`, `ObjectionResolved`,
   `PositionTaken`, `MinorityReportFiled`, `ReviewDisputed`,
   `LearningDisputed`, `OutcomeDisputed`,
   `ContributionAttributionDisputed`, `NegotiationTermsRejected`,
   `NegotiationDifferenceRecorded`, `GateRejectionRecorded`, and every
   `*FailureRecorded` / `*ViolationRecorded` type in the registry, each
   listed by name. **No wildcard or suffix matching at runtime.** The test
   suite (`test/curation-check.test.js`) sweeps the registry for those
   suffixes at test time, so adding a failure/violation event type forces a
   deliberate classification — the registry's own coordinated-edits
   discipline, extended.

2. **The `SealedReport` payload gains one optional field,
   `omitted_dissent[]`** — entries `{ eventHash: "sha256:<64hex>",
   reason: <non-empty string> }`. This is a payload schema change and was
   made under the claim-citation DR's rule 1 discipline: validator edit
   (`src/validator/thread.js`), projector conformance (the projector
   upserts the whole `sealedReport` object, so the field rides the
   projection — locked by test), registry untouched (no new event type).
   **At the append gate the validator enforces**: well-formed hash,
   non-empty reason, and — mirroring exactly how `citedEventHashes` is
   validated today — that the hash resolves to an EARLIER event in the same
   thread. Existence is enforced at append time for both fields for the
   same reason: the gate never admits a reference the thread cannot
   witness. Whether every *undisclosed* dissent event is cited is not the
   gate's job; that is the curation check's.

3. **`verifyReport` gains check 4 — curation** (`src/report.js`), a pure
   function beside chain/existence/coverage: for each `SealedReport`,
   every event of a `DISSENT_BEARING_TYPES` type EARLIER in the report's
   own thread is satisfied iff its `content_hash` appears in some claim's
   `citedEventHashes` OR in `omitted_dissent[]` with a non-empty reason.
   Anything else fails with examiner-facing output naming the event's
   index, type, and hash. Mechanical set-comparison only: the check never
   reads prose, and a disclosure's *reason* is required to be non-empty but
   is never judged.

4. **Backward compatibility is exact:** a report with no `omitted_dissent`
   field and no dissent-bearing past passes; a report with dissent in its
   past and no field passes only if every dissent event is claim-cited.
   Old run artifacts (`runs/`) are immutable and are never edited to
   satisfy the check.

5. **The curation verdict joins the pass criteria for future runs:**
   `clista report verify` renders it as its own bucket (exit-code semantics
   identical to the existing buckets), and the sealed-run harness
   (`src/harness/sealed-run.js`, `scripts/t1-agent-run.mjs`,
   `scripts/t2-agent-diff.mjs` via `verifyReport`) passes only if curation
   passes. Verdicts already recorded in FINDINGS keep the criteria they
   were measured under.

## Evidence Basis

- **The T2b baseline measurement** (FINDINGS-T1-T2.md, section "T2b —
  curation check baseline against the T1 sealed run", 2026-07-12): the
  check's single untuned run against the flagship T1 thread returned
  `{valid: true, reportCount: 0, errors: []}` — a vacuous pass, recorded
  verbatim and read honestly as NOT MEASURABLE: that run predates the
  protocol-native report shape, and its gate.py vocabulary has no binding
  mapping into the registry (DR-phase5-topology rule 3.2). The baseline
  grounds two things: the prediction-protocol order discipline held (check
  locked on synthetic fixtures before its first real measurement), and the
  vacuous-pass hazard named in rule 5's bucket rendering (report count
  always shown beside the verdict) is real, not theoretical.
- **The claim-citation DR's Option A analysis** — the
  omitted-things-are-unfalsifiable-from-inside argument that decides
  Option B here is the same argument that decided the SealedReport shape.
- **The T1 fraud-threshold run itself** (`runs/t1-claude-code-sealed-run-
  2026-07-12T01-42-20Z/result.json`): a live run whose checker altered the
  outcome through six witnessed events — exactly the class of dissent a
  curated summary could silently drop, which is why the check exists.

## Consequences Accepted

- **The dissent set is a judgment, frozen mechanically.** Which types are
  "dissent-bearing" was decided once, here, by enumeration; the check then
  applies it without judgment. A type wrongly left out fails open for that
  type — the suffix-sweep test bounds this for the failure/violation
  families, and new dissent-like types must be classified at registry time.
- **`omitted_dissent` reasons are disclosed, not judged.** A renderer can
  write a bad reason; the check only forbids silence. Auditing reason
  *quality* is human/probe territory (T3/T4), same boundary as prose
  claims.
- **The flagship T1 run stays unmeasured until a mapping lands.** A
  meaningful curation verdict on the gate.py-format run requires mapping
  rows added by amendment to DR-phase5-topology Decision 3 (or a
  protocol-native re-run); any later mapped measurement must disclose that
  it post-dates this check and the baseline.
- One more field in the SealedReport payload for consumers to know
  (validator, projector, app vendoring at the next de-vendor pass).

## Amendments

None yet.
