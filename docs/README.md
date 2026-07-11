# ClisTa Atlas

> **Provenance:** clista-protocol@d76bd5664b46b4eb435160190d0e96ce1f94add4 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@8c0570866882f7b4a0f56a7a3857657b15998904

The integration map for the ClisTa ecosystem — every repo, service, agent,
identity, and data flow, in one place. **Private.** This is the answer to
"what talks to what, as whom, with which key."

> **Authority** *(monorepo consolidation decision,
> `monorepo-consolidation-for-the-mrm-pivot` / `thd_3e028f67bae0` seq 2,
> 2026-07-10 — superseding the 07-08 canonical-source designation)*. These
> docs now live INSIDE the single authoritative repo (lati-cooki/clista);
> code and docs travel in the same commits. In any conflict, code and tests
> govern; this map yields. The old supremacy clause, per-page provenance
> pins, and CI pin validation lapsed with the multi-repo structure — pins
> still present on older pages are historical artifacts.

> Maintenance rule (unchanged in spirit): any change to an integration (new
> writer, new identity, new flow, a retirement) updates these docs **in the
> same commit** — now trivially enforceable since everything is one repo. A
> stale map is worse than no map.

## The one-paragraph version

**clista-protocol** defines and validates the event grammar. **clista-ai-app**
(app.clista.ai) is the live human cockpit over that grammar. **ThreadHub** is
the notary — a signed, hash-chained, content-addressed archive where decisions
get permanent citation addresses. **Hermes** (with the **Octopus** plugin) is
the local agent runtime; **Raft** (app.raft.build) is where the agent team
coordinates. Logs move between systems as ClisTa events — by reviewed vendor
sync, by manual ingest, or by per-agent signed writes. Nothing moves
automatically into a production ledger.

## Map

```mermaid
flowchart LR
  subgraph Protocol["clista-protocol (public)"]
    ENG[engine src/]
    EX[examples/*.ndjson]
  end
  subgraph App["clista-ai-app → app.clista.ai"]
    DO[(ThreadDO ledgers)]
    INTAKE[public intake]
  end
  subgraph Hub["ThreadHub (local notary, 127.0.0.1:7777)"]
    STORE[(data/hub.db)]
  end
  subgraph Agents["Agent runtimes"]
    HERMES[Hermes gateway + Octopus]
    RAFT[Raft space 'clista']
  end
  ENG -- "vendor sync (PR-gated)" --> App
  EX -- "example mirror (PR-gated)" --> App
  EX -- "manual ingest" --> STORE
  DO -- "archive-thread.mjs (manual)" --> STORE
  HERMES -- "octopus build signals (signed)" --> STORE
  HERMES -- "supervised deliberation (signed, per-agent keys)" --> STORE
  RAFT -- "wakes" --> HERMES
  INTAKE -- "human triage only" --> DO
  STORE -- "record-hash citations" --> Protocol
```

## Pages

| Page | Answers |
|---|---|
| [architecture.md](architecture.md) | The systems and every data flow between them |
| [identities.md](identities.md) | Who can write where, as whom, with which key — the full credential inventory |
| [operations.md](operations.md) | Runbook: services, deploys, tests, the archive command |
| [decisions.md](decisions.md) | The governing decisions and where their permanent records live |
| [history.md](history.md) | Timeline: milestones, incidents, retirements |

## Standing invariants (the rules everything above obeys)

1. **Semantic author = transport writer.** An agent writes only as itself,
   with its own key. No shared keys, no harvest-appending others' content
   under your identity. (Learned the hard way: 2026-07-04 incident.)
2. **Agents contribute, humans decide.** No agent emits `DecisionMerged` or
   `DecisionRequestOpened` anywhere.
3. **Supervised only.** No scheduled/cron agent writers exist. Re-introducing
   one is itself an open decision (`agent-loop-autonomy`) and requires a
   tested STOP control that survives gateway updates.
4. **ThreadHub stays loopback-only** until a decision says otherwise — it has
   no auth beyond a write rate limit.
5. **Production ledgers are append-only.** Nothing is deleted or corrected in
   place; mistakes are contained and superseded by new records.
