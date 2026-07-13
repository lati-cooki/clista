# Deployment runbook — consensusprotocol.ai on Cloudflare

The chosen hosting direction (2026-07-13): no self-managed servers. Both the
hub and the studio's public surface run as Cloudflare Workers, each backed by
one SQLite Durable Object; the operator plane stays on the laptop as an
authenticated API client. This supersedes `deploy-consensusprotocol-ai.md`
(the VPS runbook) for hosting — that document's *smoke-objection procedure*
still applies and is refined below.

## What runs where

```
Internet ── consensusprotocol.ai (Cloudflare edge)
   │
   ├─ GET /t/*, /r/*, /verify.mjs, /   → threadhub-cf Worker ── HubDO (SQLite): the record
   │                                       auth'd writes (operator bearer) share this Worker
   │
   └─ GET /object/*, POST /api/object/* → studio-worker Worker ── StudioState DO (SQLite):
         + operator API (bearer)            FCP state machine, tokens, objections, refusals

   studio-worker ──(service binding, entrypoint HubInternal)──▶ threadhub-cf
         mintIdentity (objector) · isPublished (deliberation links)

Laptop (operator plane, unchanged): sealing (clista CLI), challenge runs, evals,
   git anchoring — drives the cloud via HTTPS + bearer when STUDIO_CLOUD_BASE_URL /
   THREADHUB_BASE_URL are set; identical to today when they're unset.
```

There is **no origin server and no firewall to manage.** The security walls
are in code and reviewed: the hub answers unpublished==nonexistent byte-identical
404s and gates writes behind a bearer *before reading the body*; the studio
Worker serves only the skeptic surface publicly and fails **closed** with no
operator secret (no "localhost-open" posture exists on a Worker).

## Code state (all merged, reviewed, on main)

- **Hub:** monorepo `packages/threadhub-cf` (main `eb4ca11`). Worker + `HubDO` +
  `HubInternal` entrypoint. Suite 16/0. `wrangler.jsonc`: name `threadhub-cf`,
  DO `HUB`/`HubDO`, `node:sqlite` aliased, verify.mjs Text-imported.
- **Studio:** prompt-studio `workers/studio` (main `3c6d258`). Worker + `StudioState`
  DO. Suite 49/0. `wrangler.jsonc`: name `studio-worker`, DO `STUDIO`/`StudioState`,
  vars `PUBLIC_BASE_URL`/`HUB_PUBLIC_BASE_URL`/`OBJECT_RATE`. **HUB service binding
  is commented out** — uncomment it as step 0 below (the entrypoint now exists).
- **Laptop client:** prompt-studio `cloud_store.py` + env-switched handlers
  (main `3c6d258`). Python suite 483/0; local path byte-identical when env unset.

Pre-smoke polish batch (small, non-blocking, fold in before the smoke step —
see the ledger): 3 cloud-mode GET handlers need a `PromotionError` catch; the
close/waive recovery doc; a `_TIMEOUT` read-time nit; a corrupt byte in
`hub-stub.js`. None block staging bring-up.

## Prerequisites

- Cloudflare account (already authenticated: `wrangler whoami` → troylati@gmail.com).
- Node ≥ 22 locally (already present) for the fixture/anchor scripts.
- The `consensusprotocol.ai` zone on the account (only needed at cutover, not staging).

> **`wrangler deploy` is permission-gated in this harness.** Every deploy step
> below must be run/approved by Troy — either type it after `!` in the session
> or approve the prompt. Nothing here deploys automatically.

---

## Step 0 — uncomment the service binding (one edit, then it's live-wired)

In `workers/studio/wrangler.jsonc`, uncomment:
```jsonc
"services": [
  { "binding": "HUB", "service": "threadhub-cf", "entrypoint": "HubInternal" }
],
```
The `HubInternal` entrypoint exists on the hub side (merged `eb4ca11`), so the
binding now resolves. (This edit + the polish batch = one small reviewed commit.)

## Step 1 — deploy both Workers to workers.dev (staging)

```
cd ~/Projects/clista/packages/threadhub-cf && npx wrangler deploy
cd ~/DevSwarmProjects/Clista/workers/studio  && npx wrangler deploy
```
Neither config has `routes`/custom domain, so each lands on its
`*.workers.dev` subdomain — public production DNS is untouched.

## Step 2 — secrets

```
# hub write token — the operator bearer for hub writes AND the studio's read of unpublished threads
openssl rand -hex 32 | tee /tmp/hub-token | (cd ~/Projects/clista/packages/threadhub-cf && npx wrangler secret put THREADHUB_WRITE_TOKEN)

# studio operator bearer — gate on every studio operator route; UNSET = operator surface absent (fail closed)
openssl rand -hex 32 | tee /tmp/studio-token | (cd ~/DevSwarmProjects/Clista/workers/studio && npx wrangler secret put STUDIO_OPERATOR_TOKEN)
```
Keep both tokens; they go into the laptop `.env` at step 5. (Delete `/tmp/*-token`
after.) The service binding needs no secret — the binding itself is the capability.

## Step 3 — import the record set (staging, key-material-free fixture first)

The committed fixture is the real hub.db with custodial private keys stripped —
safe to load into staging to exercise the path:
```
cd ~/Projects/clista/packages/threadhub-cf
curl -sS -X POST https://threadhub-cf.<subdomain>.workers.dev/admin/import \
  -H "Authorization: Bearer $(cat /tmp/hub-token)" \
  -H 'content-type: application/json' \
  --data @test/fixtures/hub-export.json | jq .
# → {imported:{identities:9,threads:15,records:143}, skipped:{...:0}}
```
(For the REAL cutover, step 8 generates a fresh export *with* keys from the live
hub.db — the fixture is staging-only.)

## Step 4 — the anchor-head gate (must pass before trusting staging)

The discipline that makes the record credible: every anchored head must match
byte-for-byte what the deployed hub reports.
```
# heads the deployed hub reports, per thread:
for slug in $(jq -r '.threads[].slug' <(curl -s https://threadhub-cf.<subdomain>.workers.dev/ -H "Authorization: Bearer $(cat /tmp/hub-token)")); do
  curl -s "https://threadhub-cf.<subdomain>.workers.dev/t/$slug/verify" -H "Authorization: Bearer $(cat /tmp/hub-token)" \
    | jq -r '"\(.slug) \(.head) valid=\(.valid)"'
done
```
Compare against `packages/threadhub-cf/test/fixtures/golden-heads.json` (15
threads, includes the two publication-act heads `sha256:01add139…` and
`sha256:fb388e31…`). `scripts/export-hubdb.mjs --heads <db>` regenerates that
golden list the same way — it is the cutover comparison tool. Also confirm the
public face:
```
# only the 2 published threads are visible unauthenticated; unpublished == nonexistent
curl -s https://threadhub-cf.<subdomain>.workers.dev/ | jq '.threads | length'   # → 2
diff <(curl -s .../t/dr-phase5-topology.json) <(curl -s .../t/does-not-exist.json)  # → identical (unpublished)
# verify.mjs bytes:
diff <(curl -s .../verify.mjs) packages/threadhub/scripts/verify-standalone.mjs   # → identical
```

## Step 5 — point the laptop at staging

`.env` on the laptop (studio repo). All FOUR keep the local path intact when
removed:
```
STUDIO_CLOUD_BASE_URL=https://studio-worker.<subdomain>.workers.dev
STUDIO_CLOUD_TOKEN=<studio operator bearer from step 2>
THREADHUB_BASE_URL=https://threadhub-cf.<subdomain>.workers.dev
THREADHUB_WRITE_TOKEN=<hub write token from step 2>
```
Now the local Python studio's operator actions (promote, open FCP, mint, resolve,
close, seal) drive the staging cloud; sealing + git anchoring still run locally.

## Step 6 — staged smoke objection (from an outside network)

The full skeptic loop before any invitation — refined from the VPS runbook, minus
the SSH tunnel (the operator API is bearer-gated HTTPS now):
1. Laptop: promote a real prompt, open an FCP (short window), `deliberation_slug`
   set to a **published** thread; mint a token. The mint response's URL must be an
   `https://studio-worker.<subdomain>.workers.dev/object/...` (or the cutover
   domain) — never localhost. If it's localhost, `PUBLIC_BASE_URL` is wrong; stop.
2. From a phone/hotspot: open `/object/<token>` — page renders, the deliberation
   link resolves to the hub viewer, dissent renders first-class.
3. File an objection as a second identity (contact never hub-bound — accountless).
4. Read the receipt/status URL from the same outside network.
5. Laptop: resolve, close, seal. The seal runs locally (clista CLI + hub via the
   now-remote `THREADHUB_BASE_URL`) and anchors via git; confirm the seal appends
   the `ObjectionRaised` at seal time and the metrics contested-ratio moves.
6. Objector-side verify: save `verify.mjs` + the thread JSON, `node verify.mjs
   thread.json` from the outside machine → PASS, head == the receipt's citation
   hash.
7. Confirm the studio operator route is walled: an unauth'd `curl` to
   `/api/promotions` → the byte-identical generic 404 (not 401).

Only after 1–7 pass do the five sends go out (against staging, or after cutover
against the domain — Troy's call).

## Step 7 — production cutover (plan phase 8)

The box-free cutover:
1. **Freeze the laptop hub/studio state** (stop appending locally).
2. **Migrate the real record set:** `node packages/threadhub-cf/scripts/export-hubdb.mjs
   packages/threadhub/data/hub.db > /tmp/hub-live.json` (WITH keys this time —
   the export includes custodial `private_key` PEMs, which already live in the hub
   DB by design; transits HTTPS+token once). `POST /admin/import` it to the hub
   Worker. Migrate the studio FCP state similarly if a `scripts/export_cloud_state`
   path is added (currently the staging fixture covers the record set; studio
   promotions/tokens are few and terminal — decide migrate-vs-start-clean at
   cutover, receipts must keep resolving).
3. **Re-run the step-4 anchor gate against the live import** — every ANCHORS.md
   head must match before DNS. A mismatch means a bad import; stop.
4. **Add the custom domain:** add `"routes": [{ "pattern": "consensusprotocol.ai/...",
   "custom_domain": true }]` split per the topology (hub: `/t/*` `/r/*` `/verify.mjs`
   `/`; studio: `/object/*` `/api/object/*` `/api/*`), or configure routes in the
   dashboard; redeploy. Flip the studio vars' base URLs if they differed in staging.
5. **Repoint the laptop `.env`** base URLs from `*.workers.dev` to
   `https://consensusprotocol.ai`.
6. Local Node hub + Python studio become cold spares; `hub.db` stays the offline
   archive; `/admin/export` is the ongoing backup path (plus DO point-in-time
   recovery).

## Rollback

DBs are inside Durable Objects (point-in-time recovery available) and the laptop
`hub.db`/`prompt_studio.db` remain untouched until you retire them. A bad deploy:
`wrangler rollback` (or redeploy the prior commit), re-run the anchor gate. Anchors
already pushed to the public prompt-studio repo are append-only history — never
rewritten; a re-deploy re-verifies against them.
