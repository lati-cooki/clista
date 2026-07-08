# Decision Record: Canonical Source Designation for ClisTa Ecosystem Documentation

**Status:** Proposed (pending seal)
**Decision owner:** troy_builds
**Date raised:** 2026-07-08
**Applies to:** `lati-cooki/clista-protocol`, `lati-club/clista-atlas`

---

## Decision Question

Two repositories currently present as canonical sources for the ClisTa ecosystem. Which is authoritative, and what is the declared relationship between them?

## Challenge (Effective Challenge Trigger)

**Challenger claim:** A protocol whose value proposition is verifiable provenance cannot itself have ambiguous provenance. Two repos with implicit canonical status is a self-referential integrity failure — the kind an auditor or model risk officer is trained to find first.

**Challenge severity:** High. This is not cosmetic; it undermines the sales narrative for Challenge Record ("one verifiable source of truth") at the exact moment external writers (Darrell / Far Gradient) are being onboarded.

## Options Considered

**Option A — Consolidate:** Move the atlas into `clista-protocol` as `/atlas`. Single commit history; same-commit maintenance rule enforceable in one repo.
- *Rejected because:* The atlas documents the ecosystem (Thread Hub, Octopus, integration surfaces), not only the protocol. Consolidation would either scope-creep the protocol repo or truncate the atlas.

**Option B — Designate and demote:** `clista-protocol` is the sole authoritative source for protocol facts. `clista-atlas` is explicitly derivative: authoritative for *navigation*, never for *facts*.
- *Accepted.*

## Decision

Adopt Option B with the following binding rules:

1. **Supremacy clause.** Atlas README declares: in any conflict, the artifact repo (protocol, Thread Hub, Octopus) governs; the atlas yields.
2. **Provenance pinning.** Every atlas page carries a source line citing the repo + commit hash it was written against. Stale pins are visible, not hidden.
3. **Same-commit rule scoped.** The existing same-commit maintenance rule applies within the atlas; cross-repo freshness is tracked via the provenance pins, not promised.
4. **Single entry point.** External-facing materials (clista.ai, sales decks, Darrell onboarding) link only to `clista-protocol` as the canonical home; the atlas is linked *from* it, never presented in parallel.

## Evidence Basis

- Atlas scope spans six pages covering ecosystem-wide integration (built 2026), exceeding protocol-repo scope — rules out Option A on factual grounds, not preference.
- SR 11-7 buyer persona (model risk officers) evaluates documentation lineage as a proxy for control maturity. Ambiguous canonicality is a discoverable finding.

## Consequences Accepted

- Atlas can drift between pin updates; drift is disclosed, not prevented.
- One additional maintenance step (updating provenance pins) per upstream change referenced by the atlas.

## Seal

To be sealed as a signed event in Thread Hub upon adoption, making this record itself an example artifact: the canonicality decision for ClisTa, decided under ClisTa's own effective-challenge discipline.
