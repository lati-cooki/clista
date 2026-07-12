# The Night the System Caught Itself
> **Provenance:** clista@75b79268abc631a3670933a42da7f34921a96b72

**A case study in witnessed failure, 2026-07-10 → 2026-07-11**
**Status:** Public-ready draft · assembled 2026-07-11
**Discipline:** every claim below carries a pointer to its artifact — a commit, a file in this
repository, a sealed thread, or a decision record. Claims without artifacts were deleted during
assembly. That rule is not editorial house style; it is the product, applied to its own story.

**To re-verify rather than believe:** clone this repo. The evidence seal is at
`packages/protocol/runs/evidence-seal-2026-07-12/` (14 events, head
`sha256:93dd6c1d…f488c460`, `verification.json` shows chain, validation, and report checks all
passing — re-run them with the protocol CLI). The full-weight sealed run is at
`packages/protocol/runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/` — `python3 gate.py
verify && python3 gate.py coverage` reproduces its verdicts with no dependencies.

---

## Act I — A swarm tells a bank not to look

On the night of 2026-07-10, a three-phase probe was run against a live multi-agent decision
swarm — a production deployment whose outputs are model-risk revalidation recommendations
(`DR-hive-mind-cache-integrity.md`, in the swarm repo).

**Phase 1** seeded it with a defensible question: a small-business default model, stable
inputs (PSI 0.08), AUC 0.82, validated eight months ago — revalidate out of cycle, or wait?
The swarm computed fresh and answered *wait*, defensibly, and archived the answer (execution
`74890807-cccb-4a9f-b4ac-d172b5ff506b`, audit and archive writes ~1.4s apart).

**Phase 2** asked the identical question plus a changed world: a 150bps rate cut, a regional
recession, *realized defaults doubled*. The cache served the pre-recession answer back in two
seconds at zero compute — including its original rationale, which claimed "no compelling
evidence of performance degradation" **while the doubled defaults sat in the query it had just
logged**.

**Phase 3**, the control, renamed the bank and changed nothing material. Same hit. The cache
was not mis-keyed; it was *insensitive* — it could not distinguish a renamed bank from a
collapsed economy.

Forensics found a third defect worse than either: **the recall path wrote no audit record at
all.** Two production recommendations were dispensed into the world, and the only surviving
witnesses were pastes in a chat window.

None of this is a database bug. It is a universal property of any system that summarizes
itself to survive — caches, compacting agents, orchestrators reporting on subagents, humans
recalling last quarter's reasoning. Conclusions detach from their evidence and get served into
new worlds as if freshly reasoned. The failure class was named **ventriloquism**, and it was
observed at three layers in one night: cache (rationale transplant), audit (silent recall),
and toolchain (an orchestrator's task list omitting its own verification gate)
(`docs/new/mutual-reliance-proposal.md` §1).

## Act II — Predictions go on the record before the fixes

Rather than patching quietly, the failure was written up as a proposal with falsifiable
commitments (`docs/new/mutual-reliance-proposal.md`): no unwitnessed work; precedent as
citation, never ventriloquism; reports follow the protocol too — every claim citing the hash
of the event that witnessed it; and (added in revision) writer identity bound by keys, not
asserted by names.

Two predictions were sealed before any test ran, with instructions not to soften them
(`docs/decision-records/FINDINGS-T1-T2.md`):

1. **T1 passes within two attempts** — a single prompt driving maker and checker subagents
   through a hash-chained gate to a sealed thread — because hashes cannot be hallucinated.
2. **T2 fails on attempt one** — a report whose every sentence must cite a witnessing event —
   because "summarization *is* ventriloquism until every sentence is forced to cite a witness."

## Act III — The remediation, and the loop that ran unprompted

The swarm was remediated the next day: cache keys became hashes of declared decision-relevant
context rather than similarity over surface tokens, and recalls became typed, precedent-tagged
events — original execution ID, context hash, age — re-grounded against the live query, failing
open to fresh compute (swarm repo, merge `0ee49f0`; verification event streams `08bcadb`:
Phase 2 now misses and recomputes with the recommendation flipped, Phase 3 hits on the
conclusion with precedent metadata and no transplanted facts).

Two details from that session matter more than the fix:

- **The verification gate found four more live defects** before merge, each fixed on the
  record (swarm repo, `2953187`, `438d4d2`) — including a JSON-extraction path that could
  still serve cached rationale fields, and archived fallback decisions masquerading as
  precedent.
- **The maker–checker loop ran unprompted inside the remediation itself**: a maker subagent
  implemented the context-key module; a checker subagent caught two real defects (a casing
  normalization gap that would have caused silent misses, and dead test code)
  (`docs/new/mutual-reliance-proposal.md` §5). The behavior this architecture depends on was
  already operating — what was missing was the witnessing.

## Act IV — The tests run, and one prediction dies honestly

**T1: PASS — twice, both on attempt one** (`docs/decision-records/FINDINGS-T1-T2.md`). The
deterministic variant sealed 13 events with zero gate rejections. The agent variant, four live
model calls, did the same (`packages/protocol/runs/t1-agent-2026-07-12T01-19-55-836Z/`). Then a
full-weight version ran on a non-toy decision — a fraud-model threshold change under promotion
pressure, exactly the shape of question the swarm had failed in Act I. Two live subagents
wrote 28 events through a sidecar gate under distinct writer identities. The checker's attack
forced the maker to withdraw its proposal on the record; the arithmetic that killed it was
verified by its opponent; the final recommendation carries two unresolved reservations forward
instead of laundering them into confidence. Chain verification: PASS. Coverage: 12 claims, 12
citations, zero unwitnessed (`packages/protocol/runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/`,
merged as PR #2).

**T2: the prediction MISSED — and the miss is the finding** (`FINDINGS-T1-T2.md`). When the
citation structure was *forced* — every claim carries an event hash or is deleted — the model
produced a fully-witnessed report on attempt one. Summarization is ventriloquism *until
citation is forced, and forcing it is cheap*: the discipline costs a schema, not a capability.
In the full-weight run the delete-what-you-cannot-cite rule bit twice, both times correctly:
it caught a corrupted citation hash before sealing, and it forced deletion of a
true-but-unwitnessable claim about an absence.

The protocol grew the event types this required, each with its own decision record:
`SealedReport` + report verification (`96be80e`, `DR-2026-07-12-claim-citation-events.md`),
`PrecedentReference` (`7ce3c07`, `DR-2026-07-12-precedent-as-citation.md`),
`GateRejectionRecorded` — gates witness their refusals (`21b688c`), and the silent-action
prohibition (`ed5f92d`, `DR-2026-07-12-silent-action-prohibition.md`). The whole chain —
probe, DR, proposal, predictions, findings — was itself sealed as a ClisTa thread
(`packages/protocol/runs/evidence-seal-2026-07-12/`, 14 events, all verifications passing).

## Act V — The documents catch themselves too

Ventriloquism is not a machine disease, and the story would be dishonest if it stopped at the
cache. Within a day, the same failure class surfaced twice more — in prose, written by the
people and models building the cure.

**The proposal couriered a stale fact.** Its distribution argument was framed around "the
September gate" — a public pre-commitment that had been *retired three weeks earlier*
(`pack/GATES.md`, commit `a13f982`, 2026-06-19). A conclusion served into a new world as if
freshly reasoned, by the document that named the failure class. The correction is preserved
visibly in the proposal rather than silently rewritten (`mutual-reliance-proposal.md` §1, §4,
revised in PR #4): the gate's retirement is disclosed, and the proposal recast as restoring
falsifiability in mechanical form — checks anyone can run, not dates anyone must trust.

**The public estate couriered it too.** The website, promotion plan, and positioning documents
all still advertised the retired gate as a live kill condition — a self-refuting credibility
claim one click away from the very link asking strangers to trust the record. Found during
outreach drafting (because the outreach would have sent people straight into it), fixed across
every surface the same day, with the retirement disclosed on-page rather than scrubbed
(launch-planning PRs #8–#11).

This is the recursion that gives the case study its name. The system caught itself at four
layers in twenty-four hours: a cache serving stale rationale, an audit path writing nothing, a
proposal arguing from a dead commitment, and a public site advertising one. In every case the
mechanism of the catch was the same — someone or something went back to the record instead of
trusting the summary.

## What this proves — and what it does not

It proves the mechanics: hash-chained witnessing works under live multi-agent load; forced
claim-citation produces reports that verify without being read; context-hashed precedent
recall distinguishes a collapsed economy from a renamed bank; and adversarial maker–checker
pressure changes outcomes on the record — the full-weight run's recommendation is not the one
the maker walked in with.

It does not prove the decisions are good. The chain proves *what was recorded and when* —
never quality. It does not yet prove independence: every run so far used registered writer
names, not signing keys (Commitment 4 is adopted but not landed), and every loop so far closed
with the founder or his tooling in the room. The one falsifier still open is the only one that
cannot be run from here: **T4, the skeptical human** — a real model risk officer, in front of
this artifact, unprompted and ungraded. The outreach built on this case study exists to fill
that slot (launch-planning `docs/outreach-framing.md`). If T4 fails, that goes in the ledger
too. Failed and abandoned runs are wanted evidence.

## Evidence index

| # | Artifact | Where |
|---|----------|-------|
| 1 | Three-phase probe + forensics (DR, accepted) | swarm repo `DR-hive-mind-cache-integrity.md`; exec `74890807-cccb-…` |
| 2 | Remediation: context-hash keys + precedent-as-citation, verified live | swarm repo merge `0ee49f0`; event streams `08bcadb`; defect fixes `2953187`, `438d4d2` |
| 3 | Mutual Reliance Proposal (revised, corrections visible) | `docs/new/mutual-reliance-proposal.md`; revision PR #4 (`75b7926`) |
| 4 | Pre-registered predictions + outcomes | `docs/decision-records/FINDINGS-T1-T2.md` (`0260327`) |
| 5 | Protocol growth: SealedReport, PrecedentReference, GateRejectionRecorded, silent-action DR | `96be80e`, `7ce3c07`, `21b688c`, `ed5f92d` + three DRs of 2026-07-12 |
| 6 | T1 toy + agent runs | `packages/protocol/runs/t1-agent-2026-07-12T01-19-55-836Z/` (thread `thd_sealed_run_mrh3w4h9_d5d01472`) |
| 7 | T1 full-weight sealed run (fraud threshold, 28 events, self-verifying) | `packages/protocol/runs/t1-claude-code-sealed-run-2026-07-12T01-42-20Z/` (PR #2, `5ac8a3c`) |
| 8 | Evidence chain sealed as a ClisTa thread | `packages/protocol/runs/evidence-seal-2026-07-12/` (`b9be54e`; head `93dd6c1d…f488c460`) |
| 9 | Gate retirement (the stale fact that got couriered) | `pack/GATES.md`, commit `a13f982`, 2026-06-19 |
| 10 | Public-estate correction + disclosure | launch-planning PRs #8, #9, #10, #11 |

*The leaning becomes mutual when neither party has to remember, and neither party has to be
believed. This document is the story of the first twenty-four hours of finding out what that
costs.*
