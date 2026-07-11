# Operations runbook

> **Provenance:** clista-protocol@7dceb917b9a18f282cd1cad6ed4a10e3725b5678 · ThreadHub@41a1efe98f165ef27f84e835f703e94fff0f9828 · clista-ai-app@93d10232ec65b0039a89938dbc5fa5a9d2f7efaf

## Services

| Service | How it runs | Control |
|---|---|---|
| ThreadHub | launchd `com.lati.threadhub` → `node bin/cli.js serve --port 7777 --db ~/ThreadHub/data/hub.db` (KeepAlive, survives reboots) | restart: `launchctl kickstart gui/501/com.lati.threadhub` · logs: `~/Library/Logs/threadhub.log` |
| app.clista.ai | Cloudflare Worker, CI deploy on push to `main` (`.github/workflows/deploy-app.yml`) | manual: `npm run build && npx wrangler deploy` |
| staging.clista.ai | separate Worker + own DOs, deployed on PRs (`deploy-staging.yml`) | never without Access (workflow refuses if AUD empty) |
| Hermes gateway | `hermes gateway run` (user-managed) | state: `~/.hermes/gateway_state.json`; bridges: telegram + raft |

## Routine commands

```sh
# Verify every ThreadHub chain (CI-style; exit 0 iff all valid)
cd ~/ThreadHub && node bin/cli.js verify --all

# Archive a decided cockpit thread → permanent hub address
cd ~/Documents/clista-ai-app && node scripts/archive-thread.mjs <threadId>
#   auth: cached cloudflared Access token; --email for dev; --from file.json offline
#   refuses undecided threads without --force

# Agent signed write (the generic bridge — see identities.md for per-agent args)
node ~/ThreadHub/adapters/octopus-cli.js send --hub http://127.0.0.1:7777 \
  --slug <thread> --author <id> --key <pem> --payload '<clista-event-json>'

# Wake the hermes-raft agent: post "wake @hermes-raft" in Raft #all (supervised sessions only)

# Hide/unhide a cockpit thread card (index projection only; log untouched,
# thread stays resolvable by id). Audit view: GET /api/threads?hidden=1
#   POST https://app.clista.ai/api/threads/<id>/hide   (or /unhide; authed)
```

## Test suites (all must stay green)

| Repo | Command | Size |
|---|---|---|
| clista-protocol | `npm test` | ~350 tests (incl. ThreadHub cross-citation test — needs the local hub up, else skips) |
| clista-ai-app | `npm run test:all` | 25 node + 43 workerd |
| ThreadHub | `npm test` | 34 (incl. the 7-scenario agent-loop harness: concurrency, SIGKILL durability, stale-chain/replay, clock skew) |
| ThreadHub remote smoke | `THREADHUB_URL=<url> node --test test/agent-loop/loop.test.js` | non-destructive scenarios only. **Never point at the real local hub** — smoke residue is permanent in an append-only store |
| Octopus | `cd ~/octopus/tests && PYTHONPATH=.:.. python3 -m unittest` | writer glue 9 tests |

## Gotchas that bite

- ThreadHub CLI writes open the SQLite file directly — prefer HTTP writes
  while the launchd hub is running (WAL tolerates it, but one writer path is
  cleaner).
- The app engine's chain fields are `content_hash`/`previous_hash` (NOT
  `prev_hash`), hashes are `sha256:`-prefixed. ThreadHub's are
  `record_hash`/`prev`.
- The app CLI-side event store gotchas: `.clista/events.ndjson` in
  clista-protocol is a FROZEN fixture; the CLI writes to `<cwd>/.clista`.
- A SIGKILLed child process has `exitCode === null` + `signalCode` set;
  undici fetches to a killed server can hang forever (count settlements,
  never `await Promise.all` on them).
- ThreadHub `serve --rate-limit <n>` overrides the 120 writes/min default
  (test harnesses need it; production default stands).
- Hermes updates can rewrite `jobs.json` — pause state does NOT survive them.
  Any future scheduled writer needs a kill switch OUTSIDE jobs.json (the
  CLISTA_STOP file pattern, archived in `~/.hermes/cron/clistahermes.done/`).
- `POST /api/examples/:id/seed` is **seed-once per thread id** — an already
  seeded thread reports `ok:false` (409 overall) and revisions never reach it
  in place. Ship a revised example by bumping the thread ids in the protocol
  generator + manifest, regenerate, `sync:examples`, deploy, seed; hide the
  superseded cards (done 2026-07-10 for LTN-4481 → `*_r2`).
