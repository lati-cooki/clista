# Transfer Prompt: ClisTa New Direction — Mutual Reliance Architecture
> **Provenance:** clista@21cee4b776c4403e6b9f3c20e2a82f0c7eff235e

Paste everything below this line into Claude Code from the root of `lati-cooki/clista-protocol`.

---

## Context

This directs the next phase of clista-protocol (Node.js, zero-dependency, CommonJS, `node --test`, 330-test gate, `node:sqlite`). It implements the **Mutual Reliance Proposal** (see `mutual-reliance-proposal.md`, attached/committed alongside this prompt): trust relocates from producers of work to verification of records. Three protocol-level commitments follow, each requiring a DR before code, per house pattern (pre-framing → DR → implementation slices → verify).

This is a SEPARATE workstream from the `clista-octopus-swarm` cache-integrity remediation. Do not modify the swarm repo here. The swarm findings are evidence inputs only.

## Evidence base (motivating findings — treat as fixed inputs)

On 2026-07-10/11 a three-phase probe of the swarm's Hive Mind cache demonstrated a failure class named **ventriloquism**: conclusions detaching from their evidence and being served into new contexts as if freshly reasoned. Observed at three layers:
1. **Cache layer** — a recalled rationale re-asserted the original query's facts into a materially different query (recession + doubled defaults answered with a pre-recession precedent, "no compelling evidence of performance degradation" served while the evidence sat in the logged prompt).
2. **Audit layer** — the recall path wrote NO record at all; two production decisions exist only as pastes in a chat transcript. Silence is a defect class distinct from corruption.
3. **Toolchain layer** — an orchestrating agent's task plan silently dropped its own verification gate; plans and summaries are lossy renderings of specs.

Full narrative and test program: `mutual-reliance-proposal.md`, sections 1, 3, 6. Reference DR: `DR-hive-mind-cache-integrity.md` in the swarm repo (read-only context).

## Slice 1 — DR: claim-citation report events (BLOCKING — do first)

Write `DR-claim-citation-events.md` deciding the event vocabulary for protocolized reports. The requirement: a report derived from a sealed thread must be structured as claims, where every claim carries a citation to an event hash within the same thread, with versioned rendering rules recorded in the thread.

The DR must weigh at least two options honestly:
- **Option A:** Extend `CrossThreadEvidence` to permit intra-thread (inward) references.
- **Option B:** New event type (working name `ReportClaim` or a single `SealedReport` event whose payload is an ordered list of {claim, cited_event_hashes[], rendering_rule_version}).

Decision criterion (non-negotiable): the resulting verification must be **mechanical** — three checks with no judgment: (1) chain verifies, (2) every cited hash exists in the chain, (3) coverage — no claim lacks a citation. If an option cannot support all three as pure functions, it loses. Record the losing option's rationale; dissent trail is the product.

## Slice 2 — DR: silent-action prohibition

Write `DR-silent-action-prohibition.md`: any action that shapes an output emitted from a ClisTa-governed system MUST produce a typed event at action time. Enumerate the initially covered action classes: recall/reuse of prior conclusions, arbitration/tie-breaking, gate rejections, and external evidence ingestion. Specify that reuse events and fresh-computation events are distinct types (the swarm's `RECALL` vs `CRYSTALLIZATION` split is precedent). State explicitly: **silence is a first-class defect, severity-distinct from corruption** — an absent record is unfalsifiable where a corrupted one is at least contestable.

## Slice 3 — DR: precedent-as-citation semantics

Write `DR-precedent-as-citation.md`: prior sealed conclusions may be reused only as tagged citations — carrying original thread/event reference, decision-relevant context hash, precedent age, and original decision date — and NEVER by serving the prior rationale verbatim, because justifications are indexed to facts. Rationale for a reused conclusion must be re-grounded against the live context or explicitly templated as a precedent reference (case-law model: cite the holding, never read the prior opinion's facts into the current record). Define the event shape (working name `PrecedentReference`). Specify fail-open direction: on any ambiguity about context match, systems fall back to fresh computation, never to stale recall.

## Slice 4 — Implement report verification (TDD)

Per the Slice 1 decision, implement in the protocol:
- The chosen event type(s), validated through the existing integrity module path (`prepareEventForAppend` in `src/gate.js` must accept/validate them like any event).
- `verifyReport(thread)` (or equivalent, matching existing API naming conventions) implementing the three mechanical checks. Pure function, zero deps, stdlib crypto only.
- Failure outputs must be specific: which claim, which missing hash, which uncovered claim — these messages are examiner-facing.
Tests first. The existing 330-test gate stays green throughout; new tests add to it, never modify sealed behavior.

## Slice 5 — T1 harness: single-prompt sealed run

Build the smallest live-witnessed run: an orchestrator script that spawns two writer roles — **maker** (proposes a toy decision) and **checker** (challenges it) — each appending events through the sidecar gate under distinct writer identities, ending in a seal. Two variants:
- **Deterministic variant** (scripted maker/checker payloads) — this one goes in the test suite.
- **Agent variant** (roles played by live model calls or subagents) — a runnable script, not a test; output threads saved to a `runs/` or equivalent artifacts dir.
Pass criterion (T1): the emitted thread passes existing chain verification. Nothing else counts.

## Slice 6 — T2 harness: ventriloquism diff

Build the diff tool: given a sealed thread containing a report (per Slice 1 vocabulary), extract every claim and verify coverage against the union of witnessed events. Output: list of unwitnessed claims (empty list = pass). This is `verifyReport`'s coverage check exposed as a CLI-usable command with human-readable output, because it will be run live in sales conversations.

## Slice 7 — Run T1/T2 and record outcomes against sealed predictions

Execute both harnesses. Predictions on record (from the proposal, sealed 2026-07-11, do not soften them):
- T1 passes within two attempts (hashes cannot be hallucinated; they must be computed).
- T2 **fails on attempt one** for the agent variant — summarization is ventriloquism until every sentence is forced to cite a witness.
Record actual outcomes honestly in a findings note appended to `DR-claim-citation-events.md` or a dedicated `FINDINGS-T1-T2.md`. If a prediction was wrong, say so plainly — the miss is evidence too.

## Slice 8 — Seal the evidence chain

Create a real ClisTa thread (using the new machinery once T1 passes) that seals the night's evidence: the three swarm probe prompts and their outcomes, the silent-recall forensics finding, `DR-hive-mind-cache-integrity.md` (by reference/hash), `mutual-reliance-proposal.md` (by reference/hash), and the three new DRs. This thread is the first public-ready case study — "the night the system caught itself" — and the seal the founder was promised.

## Atlas maintenance (same-commit rule)

`lati-club/clista-atlas` is derivative of this repo per DR-canonical-source.md. Update the **decisions** and **architecture** pages in the same commits that land the three DRs and the new event types. Do not let the atlas drift.

## Constraints & Non-Goals

- Zero dependencies. CommonJS. `node --test`. `node:sqlite`. No exceptions, no dev-dep creep.
- Do NOT modify clista-octopus-swarm in this workstream.
- Do NOT redesign Thread Hub; if the new event types require Thread Hub schema awareness, file an issue with the required delta — implementation is a separate pass.
- Do NOT address the Apex Arbitrator confidence-labeling problem here; it belongs to the swarm workstream and its own DR (noted in the proposal, section 7).
- Sept 7 gate reframing ("five pasted prompts") is strategy, not code — out of scope beyond making T1's agent variant genuinely paste-and-run for an external party (single command, readable output, no key material touched by writers per Thread Hub custodial model).

## Definition of Done

1. Three DRs committed (Slices 1–3), atlas updated same-commit.
2. `verifyReport` + new event types implemented, full suite green (existing 330 + new).
3. T1 and T2 executed in both variants; outcomes recorded against the sealed predictions, honestly.
4. Evidence thread from Slice 8 sealed and passing verification — paste its thread ID and verification output at the end of your final summary. Claims without that witness don't count as done.
