# Deployment runbook — consensusprotocol.ai

Moves the working localhost topology (studio :8001 + hub :8110) to one public
box behind `consensusprotocol.ai`. Architecture as ruled 2026-07-13: reverse
proxy in front, PUBLIC_MODE studio, GET-only hub face, `hub.db` migrates to
the box, deploy key for anchor pushes. Owner rulings on record: the skeptic
surface stays accountless; the auth posture (Task 13 front door) ships before
the first invitation send — it has.

## Why four processes, not two

Two constraints discovered in the code make the topology four-faced:

1. **The studio's public-mode wall is route-based, not IP-based**
   (`server.py _front_door`): with `STUDIO_PUBLIC_MODE=1` every non-skeptic
   route answers the byte-identical generic 404 — *even from localhost, even
   with the bearer token*. A public-mode studio is operator-inert by design
   (a 401 would be a route-existence oracle). Operator acts therefore need a
   **second studio process** with public mode off, reachable only over SSH.
2. **A public-mode hub breaks the studio's own reads** (Task 15 disclosure #4):
   `publication.py` computes effective state from `GET /t/<slug>.json`; in
   public mode an unpublished thread 404s, so publish-from-unpublished would
   fail closed. And hub public mode filters *reads only* — `POST /threads`,
   `POST /identities`, `POST /t/:slug/records` stay live — so the GET-only
   public face **must** be enforced at the proxy, and the studio needs a
   **second hub face** with public mode off, bound behind the firewall.

```
Internet ── Caddy (TLS, consensusprotocol.ai)
             ├─ GET /t/*, /r/*, /verify.mjs, /        → hub-public    127.0.0.1:8110  (THREADHUB_PUBLIC_MODE=1)
             ├─ GET /object/*, POST /api/object/*     → studio-public 127.0.0.1:8001  (STUDIO_PUBLIC_MODE=1)
             └─ everything else                       → 404

Box-internal only (firewall + never proxied):
             hub-local       127.0.0.1:8111  (public mode OFF — the write face; studio points here)
             studio-operator 127.0.0.1:8002  (public mode OFF, STUDIO_OPERATOR_TOKEN set; reach via SSH tunnel)

Shared state:  /srv/clista/hub.db  +  /srv/clista/prompt_studio.db
               (hub-public reads what hub-local writes; both studios share one DB)
```

**CRITICAL:** both servers bind ALL interfaces (`("", PORT)` in server.py;
`server.listen(port)` in the hub). The host firewall is load-bearing: only
22/80/443 may be open. Verify before DNS cutover, not after.

## Prerequisites

- A box (any small VPS) with: **Node ≥ 22** (hub uses `node:sqlite`;
  `verify.mjs` CLI file-reads need ≥ 22.3), **Python 3** (studio is
  stdlib-only), git, Caddy, ufw (or equivalent).
- DNS: `A consensusprotocol.ai → <box IP>`. Plain DNS first (no CDN proxy) —
  a caching layer in front of byte-identity guarantees adds variables the
  smoke checks below would have to see through.
- GitHub **write deploy key** for `lati-cooki/prompt-studio` (anchor pushes
  originate on the box). The `lati-cooki/clista` clone needs read access only.

## Layout

```
/srv/clista/
  prompt-studio/      git clone git@github.com:lati-cooki/prompt-studio   (anchors.py pushes HERE)
  clista/             git clone https://github.com/lati-cooki/clista       (hub code: packages/threadhub)
  hub.db              migrated from packages/threadhub/data/hub.db
  prompt_studio.db    migrated from the studio checkout
  env/                studio-public.env, studio-operator.env, hub-public.env, hub-local.env
```

`anchors.py` commits ANCHORS.md in the repo containing the *running studio
code*, so the studio must run from the git clone (not an export), with the
deploy key configured for that clone and `git config user.name/email` set.

## Environment files

`env/hub-public.env`
```
THREADHUB_DB=/srv/clista/hub.db
THREADHUB_PUBLIC_MODE=1
# THREADHUB_RATE_LIMIT unset → server default (writes never reach this face anyway)
```

`env/hub-local.env`
```
THREADHUB_DB=/srv/clista/hub.db
# public mode OFF — this is the write face; reachable only from the box
```

`env/studio-public.env`
```
PORT=8001
DB_PATH=/srv/clista/prompt_studio.db
STUDIO_PUBLIC_MODE=1
STUDIO_PUBLIC_BASE_URL=https://consensusprotocol.ai
THREADHUB_PUBLIC_BASE_URL=https://consensusprotocol.ai
THREADHUB_PORT=8111
STUDIO_OBJECT_RATE=10/60
# No ANTHROPIC_API_KEY — the skeptic surface never calls a model
```

`env/studio-operator.env`
```
PORT=8002
DB_PATH=/srv/clista/prompt_studio.db
STUDIO_OPERATOR_TOKEN=<long random secret — required even behind SSH: defense in depth>
STUDIO_PUBLIC_BASE_URL=https://consensusprotocol.ai
THREADHUB_PUBLIC_BASE_URL=https://consensusprotocol.ai
THREADHUB_PORT=8111
ANTHROPIC_API_KEY=<only if evals/challenge runs will run on the box>
```

Both studio faces set the PUBLIC base URLs: receipts and mint responses must
carry `https://consensusprotocol.ai/...`, never a localhost URL, regardless
of which face minted them. Both point `THREADHUB_PORT` at **8111** (the write
face) — 8110 exists solely for the proxy.

## systemd units (4)

One template, four instantiations; the pattern:

```ini
[Unit]
Description=clista %i
After=network.target

[Service]
User=clista
EnvironmentFile=/srv/clista/env/%i.env
# hub faces:
ExecStart=/usr/bin/node /srv/clista/clista/packages/threadhub/bin/cli.js serve --port <8110|8111>
# studio faces:
ExecStart=/usr/bin/python3 /srv/clista/prompt-studio/server.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start order: hub-local → hub-public → studio-public → studio-operator →
caddy. (The studios read publication state live; they tolerate a missing hub
fail-closed, but bring the write face up first so nothing starts degraded.)

## Caddyfile

```
consensusprotocol.ai {
    @hub_reads {
        method GET
        path /t/* /r/* /verify.mjs /
    }
    handle @hub_reads {
        reverse_proxy 127.0.0.1:8110
    }

    @skeptic_pages {
        method GET
        path /object/*
    }
    handle @skeptic_pages {
        reverse_proxy 127.0.0.1:8001
    }

    @skeptic_filing {
        method POST
        path /api/object/*
    }
    handle @skeptic_filing {
        reverse_proxy 127.0.0.1:8001
    }

    handle {
        respond 404
    }
}
```

The method matchers are the GET-only hub face — the hub's write routes are
live in public mode, so this allowlist (plus the firewall) is what makes the
public hub read-only. Everything not matched 404s at the proxy; the app-level
byte-identical 404s sit behind it as the second wall.

## DB migration (the cutover)

The box becomes **authoritative** at this step. Split-brain is the failure
mode to respect: after migration, anything appended to the laptop DBs is on a
fork that will never reach the public record.

1. On the laptop: stop studio :8001 and hub :8110 (`nohup` processes; logs at
   /tmp/studio-8001.log, /tmp/threadhub-8110.log).
2. Checkpoint and copy:
   ```
   sqlite3 ~/Projects/clista/packages/threadhub/data/hub.db "PRAGMA wal_checkpoint(TRUNCATE);"
   sqlite3 ~/DevSwarmProjects/Clista/prompt_studio.db      "PRAGMA wal_checkpoint(TRUNCATE);"
   scp <both .db files> box:/srv/clista/
   ```
   Keep the originals untouched — they are the rollback.
3. On the box, before opening the firewall: start hub-local and verify the
   migrated record set against the anchors:
   ```
   node /srv/clista/clista/packages/threadhub/scripts/verify-standalone.mjs http://localhost:8111/t/<slug>.json
   ```
   for each anchored thread; every printed head must equal its
   ANCHORS.md row byte-for-byte. A mismatch means a bad copy — stop.
4. Retire the laptop services, or restart them only against scratch DBs.
   The laptop studio's operator UI is dead weight post-cutover; operator acts
   now go through the box (below).

## Deploy key + anchor push test

```
ssh box 'cd /srv/clista/prompt-studio && git remote set-url origin git@github.com:lati-cooki/prompt-studio.git'
# install the write deploy key in ~clista/.ssh, add github.com to known_hosts
ssh box 'cd /srv/clista/prompt-studio && git config user.name "clista-anchor" && git config user.email "troylati@gmail.com"'
ssh box 'cd /srv/clista/prompt-studio && git pull --ff-only && git push'   # dry contact test
```

Anchor pushes happen inside the studio process at seal time; a push failure
is reported (`anchor_pushed: false`) but not fatal — check for it in operator
responses after any seal.

## Operator access pattern

```
ssh -N -L 8002:127.0.0.1:8002 box
curl -s -X POST -H "Authorization: Bearer $STUDIO_OPERATOR_TOKEN" \
     http://localhost:8002/api/threads/<slug>/publish
```

All operator verbs (publish/unpublish, promote, mint, resolve, close, seal)
go through the tunnel to the operator face. The operator face's Threads-view
toggle POSTs without a bearer header (known Task 15 disclosure) — use curl
for state-changing acts when the token is set.

## Post-deploy verification checklist

Run from an **outside** machine (not the box, not the laptop's network where
possible). Each check pins one wall:

1. **Chain + anchor**: save `/verify.mjs` and a thread JSON locally; run
   `node verify.mjs <saved.json>` → PASS, head equals the ANCHORS.md row in
   the public prompt-studio repo. (This is the whole product — do it first.)
2. **Unpublished == nonexistent, byte-identical**:
   `curl -s https://consensusprotocol.ai/t/<unpublished-slug>.json` vs
   `.../t/definitely-not-a-thread.json` → `diff` must be empty. Same for
   `/t/<slug>/view` and `/r/<unpublished record hash>`.
3. **GET-only hub face**:
   `curl -s -X POST https://consensusprotocol.ai/threads -d '{}'` → proxy 404
   (never reaches the hub).
4. **Studio wall**: `curl -s https://consensusprotocol.ai/api/threads` and
   any operator route → 404 byte-identical to an invalid `/object/xxxx`
   token page (404, not 401 — no route-existence oracle).
5. **Bearer**: through the SSH tunnel, an operator POST without the token →
   401; with it → acts.
6. **Rate limit**: >10 requests/min to `/object/<garbage>` from one IP →
   429s appear; `GET /api/object-refusals` (operator face) shows the audit rows.
7. **Firewall**: `nmap -p 8001,8002,8110,8111 <box>` → all filtered/closed.

## Outside-network smoke objection (runway step 3)

The full skeptic loop, from a network the box has never seen (phone hotspot
qualifies), before any invitation goes out:

1. Operator (tunnel): open an FCP on a real promotion with a short window,
   `deliberation_slug` set to a **published** thread; mint a token. The mint
   response's `deliberation_url` must be an `https://consensusprotocol.ai/...`
   URL — if it is a localhost URL, STUDIO_PUBLIC_BASE_URL is wrong; stop.
2. From the outside network, open `/object/<token>`: page renders, the
   deliberation link resolves to the viewer, dissent renders first-class.
3. File an objection as a second identity (the objector's contact never
   hub-bound — accountless posture holds).
4. Check the receipt/status URL from the same outside network.
5. Operator: resolve, close, seal. Confirm in the seal response
   `anchor_pushed: true`; confirm the anchor commit appears on GitHub.
6. Objector-side verify: saved `verify.mjs` against a saved copy of the
   thread JSON → PASS, head == the receipt's citation hash.
7. Metrics: contested ratio moved; the smoke objection is disclosed in its
   resolution note (it is a real record — the record is the interface, so it
   says what it is).

Only after 1–7 pass do the five sends go out.

## Rollback

The DBs are files. Pre-cutover copies stay on the laptop; a bad deploy is
`systemctl stop` everything, fix, re-copy, re-verify heads against
ANCHORS.md. Anchors already pushed are append-only history — never rewrite
them; a re-deploy re-verifies against them instead.
