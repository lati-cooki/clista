# Decision Record: The Record Is the Interface (publication gate, public viewer, single-source verifier)
> **Provenance:** clista@4de4c24b99f205e9d94c975cc116460b4be20aed

**Status:** ADOPTED by owner direction 2026-07-13. Agent-authored draft
without a separate challenge pass — disclosed, per the 2026-07-10 monorepo
precedent. Seal Pending — the controller seals.
**Decision owner:** troy_builds
**Date raised:** 2026-07-13
**Applies to:** `packages/threadhub` (server read surfaces, viewer,
standalone checker), `packages/protocol` (event-type registry), `docs/`
(this atlas)
**Evidence base:** the owner's first-user-journey diagnosis (2026-07-13
doctrine, quoted below); the gate case study
`docs/case-studies/the-night-the-system-caught-itself.md`;
DR-phase5-topology rules 1.3, 3.1–3.3, 5.3; DR-2026-07-12-curation-check
(`DISSENT_BEARING_TYPES`)

---

## Decision Question

The first invited skeptics land on the public thread surface before they
land on anything else. Owner doctrine, verbatim: *"The record is the
interface." The corrected first-user journey: read the record, watch it
verify, then get handed the pen — the trust posture turned into UX.* A
public thread viewer, an in-browser verifier, and the door those two open
raise four questions that must be answered as doctrine, not as viewer CSS:

1. What may a public surface show — the record, or a narrative about it?
2. What makes a sealed thread *public*? The owner's diagnosis, verbatim:
   *a public thread viewer quietly converts every sealed thread into a
   potentially public thread… Otherwise slug knowledge equals read access
   and you've built an accidental disclosure channel into the front door.
   Unguessable slugs are not access control.*
3. Where does the in-browser verifier's code come from? Verbatim: *the
   in-browser verifier must be the same code, not a sibling — a second
   verifier is a second source of truth, which is the one thing this
   architecture forbids.*
4. How does dissent render? Verbatim: *every governance UI buries dissent
   below the outcome; this is the one product where the argument is the
   merchandise. Make the reversal the most readable thing on the page.*

The blocking question is (2): what vocabulary carries the publication act,
and where does it live?

## Options Considered

**Option A — Hub-level `attestation`-kind publication marker, no registry
vocabulary.** Append a `kind: "attestation"` (or `note`) record whose
payload says "this thread is public"; the hub's filter greps for it.

*Rejected.* Publication is a governance act — authored, timestamped,
revocable, consequential — and other emitters (the studio's seal flow, a
Phase 6 swarm surface, any future curator) will need to speak it.
Unregistered vocabulary is exactly how the `RECALL` collision happened
(DR-phase5-topology Decision 3): two systems meaning different things by
the same private name, resolved only after the fact by a family-qualifying
rule. A publication marker held by hub convention would also be invisible
to the protocol validator and projector — an act that shapes what the
public sees, carried by a shape no gate checks. The registry's
three-coordinated-edits discipline exists to make that class of drift
loud.

**Option B — Implicit publication: serve every sealed/valid thread.**

*Rejected outright.* This is the accidental disclosure channel named in
the doctrine: sealing witnesses a decision, it does not consent to
publishing it. Slug knowledge would equal read access.

**Option C — Registered protocol vocabulary: `ThreadPublished` /
`ThreadPublicationRevoked`, appended to the thread itself.**

*Accepted.* The publication act is a sealed event in the thread it
publishes: authored, timestamped, appended through the normal write path,
revocable only by appending the revoke event. The effective state is the
LAST publication event on the thread. The controller's prior held under
scrutiny of the code: `packages/protocol/src/event-types.js` had no
publication type (checked 2026-07-13, 107 types, none carrying
publication semantics), so the registry gains the pair via the
three-coordinated-edits discipline (registry + validator + projector,
conformance-tested). Payload:
`{threadPublication: {id, threadId, action: "publish"|"revoke",
publishedByParticipantId, publishedAt, scope: "public-read", note?}}`.
Today the act lands on the hub as a normal appended record under the
custodial operator author — custody regime disclosed per DR-phase5-topology
rule 5.3.

## Decision

Adopt Option C for the publication vocabulary, and bind the surface
doctrine. Binding rules:

1. **The record is the interface.** Public surfaces render the record
   itself: the witnessed sequence, in witnessed order. Narrative chrome
   (headings, styling, summaries, badges) never replaces, reorders, or
   elides the witnessed sequence. A public page whose prose disagrees with
   its records is defective by definition — the records govern.

2. **Publication is a witnessed per-thread act.** A thread becomes
   publicly readable only through an explicit `ThreadPublished` event
   appended to that thread — authored, timestamped, sealed into the chain
   — and stops being publicly readable only through an appended
   `ThreadPublicationRevoked`. The effective state is the last publication
   event on the thread (`scope: "public-read"` is the only scope defined
   today; an unregistered scope publishes nothing — fail closed). Public
   read surfaces serve ONLY effectively-published threads: listings,
   exports, verification reports, single records fetched by hash, and the
   viewer. Nothing else on the public surface may disclose that an
   unpublished thread exists.

   **Publication AUTHORITY is currently a deployment property, not a hub
   property.** The hub validates a publication act's shape and position,
   never its author's standing: `hub.append` accepts any existing custodial
   identity as author for any thread, and `POST /identities` is open. On an
   exposed, unproxied write surface an outsider could therefore mint an
   identity and append a well-formed `ThreadPublished` to any slug —
   granting themselves read access through the write path — or
   revoke-vandalize a published thread. So this rule's access-control claim
   holds ONLY where the write surface is proxied away or disabled; any
   public exposure MUST do one or the other. Binding publication authority
   to specific identities in the hub itself is named future work: it would
   be the hub's first authorization concept, and it is deliberately not
   smuggled in through this record.

3. **Dissent-forward rendering.** Events whose payload event type is in
   the protocol registry's `DISSENT_BEARING_TYPES`
   (`packages/protocol/src/event-types.js`,
   DR-2026-07-12-curation-check rule 1 — the mechanical definition of
   what must be foregrounded) render with visual weight greater than or
   equal to the conclusion's. Concessions, the reversal, and the surviving
   objection are styled first-class; the reversal is the most readable
   thing on the page. A renderer that buries dissent below the outcome
   violates this rule even if every record is technically present.

4. **Single-source verifier.** Any in-browser verification MUST execute
   the byte-identical artifact served at `/verify.mjs` — the same
   URL/bytes the skeptic is told to save — via a direct module import of
   that URL. A reimplementation, port, bundle, or "browser build" of the
   checker is forbidden as a second source of truth. Implementation
   identity is a build-level guarantee: there is no build step to drift,
   and the served-bytes-equal-repo-file test plus the viewer-references-
   exactly-`/verify.mjs` test state it in the spec. The checker's standing
   caveat travels with the button: host-served verification is a
   convenience; save the file and run it elsewhere for independence.

5. **Enumeration posture.** Slugs are names, not credentials. The
   publication filter of rule 2 is the access control; unguessable slugs
   are not. From outside, an unpublished thread and a nonexistent thread
   MUST be indistinguishable — same status, byte-identical response body —
   on every public read surface, so that probing the namespace teaches an
   outsider nothing the record has not published.

## Evidence Basis

- **The first-user-journey diagnosis** (owner doctrine, 2026-07-13,
  quoted verbatim in the Decision Question): the corrected journey is
  read the record → watch it verify → get handed the pen. This DR is that
  posture bound as rules, adopted before the first invited skeptic
  arrives.
- **The gate case study**
  (`docs/case-studies/the-night-the-system-caught-itself.md`): the
  argument is the merchandise — the case study's force comes from
  witnessed dissent (the objection that changed the outcome), which is
  exactly what rule 3 forbids burying, and its "re-verify rather than
  believe" instructions are the loop rule 4 turns into a button.
- **The `RECALL` collision** (DR-phase5-topology Decision 3): the
  standing exhibit for what unregistered vocabulary does — decides
  Option A's rejection.
- **DR-phase5-topology rule 5.3:** custodial publication acts are
  verifiable but independence-downgraded; the custody regime is disclosed
  on the surface that serves them (the viewer's custody footer).
- **DR-2026-07-12-curation-check:** `DISSENT_BEARING_TYPES` already
  exists as the registry's mechanical dissent enumeration; rule 3 reuses
  it rather than minting a second judgment.

## Consequences Accepted

- **The read gate trusts the deployment to close the write gate.** Rule 2
  filters reads; it grants no one publication authority, because the hub
  has no authorization concept to grant it with. Until that future work
  lands, the boundary of "who may publish" is exactly the boundary of "who
  can reach the write surface" — accepted, stated in rule 2, and binding
  on every exposure.
- **Publishing is a deliberate extra step.** Every thread meant for the
  public needs an explicit witnessed act, including demo and founding
  threads. Accepted: the step IS the control.
- **Publication history is public forever.** A published-then-revoked
  thread's publication history remains in the (now unpublished) record;
  revocation hides the thread from the public surface but cannot unshow
  what was already read. Disclosed, not solved — append-only means
  revocation is prospective only.
- **The dissent set is inherited, not re-judged.** Rule 3 binds to
  `DISSENT_BEARING_TYPES` as maintained under the curation-check DR; a
  type wrongly missing there renders un-foregrounded here too. One
  enumeration, one place to fix it.
- **Two more registry types** for every conformance surface to carry
  (validator, projector, app vendoring at the next de-vendor pass).
- **WebCrypto reach:** making the one checker run in browsers moves its
  sha-256 to `globalThis.crypto.subtle` and makes Ed25519 signature
  verification feature-detected — environments without WebCrypto Ed25519
  get an honest "signature verification unavailable in this environment"
  disclosure instead of a silent skip. The single-source rule is judged
  worth this honesty-preserving degradation.

## Amendments

- **2026-07-13 (pre-seal):** the review pass on this slice probed the hub
  and found rule 2's access-control claim understated its precondition —
  the hub validates a publication act's shape, never its author's
  standing, so on an unproxied write surface any mintable identity could
  publish or revoke any thread. Resolved before seal: rule 2 now states
  that publication authority is a deployment property (write surface
  proxied away or disabled on any public exposure), the third-party
  publication/revocation consequence is named, and hub-level publication
  authorization is recorded as future work rather than smuggled in; a
  matching entry added to Consequences.

## Seal

Seal Pending — the controller seals. This DR adopts by owner direction
2026-07-13; the sealed evidence thread lands through the studio seal flow
and this section is amended post-seal, per the append-only rule.
