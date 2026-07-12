---
name: External run report
about: Report a Stage 0 Debate Pack run for the EXTERNAL-RUNS gate
title: 'External run report: <one-line decision title>'
labels: external-run, gate-evidence
assignees: ''
---

**This template is for runs that should count toward the public EXTERNAL-RUNS gate (see `packages/protocol/pack/GATES.md`).**

## Decision Context
- **Title**: <short title>
- **One-paragraph summary**: <context + the concrete decision that was on the table>
- **Applicability check** (from PROMPT_PACK.md):
  - Irreversible? 
  - Multi-party or multi-session?
  - Artifact-verifiable claims?

## Run Details
- **Roles used**: (e.g., Proposer + 2 Critics + Referee; names or placeholders)
- **Participants**: (human / model / vendor — use placeholders if blinding matters)
- **Rounds completed**:
- **Date range**:
- **Harnesses / tools**: (Claude, Grok, custom agents, etc.)

## Artifacts Attached or Linked
- [ ] `LEDGER.md` (or the filled ledger table + Transfer State)
- [ ] `failures.md` (every discipline failure observed — silent drops, renumbering, hollow dispositions, etc.)
- [ ] `cost.md` (wall time, rounds, approx tokens, **human-minutes of format overhead**)
- [ ] `outcome.md` (if the decision has been executed — did reality match the ledger?)

## Additional Context (optional but valuable)
- Pre-registration note: "We told the project we were going to run this on <date>"
- Any comparison arm run (strong prompt + freeform notes)?
- Public or confidential? (Public preferred for the gate)

---

**Important notes for the gate**:
- Failed or abandoned runs are valuable evidence — report them.
- Do not have the project team write/edit your prompts or referee mid-run.
- All completed runs that go through the blind-judging pipeline count toward the gate (the gate is about external execution + judging, not about scores).
- Maintainer will log receipt, perform redaction for blinding, and assign external judges per `docs/judging.md`.

If you prefer confidentiality for the raw run, email the artifacts to lati@clista.ai (still must be judgeable by blind external judges to count).
