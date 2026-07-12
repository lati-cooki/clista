# Findings — T1 / T2 (Mutual Reliance Slice 7)

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
