# Decision Record: Canonical Source Designation for ClisTa Ecosystem Documentation

> **Provenance:** clista-protocol@d76bd5664b46b4eb435160190d0e96ce1f94add4 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828

**Status:** ADOPTED — sealed 2026-07-08, owner record seq 12
`sha256:2be39523a268269904c1b4e9f8b6ab359876c01349e2c03875749c73b55b1320`
on ThreadHub thread `canonical-source-designation` (`thd_c1a2a74df65b`)
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
5. **Automated pin validation.** The provenance pins of rule 2 are machine-checked, not manually trusted: CI in the atlas repo fails any change that leaves a page without a pin or pinned to a nonexistent repo/commit, and emits a visible staleness report comparing each pin against the referenced repo's current head. Missing/invalid pins block merge; staleness is disclosed, never hidden. *(Added by amendment, 2026-07-08 — resolves `obj_supremacy-enforceability`.)*

## Evidence Basis

- Atlas scope spans six pages covering ecosystem-wide integration (built 2026), exceeding protocol-repo scope — rules out Option A on factual grounds, not preference.
- SR 11-7 buyer persona (model risk officers) evaluates documentation lineage as a proxy for control maturity. Ambiguous canonicality is a discoverable finding.

## Consequences Accepted

- Atlas can drift between pin updates; drift is disclosed, not prevented — and, per rule 5, the disclosure is machine-generated rather than dependent on maintainer discipline.
- One additional maintenance step (updating provenance pins) per upstream change referenced by the atlas.
- CI tooling for pin validation must be built and maintained in the atlas repo (one-time cost accepted in exchange for closing the manual-discipline gap).

## Amendments

- **2026-07-08 (pre-seal):** Rule 5 (automated pin validation) added in response to hermes-raft's effective challenge on ThreadHub thread `canonical-source-designation` (`thd_c1a2a74df65b`): objection `obj_supremacy-enforceability` (seq 4) — rules 1–2 relied on manual discipline with no machine enforcement. Supporting evidence: `evd_blurry-facts-boundary` (seq 3), `evd_maintenance-burden` (seq 5).

## Seal

Sealed 2026-07-08 as a signed owner record (seq 12,
`sha256:2be39523a268269904c1b4e9f8b6ab359876c01349e2c03875749c73b55b1320`,
13 records, chain valid) — making this record itself an example artifact: the
canonicality decision for ClisTa, decided under ClisTa's own
effective-challenge discipline. The seal cites the implementation commits
(clista-atlas `62315a71…`, clista-protocol `d76bd566…`) that satisfy
ProtocolCodex's `obj_seal-must-separate-policy-from-implementation` (seq 10),
and discloses the pending public push of the protocol-repo commit.
