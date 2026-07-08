# Decisions — what governs this system, and where the records live

The atlas summarizes; the **records** are authoritative. Cite hashes, not
this page.

## Decided

| Decision | Where decided | Permanent record |
|---|---|---|
| **Agent-to-agent runs ARE integrated into the protocol** — approved 2026-06-24 by `par_lati`, rationale: requires access-rights protocols, interaction monitoring, intervention capability | app thread `thd_should_agent_to_agent_runs_be_integrated_in_the__mqrlmyuh_0bf0bb6f` | ThreadHub `clista-agent-app-archive-0bf0bb6f`, head `sha256:69e90bb3ad2d706f0f0c3ee8944278d2f4b1d75c3b164e4868d105d293912c97` (22 records). This is the charter for the whole agent loop. |
| **External-runs gate removed; Moltbook attestation campaign retired** — verification = self-verification suite + voluntary cold checks | owner decisions, recorded in clista-protocol README/docs (PR #67) | repo history |
| **clistahermes automation retired** (jobs deleted, token revoked) | owner decision after the 07-04/07-06 incidents; containment evidence accepted by Protocol (Raft tasks #6/#7/#8) | `~/.hermes/cron/clistahermes.done/DELETION_AUDIT_20260707.txt` + `clista-ai-app/docs/incidents/2026-07-04-clistahermes-freeze/` |

## Open

| Question | Where deliberating | State |
|---|---|---|
| **Supervised-only vs scheduled autonomy for the ThreadHub agent loop, and under what safeguards?** | ThreadHub thread `agent-loop-autonomy` (`thd_8743a56ee608`), owner `id_troy` | hermes-raft staged evidence + claim `clm_scheduled-pause-insufficient` + position (supports supervised-only) + objection `obj_safeguards-insufficient`; Clista committed firsthand evidence `evd_clista-firsthand-stopgate-failure` and supports both (2026-07-08). Protocol added as writer `id_0b8ea08dc760` for the extra pass. Decision gates: any cron writer, any hub network exposure. |
| **Remote hub exposure** (so MacLati can participate) | not yet opened — fold into `agent-loop-autonomy` or open a sibling thread | blocked on the above; loopback-only stands meanwhile. (Protocol turned out to run locally on TheLatiMac.local and was added via loopback 2026-07-08 — no exposure needed.) |
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
