# Identities & credentials — who writes where, as whom, with which key

The single invariant behind this page: **semantic author = transport writer.**
An agent writes only as itself, with its own key. No shared keys. Ever.

## ThreadHub identities (hub `127.0.0.1:7777`)

| Hub author id | Display | Kind | Custody | Key location | ClisTa actor |
|---|---|---|---|---|---|
| `id_troy` | Troy | human | non-custodial (legacy) | — (CLI-created) | `par_troylati` / `par_lati` |
| `id_7f390d23f392` | Troy | human | non-custodial | — | — |
| `id_140db57a3dc5` | Octopus | agent | non-custodial | `~/.hermes/octopus/octopus.ed25519.pem` | `par_octopus` |
| `id_3ae9ab170ba0` | hermes-raft | agent | non-custodial | `~/.hermes/hermes-raft.ed25519.pem` | `par_hermes_raft` |
| `id_2ab003576c60` | Clista | agent | non-custodial | `~/.slock/profiles/clista_agent/threadhub.ed25519.pem` | `par_clista_agent` |

Operating prompts: hermes-raft → `~/.hermes/hermes-raft-threadhub-prompt.md`;
Clista → `~/.slock/profiles/clista_agent/threadhub-prompt.md`. Both prompts
carry the no-impersonation rule and the contributor-never-merges rule.

## Raft profiles (`~/.slock/profiles/<slug>/credential.json`)

| Profile slug | Raft agent | Runs where |
|---|---|---|
| `hermes-raft` | hermes-raft (agentId `27488069-…`) | This Mac, via Hermes gateway bridge (`RAFT_PROFILE=hermes-raft` in `~/.hermes/.env`) |
| `clista_agent` | old "clista_agent" — **DELETED on Raft** | credential retained locally; the *current* Clista agent is a separate Raft-side profile |

Remote Raft agents with **no** local credentials or hub access: Protocol
(Codex runtime), MacLati (TheMacLati.local).

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
