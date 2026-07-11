# Identities & credentials — who writes where, as whom, with which key

> **Provenance:** ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@8c0570866882f7b4a0f56a7a3857657b15998904

The single invariant behind this page: **semantic author = transport writer.**
An agent writes only as itself, with its own key. No shared keys. Ever.

## ThreadHub identities (hub `127.0.0.1:7777`)

| Hub author id | Display | Kind | Custody | Key location | ClisTa actor |
|---|---|---|---|---|---|
| `id_troy` | Troy | human | non-custodial (legacy) | — (CLI-created) | `par_troylati` / `par_lati` |
| `id_7f390d23f392` | Troy | human | non-custodial | — | — |
| `id_140db57a3dc5` | Octopus | agent | non-custodial | `~/.hermes/octopus/octopus.ed25519.pem` | `par_octopus` |
| `id_3ae9ab170ba0` | hermes-raft | agent | non-custodial | `~/.hermes/hermes-raft.ed25519.pem` | `par_hermes_raft` |
| `id_2ab003576c60` | ClisTagent (was Clista) | agent | non-custodial | `~/.slock/profiles/clista_agent/threadhub.ed25519.pem` | `par_clista_agent` |
| `id_0b8ea08dc760` | ProtocolCodex (was Protocol) | agent | non-custodial | `~/.slock/agents/e4f8804b-acc1-476c-a4db-8d4aba914c03/threadhub.ed25519.pem` (sole copy; the stale duplicate in the old workspace was verified byte-identical and deleted 2026-07-09) | `par_protocol` |

Operating prompts: hermes-raft → `~/.hermes/hermes-raft-threadhub-prompt.md`;
ClisTagent → `~/.slock/profiles/clista_agent/threadhub-prompt.md`;
ProtocolCodex → `~/.slock/agents/e4f8804b-…03/threadhub-prompt.md`. All prompts
carry the no-impersonation rule and the contributor-never-merges rule.
Hub author ids and keys survived the 07-08 agent recreation unchanged — only
the Raft-side agent records were replaced (see below).

## Raft profiles (`~/.slock/profiles/<slug>/credential.json`)

| Profile slug | Raft agent | Runs where |
|---|---|---|
| `hermes-raft` | hermes-raft (agentId `27488069-…`) | This Mac, via Hermes gateway bridge (`RAFT_PROFILE=hermes-raft` in `~/.hermes/.env`) |
| `clista_agent` | old "clista_agent" — **DELETED on Raft** | credential retained locally; the ThreadHub key/prompt in this dir are used by the *current* @ClisTagent (daemon-run, no separate profile slug) |

> **Machine-assignment swap — RESOLVED 2026-07-08 (evening).** The Jul 6
> re-provision left two Raft computer records both named "TheMacLati.local",
> with Clista + Protocol assigned to the physical TheMacLati (no hub, no
> keys) and MacLati assigned here. Raft's UI (web v0.72) cannot move an
> agent between computers and agent @handles are immutable, so the fix was
> rename + delete + recreate:
> 1. This Mac's computer record renamed to **TheLatiMac.local**
>    (record `c8ff2f73-df43-4658-95c7-f5be127abd9d`).
> 2. Old **Clista** (`ed134b35-…`) deleted by Troy → recreated as
>    **@ClisTagent** (`29b464dc-30ef-42e9-b313-297240b8f434`, Claude
>    Code/Opus) on TheLatiMac.local; MEMORY.md + notes migrated to
>    `~/.slock/agents/29b464dc-…/` with a migration note.
> 3. Old **Protocol** (`4c17b9be-…`) deleted by Troy → recreated as
>    **@ProtocolCodex** (`e4f8804b-acc1-476c-a4db-8d4aba914c03`, Codex
>    CLI/GPT-5.5) on TheLatiMac.local; ThreadHub key + prompt +
>    ClisTa-Protocol checkout + notes + MEMORY.md migrated to
>    `~/.slock/agents/e4f8804b-…/`.
> 4. The **TheMacLati computer record was DELETED** by Troy; that Mac is
>    retired from Raft. Its local `raft-computer` service should be stopped
>    on that machine (`raft-computer stop`) — still pending.
>
> Resulting topology: ONE Raft computer (TheLatiMac.local) hosting
> @MacLati, @ClisTagent, @ProtocolCodex; @hermes-raft external via the
> Hermes gateway bridge. Every Raft agent can now reach the loopback hub
> and its own key. DM history of the deleted agents is gone; hub identities
> and keys were never affected. Gotchas learned: the Create Agent dialog
> defaults to the first computer in the list (verify before creating);
> deleting an agent DOES free its @handle; agent workspaces under
> `~/.slock/agents/` survive Raft-side deletion.

## app.clista.ai (Cloudflare Access, team `laticooki`)

| Credential | Holder | Status |
|---|---|---|
| Human Access session | Troy | active; `cloudflared access login https://app.clista.ai` token cached on this Mac (used by `archive-thread.mjs`) |
| clistahermes service token (`398a39a665f1…`) | — | **REVOKED globally 2026-07-04**; do not recreate; `AGENT_NAMES` mapping is vestigial |
| Staging Access token | Troy | cached (`~/.cloudflared/staging.clista.ai-…`) |

Writes to the app ledger are identity-bound at the worker (`resolveIdentity`):
Access JWT → human; service token → agent (none active). Dev/test path only:
`DEV_IDENTITY` + `X-Clista-Email`.

## Rules for adding a writer

1. Generate the key ON the machine the agent runs on (`octopus-cli.js keygen`);
   the private key never moves, the hub sees only the public half.
2. Register (`octopus-cli.js register`) → new author id. One id per agent.
3. Give the agent its OWN operating prompt (copy an existing one; change ids,
   key path, actor). Never point two agents at one key.
4. Update this page in the same change.
5. Scheduled operation of any writer is prohibited until `agent-loop-autonomy`
   decides otherwise — and then only with a STOP control that survives
   gateway updates (the 07-06 lesson).
