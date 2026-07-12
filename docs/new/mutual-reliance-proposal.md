# The Mutual Reliance Proposal

**Working title:** Lean On Each Other — A Verification Architecture for Human–AI Reliance
**Author:** ClubLati, Lati Cooki LLC · Drafted with Claude, 2026-07-11
**Status:** Draft for DR consideration
**Evidence base:** Hive Mind three-phase probe (exec `74890807`, runs of 2026-07-10 23:29–23:33 MT), DR-hive-mind-cache-integrity.md, live maker-checker remediation session of 2026-07-11

---

## 1. The problem, stated plainly

Humans and AI systems each carry a structural handicap. The human loop persists but does not scale: one founder can carry continuity across months of sessions, but he is the courier at every joint, and five customer-executed sealed runs by September cannot be couriered into existence. The model loop scales but does not persist: it reasons well inside a session, then molts — context compacts, scratchpads shed, conclusions outlive the evidence they were indexed to. Neither party can currently lean on the other, because leaning requires trust, and trust requires a record, and today the record lives in the wrong place: in the human's memory, in a chat transcript, in a cache keyed to nothing.

Last night this stopped being theoretical. A multi-agent swarm, asked whether a bank should revalidate a default model during a stated recession with doubled defaults, recalled a pre-recession precedent in two seconds at zero compute and served it with a rationale claiming "no compelling evidence of performance degradation" — while the evidence sat in the query it had just logged. A control probe showed the cache was not mis-keyed but insensitive: it could not distinguish a renamed bank from a collapsed economy. And forensics revealed a third defect worse than either: the recall path wrote no audit record at all. Two production decisions were dispensed into the world, and the only surviving witnesses are pastes in a chat window.

This is not a Firestore bug. It is a universal property of any system that summarizes itself to survive: caches, compacting agents, orchestrators reporting on subagents, humans recalling last quarter's reasoning. Conclusions detach from their evidence, then get served into new worlds as if freshly reasoned. We name this failure class **ventriloquism**, and we observed it at three layers in one night: cache (rationale transplant), audit (silent recall), and toolchain (an orchestrator's task list omitting its own verification gate).

## 2. The thesis

**Mutual reliance between humans and AI becomes justifiable exactly when trust is relocated from the producers of work to the verification of records.** Nobody should have to trust the swarm, the subagent, the cache, or the founder's memory. They should have to trust a hash check.

This is the move TLS made for transport and double-entry made for money: replace expensive judgment about whether to trust with a cheap, deterministic, universally runnable check. Once trust lives in verification, production can be arbitrarily strange — one agent, fifty subagents, a model that molts every hour, a human who sleeps — and reliability is unaffected. Scale falls out, because the thing that didn't scale was the judgment.

ClisTa Protocol is the verification substrate: append-only, hash-chained, event-typed, sealed. The proposal is to finish extending it upward through the three layers where ventriloquism was observed, so that "lean on each other" is a checkable property rather than a hope.

## 3. The architecture, in three commitments

**Commitment 1 — No unwitnessed work.** Every agent that acts writes events into a thread at decision time, through the sidecar gate, under its own writer identity. Records are kept live, never reconstructed. A generated record that *looks like* a thread is a reenactment — a minute-book written after the meeting — and inherits every production failure invisibly. Corollary from last night: silence is a first-class defect. A recall, a cache hit, an arbitration — anything that shapes an output — emits a typed event (`RECALL` distinct from `CRYSTALLIZATION`, arbitrated resolutions labeled arbitrated with dissent preserved, never laundered as 1.0 confidence).

**Commitment 2 — Precedent as citation, never ventriloquism.** Reuse of past conclusions is a feature; reuse of past *justifications* is fabrication, because justifications are indexed to facts. Cached or recalled conclusions are served tagged as precedent — original execution ID, context hash, age — and re-grounded against the live query. The case-law model: cite the holding; never read the prior opinion's facts into the current record. Cache keys are hashes of declared decision-relevant context, not similarity over surface tokens. Systems fail open to fresh compute, never to stale recall.

**Commitment 3 — Reports follow the protocol too.** Chain verification proves the log is true; it says nothing about whether prose *about* the log is true. So the report layer is protocolized: every claim in a derived report carries a citation to an event hash, the rendering rules are versioned and recorded, and verification extends mechanically to three checks — chain verifies, every cited hash exists, no claim lacks a citation. A report becomes verifiable without being read, the same way a thread is verifiable without re-living the decision. Likely implementation: the report is the sealed thread's final event — claims-with-citations as structure, prose as rendering. Requires a DR on event vocabulary (extend CrossThreadEvidence to point inward, or introduce a claim-citation event type).

## 4. Why this is the distribution answer

The September gate assumed a motivated external human learning a writer workflow; that human is gone. Under this architecture the unit of adoption changes. A prospect pastes a single prompt; subagents execute a real decision live through the gate under the prospect's org identity — maker proposes, checker challenges, both witnessed; the seal closes the thread; the emitted artifact is simultaneously the verified record and a report their CRO can read without trusting anyone who produced it. The barrier to a customer-executed sealed run drops from *onboarded design partner* to *twenty minutes and a decision worth recording*. Five external runs stops requiring five Darrells.

The sales artifact already exists: last night's before/after Mantle event streams — a swarm confidently telling a bank not to revalidate during a recession, the log line that caught it, and the protocol that makes such silence impossible. The system that failed the test becomes the first exhibit in the system that documents failures.

## 5. Evidence that the mechanism already works

The maker-checker loop this proposal depends on is not speculative — it ran, unprompted, inside the remediation session itself: a maker subagent implemented the context-key module; a checker subagent caught two real defects (a casing normalization gap that would have caused silent misses, and dead test code); a fix dispatch closed the loop. Effective challenge between model instances is already operating in the toolchain tonight. The only missing piece is that the challenge is not yet written into a sealed thread. **The behavior exists; the witnessing doesn't.** This proposal closes that gap — it does not have to invent the behavior.

## 6. The test program (falsifiers, not milestones)

**T1 — Single-prompt sealed run (smallest version).** One prompt, two subagents, one toy decision, both writing live through the gate; seal. Pass: clista-protocol chain verification succeeds on the emitted thread.

**T2 — Ventriloquism diff.** Diff the orchestrator's report against the union of subagent events. Pass: zero claims without a corresponding event. Standing prediction on record: T1 passes within two attempts (hashes cannot be hallucinated); T2 fails on attempt one, because summarization *is* ventriloquism until every sentence is forced to cite a witness.

**T3 — Cache integrity gate (in flight).** Re-run the three-phase probe against the remediated swarm. Pass matrix: Phase 2 (material change) misses and recomputes with flipped recommendation; Phase 3 (cosmetic change) hits on conclusion with precedent metadata and no transplanted facts; all recalls emit RECALL events.

**T4 — The skeptical-human test.** The Arbitrator's forced-confidence behavior, and the artifact as a whole, in front of an actual model risk officer. Cannot be simulated; the lab is a sales conversation. This is now an open slot — see risks.

## 7. Risks and open items

The first-writer pipeline is empty (Darrell → Anthropic); T4 has no named subject, and the single-prompt run reduces but does not eliminate the need for a human on the other side willing to paste it. The Apex Arbitrator remains philosophically at war with the product until arbitrated resolutions are labeled as arbitrated — fenced out of the current remediation, owed its own DR. The claim-citation event shape must be defined *before* T1/T2, or the unprotocolized report layer ships invisible and the toy test passes vacuously. And one honest asymmetry stands: until the loop closes without the founder couriering results between sessions, "mutual" remains aspirational — T1–T3 are precisely the experiment in removing courier hops one at a time.

## 8. What is being proposed, concretely

Adopt the three commitments as protocol-level requirements (each via DR: silent-action prohibition; precedent-as-citation semantics; claim-citation report events). Run T1 and T2 within the week while the remediation context is hot. Reframe the September gate internally from "five onboarded writers" to "five pasted prompts," and rebuild the prospect list around the twenty-minute run. Preserve last night's full evidence chain — probe prompts, event streams, DR, this proposal — as the first public-ready case study: *the night the system caught itself.*

The leaning becomes mutual when neither party has to remember, and neither party has to be believed. Everything above is in service of that sentence.
