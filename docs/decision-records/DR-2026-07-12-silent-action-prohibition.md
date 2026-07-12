# Decision Record: Silent-Action Prohibition
> **Provenance:** clista@7ce3c0754504f6457df7a7b5adbbb78c6bcb88ab

**Status:** ADOPTED by owner direction — Mutual Reliance transfer prompt
(committed `c56b406`, drafted 2026-07-11), Slice 2. Agent-authored draft
without a separate challenge pass — disclosed, per the 2026-07-10 monorepo
precedent. Evidence chain seals in Slice 8.
**Decision owner:** troy_builds
**Date raised:** 2026-07-12
**Applies to:** every ClisTa-governed system (protocol engine + gate, the
app cockpit, harnesses, and any future swarm/orchestrator integration)
**Evidence base:** `docs/new/mutual-reliance-proposal.md` §1, §3
Commitment 1; Hive Mind probe forensics of 2026-07-10/11 — the recall path
that wrote NO audit record, leaving two production decisions witnessed only
by pastes in a chat transcript

---

## Decision Question

The 07-10/11 probe found a defect class worse than corruption: an action
that shaped a production output and left *no record at all*. A corrupted
record can be contested — it exists, it can be diffed, hashed, challenged.
An absent record is unfalsifiable: there is nothing to challenge, and the
output it shaped circulates as if freshly reasoned. What does the protocol
require so that this class is structurally impossible rather than merely
discouraged?

## Decision

**Any action that shapes an output emitted from a ClisTa-governed system
MUST produce a typed event at action time.** Binding rules:

1. **At action time, not after.** Records are kept live, never
   reconstructed. A record generated after the fact — however accurate —
   is a reenactment (a minute-book written after the meeting) and inherits
   every production failure invisibly. Post-hoc reconstruction does not
   satisfy this DR.
2. **Initially covered action classes** (the floor, not the ceiling):
   - **Recall / reuse of prior conclusions** — serving a cached, remembered,
     or precedent conclusion into a new context.
   - **Arbitration / tie-breaking** — any resolution between conflicting
     inputs, including forced-confidence collapses. Arbitrated resolutions
     are labeled arbitrated, with dissent preserved — never laundered as
     unanimous or confidence 1.0.
   - **Gate rejections** — a gate that refuses an append has shaped the
     output (the record that *isn't* there). The ClisTa sidecar gate itself
     was in this class at adoption time: a rejected `decision propose`
     appended nothing. **CLOSED 2026-07-12** by `GateRejectionRecorded`:
     both gates (`decision propose` and the harness `appendThroughGate`)
     now witness every refusal with a typed event carrying the gate name,
     the candidate's event type, the candidate's content hash (existential
     rejections; structural refusals never prepare a candidate), the
     engine's own reasons, and the refused writer. Residual boundary, on
     record: a rejection whose witness cannot itself validate (empty log,
     undeclared writer, already-broken log) appends nothing and is reported
     `rejectionWitnessed: false` — the gate never corrupts the log in order
     to witness a refusal.
   - **External evidence ingestion** — evidence entering from outside the
     governed boundary (API results, file reads, human paste-ins).
3. **Reuse and fresh computation are distinct event types.** A consumer of
   the log must be able to tell mechanically whether a conclusion was
   computed against the live context or served from a prior one. The
   swarm's `RECALL` vs `CRYSTALLIZATION` split is the precedent; the
   protocol-grammar shapes for these arrive with the Slice 3 DR
   (`PrecedentReference`) and subsequent implementation slices — this DR
   fixes the *requirement*, not the shapes.
4. **Silence is a first-class defect, severity-distinct from corruption.**
   In any ClisTa audit vocabulary, examiner output, or severity taxonomy:
   an absent record ranks *above* a corrupted one, because a corrupted
   record is at least contestable while an absent one is unfalsifiable.
   Tooling that reports integrity failures must have a distinct category
   for "action known/inferable but unwitnessed," never folding it into
   "chain invalid."

## Options Considered

**Option A — Best-effort logging convention (document it, encourage it).**
*Rejected:* the 07-06 clistahermes breach already demonstrated that
convention-held state does not survive infrastructure changes (pause state
lived only in `jobs.json`; an update rewrote it). The probe's silent recall
is the same lesson at the record layer: anything not structurally required
will eventually be skipped, and its absence is undetectable by design.

**Option B — Require typed events at action time for every covered class.**
*Accepted* — as stated in the rules above. Cost: grammar growth (a rejection
event type, ingestion event types) and chattier logs. Both accepted: the
log's purpose is to be the witness, and an unwitnessed action is precisely
the product's failure mode.

## Consequences Accepted

- Ledgers get longer; projection/query tooling must stay useful at higher
  event volume.
- The sidecar gate's reject-silently behavior was a *known nonconformance*
  at adoption, disclosed above rather than hidden; it was closed 2026-07-12
  (see rule 2). The disclosed residual is narrower: refusals whose witness
  cannot itself validate remain unwitnessed in-log and are surfaced only in
  the gate's return value.
- "Action time" pins event emission to the acting process; systems that
  cannot write at action time (network partition, crashed sidecar) must
  fail the action rather than act unwitnessed — fail-closed is implied and
  intended.
