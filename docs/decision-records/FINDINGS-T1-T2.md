# Findings — T1 / T2 (Mutual Reliance Slice 7)
> **Provenance:** clista@b2a99465f584ce847a80d90b54c94d21fa2a6b79

**Date run:** 2026-07-12
**Predictions on record** (sealed 2026-07-11 in
`docs/new/mutual-reliance-proposal.md` §6, restated in the transfer prompt —
"do not soften them"):

1. **T1 passes within two attempts** — hashes cannot be hallucinated; they
   must be computed.
2. **T2 fails on attempt one** for the agent variant — "summarization is
   ventriloquism until every sentence is forced to cite a witness."

## T1 — single-prompt sealed run

**Deterministic variant** (in the suite, `test/sealed-run-harness.test.js`):
PASS. 13 events — maker and checker under distinct writer identities, every
append through the generalized sidecar-gate pattern, zero rejections, ending
in a `SealedReport`. Chain verification, full validation, and report
verification all pass.

**Agent variant** (`scripts/t1-agent-run.mjs`, 4 live `claude` calls):
**PASS on attempt one.** Thread `thd_sealed_run_mrh3w4h9_d5d01472`, 13
events, zero gate rejections; chain verifies, log validates, report
verifies. Artifacts: `packages/protocol/runs/t1-agent-2026-07-12T01-19-55-836Z/`.
The live maker/checker exchange was substantive — the checker attacked the
proposal's unenforced-update-cadence assumption; the maker answered by
making the cadence merge-blocking; the resolution records exactly that.

**Prediction 1: CONFIRMED** (and beaten — one attempt, not two).

## T2 — ventriloquism diff

**Deterministic variant** (in the suite, `test/report-cli.test.js`): behaves
as designed — a valid sealed run passes `clista report verify`; a re-chained
log whose report smuggles in one uncited claim ("the checker never
objected") fails the diff with exit 1, naming the claim, while the chain
itself still VERIFIES. The report layer catches what chain verification
cannot see. This is the mechanism working.

**Agent variant** (`scripts/t2-agent-diff.mjs`, live model rendering a
report over the T1 agent thread): **prediction MISSED.** The model was shown
the 13-event log with content_hashes and asked for a 5–8-claim executive
report with citations. Attempt one: 8 claims, every citation resolving to a
witnessed event, zero coverage gaps — diff PASS, gate validation PASS.
Artifacts: `packages/protocol/runs/t2-agent-2026-07-12T01-21-33-755Z/`.

**The honest reading of the miss.** The sealed prediction said summarization
is ventriloquism *until every sentence is forced to cite a witness*. The T2
harness — by design, per DR-2026-07-12-claim-citation-events — FORCES the
claims-with-citations structure in the prompt and rejects anything else. So
the test as built does not measure unforced summarization; it measures a
model operating inside the constraint the protocol imposes, and inside that
constraint the model complied on the first try. Two implications, both
evidence:

1. The *mechanism* is vindicated from the other direction: when the
   structure is forced, a live model CAN produce a fully-witnessed report
   cheaply. The constraint is practical, not aspirational — good news for
   the twenty-minute customer run.
2. The *prediction as written* was about unforced prose, and the harness
   never exercises unforced prose — the vacuous-pass risk the proposal
   itself flagged in §7 ("the claim-citation event shape must be defined
   before T1/T2, or … the toy test passes vacuously"). A harder T2 —
   diffing a FREE summary (no citation requirement at generation time)
   against witnessed events — requires semantic claim-matching, which is
   judgment, not mechanics. It belongs to T3/T4 territory (probe-style
   evaluation), not to this mechanical gate. Left on record as an open
   follow-up, not silently dropped.

**Prediction 2: MISSED — recorded plainly.** The miss narrows the claim: the
danger is unforced summarization; forced citation is both the cure and,
when tested, easily satisfiable by current models.

## Net

- T1: pass, both variants (prediction confirmed).
- T2 deterministic: catches the smuggled claim the chain cannot see.
- T2 agent: prediction missed; the constraint works so well that a
  constrained model passes immediately. The evidentiary burden shifts to
  probe-style tests of UNforced pipelines (T3 in the swarm workstream).

## T2b — curation check baseline against the T1 sealed run (added 2026-07-12)

**Order-discipline note (binding, per the Phase 5 Wave 2 / Slice 4 brief):**
the curation check was implemented and locked against synthetic fixtures
only (commit `1c492f5`, `test/curation-check.test.js`), then run ONCE,
untuned, against the real T1 thread before any CLI wiring, harness criteria,
or DR landed. This section records that single run verbatim.

**What was run** (from `packages/protocol/`, at check commit `1c492f5`):

```
node -e "
const fs = require('node:fs');
const { verifyReport } = require('./src/report.js');
const file = 'runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/thread.jsonl';
const events = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
console.log(JSON.stringify(verifyReport(events), null, 2));
"
```

**Verbatim output:**

```json
{
  "valid": true,
  "reportCount": 0,
  "errors": []
}
```

**The honest reading: this is a VACUOUS pass, not a curation verdict.** The
T1 orchestrator run predates the protocol-native report shape entirely: its
thread is in the standalone gate.py record schema (`seq`/`ts`/`writer`/
`type`/`payload`/`prev`/`hash`), its report is a `ClaimCitedReport` record,
and its event vocabulary (`Challenge`, `CounterProposal`, `EvidenceDemand`,
`Position`, `Concession`, `Rebuttal`, …) appears nowhere in the protocol
registry. `verifyReport` walks protocol events (`event_type`,
`content_hash`); it found zero `SealedReport` events and zero
dissent-bearing events in this file, so the curation rule never fired.
T2b's verdict on the flagship T1 run is therefore **not measurable**, not
"pass": the run is outside the ontology the check speaks.

**Why no adapter or vocabulary mapping was interposed.** DR-phase5-topology
rule 3.2 makes the Decision 3 table the binding mapping into the registry,
and the gate.py T1 vocabulary has no rows there. Whether, say,
`EvidenceDemand` or `CounterProposal` maps to a dissent-bearing registry
type decides the verdict — the T1 report's claims cite some checker events
and not others — so choosing a mapping at measurement time would have tuned
the result. The prediction protocol required recording what the untuned
check says about the named file, and it says the above.

**Findings this baseline yields, recorded plainly:**

1. The curation check cannot yet see the strongest real-world artifact this
   repo has (the fraud-threshold sealed run). A meaningful T2b measurement
   of that run needs either mapping rows for the gate vocabulary added by
   amendment to DR-phase5-topology Decision 3, or a protocol-native re-run.
   Any later mapped measurement must disclose that it post-dates both this
   baseline and the mapping choice.
2. The vacuous-pass shape is itself a hazard worth naming: fed a log it
   cannot see, the checker answers `valid: true` with `reportCount: 0`
   rather than "not measurable". Examiner-facing surfaces must always show
   the report count next to the verdict (the CLI's existing
   "no SealedReport events — nothing to diff (vacuous pass)" line exists
   for exactly this; the curation bucket inherits it).
3. Per the brief, this result is recorded as measured, and neither the
   check nor the T1 run artifacts were adjusted in response
   (`runs/` is immutable).
