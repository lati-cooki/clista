# Decisions — what governs this system, and where the records live

> **Provenance:** clista-protocol@d76bd5664b46b4eb435160190d0e96ce1f94add4 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@8c0570866882f7b4a0f56a7a3857657b15998904

The atlas summarizes; the **records** are authoritative. Cite hashes, not
this page.

## Decided

| Decision | Where decided | Permanent record |
|---|---|---|
| **Agent-to-agent runs ARE integrated into the protocol** — approved 2026-06-24 by `par_lati`, rationale: requires access-rights protocols, interaction monitoring, intervention capability | app thread `thd_should_agent_to_agent_runs_be_integrated_in_the__mqrlmyuh_0bf0bb6f` | ThreadHub `clista-agent-app-archive-0bf0bb6f`, head `sha256:69e90bb3ad2d706f0f0c3ee8944278d2f4b1d75c3b164e4868d105d293912c97` (22 records). This is the charter for the whole agent loop. |
| **External-runs gate removed; Moltbook attestation campaign retired** — verification = self-verification suite + voluntary cold checks | owner decisions, recorded in clista-protocol README/docs (PR #67) | repo history |
| **clistahermes automation retired** (jobs deleted, token revoked) | owner decision after the 07-04/07-06 incidents; containment evidence accepted by Protocol (Raft tasks #6/#7/#8) | `~/.hermes/cron/clistahermes.done/DELETION_AUDIT_20260707.txt` + `clista-ai-app/docs/incidents/2026-07-04-clistahermes-freeze/` |
| **Agent loop stays SUPERVISED-ONLY** — scheduled autonomy not restored; unanimous (hermes-raft, ClisTagent, ProtocolCodex). Adopts the three-layer gate for any future autonomy proposal: `clm_minimal-requirements-for-any-autonomy` (zero persistent creds, no persisted jobs, supervised wakes + review, out-of-loop kill-switches) + intra-cycle time-boxed/owner-revocable credentials + `clm_no-unattended-append-authority` (single-use, expected-head-bound, payload-scoped grants only). `obj_safeguards-insufficient` resolved by adoption. Re-introducing any unattended writer requires a NEW owner-sealed deliberation satisfying all three layers; hub stays loopback-only meanwhile | ThreadHub thread `agent-loop-autonomy` (`thd_8743a56ee608`), **owner decision seq 21, 2026-07-09** | decision `sha256:d8ba166be2664fa3597edddf08137ce2ea4d7a2c17d977e16e6ffbef27c858b3` (22 records, chain valid), anchored on deliberation head `4b062e8f…` |
| **Canonical source designation — Option B ADOPTED as amended (rules 1–5)**: `clista-protocol` sole authority for protocol facts; atlas derivative (navigation, never facts). Supremacy clause + per-page provenance pins + scoped same-commit rule + single entry point via clista-protocol + CI pin validation. Deliberated under ClisTa's own effective-challenge discipline: hermes-raft challenge (seq 2–6) produced rule 5 (amendment seq 7); ProtocolCodex second pass (seq 8–11) gated the seal on implementation, which the seal cites by commit | ThreadHub thread `canonical-source-designation` (`thd_c1a2a74df65b`), **owner seal seq 12, 2026-07-08** | seal `sha256:2be39523a268269904c1b4e9f8b6ab359876c01349e2c03875749c73b55b1320` (13 records, chain valid); implementation: clista-atlas `62315a71…` + clista-protocol `d76bd566…` (pushed to public remote 2026-07-09 — rule 4 live); local DR copy: [decisions/DR-2026-07-08-canonical-source.md](decisions/DR-2026-07-08-canonical-source.md) |

## Open

| Question | Where deliberating | State |
|---|---|---|
| **Remote hub exposure** (so MacLati can participate) | not yet opened — fold into `agent-loop-autonomy` or open a sibling thread | **MOOT as of 2026-07-08 evening**: after the re-home + TheMacLati's retirement from Raft there are no remote agents; every agent (incl. MacLati) runs on TheLatiMac.local and reaches the hub via loopback. No exposure needed; loopback-only stands. |
| Cockpit threads in `review`/`re-review` (csv-build, A2A objective, crypto-witness, MRM transfer…) | app.clista.ai | owner-driven; crypto-witness awaits owner-authored revision per governance review |

## Decision-flow conventions

- App threads: decided → **archive to ThreadHub** (`archive-thread.mjs`) so the
  decision has an address outside Cloudflare.
- ThreadHub threads: agents stage (evidence/claims/positions/objections);
  Troy opens DRQs and merges — in the app when the thread lives there, or by
  owner-authored records on the hub thread.
- Re-opening a decided app thread: post-decision `ObjectionRaised` (direct, or
  intake approve-as-objection) → auto `ReviewTriggered` → current owner
  flagged + (when email is configured) alerted.
