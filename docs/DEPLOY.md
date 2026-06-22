# Phase 5 — deploy `app.clista.ai` (runbook)

How to publish this Worker (SPA + Durable Objects + ClisTa engine) to
**`app.clista.ai`**, gated by Cloudflare Access, beside the six existing Pages
surfaces. Steps marked **[you]** need Cloudflare account/DNS/Access access I can't
perform; everything else is scaffolded in this repo.

Unlike the six storefront surfaces (each a **Pages** project — see
`launch-planning/website/CLOUDFLARE.md`), this app is a **Worker**: it has Durable
Objects and server-side routes, so it deploys with `wrangler deploy` and a
custom-domain route, not `wrangler pages deploy`.

---

## 0. Prerequisites  **[you]**

- The `clista.ai` zone is already on Cloudflare with the `*.clista.ai` wildcard cert
  (done for the storefront). `app.clista.ai` is one more subdomain under it — no new
  cert needed.
- `wrangler login` locally, **or** have `CLOUDFLARE_ACCOUNT_ID` + a scoped
  `CLOUDFLARE_API_TOKEN` (for CI — see §5).
- Durable Objects: this app uses **SQLite-backed** DOs (`new_sqlite_classes`).
  Confirm the account's Workers plan allows them; no extra setup beyond the
  migrations already in `wrangler.jsonc`.

---

## 1. Create the Cloudflare Access application  **[you]**

This is what makes `actor_id` real (Phase 4). Until it exists, all writes return
`401` and the app is effectively read-only — safe, but the cockpit can't seed/append.

1. Zero Trust dashboard → **Access → Applications → Add an application → Self-hosted**.
2. Application domain: `app.clista.ai`.
3. Add a policy (e.g. **Allow** → emails ending `@yourteam.com`, or a named list).
4. Save, then open the app's **Overview** and copy:
   - **Application Audience (AUD) tag** → `ACCESS_AUD`
   - Your team domain `‹team›` from `‹team›.cloudflareaccess.com` → `ACCESS_TEAM_DOMAIN`
5. Identity provider: configure at least one (One-time PIN works out of the box) under
   **Settings → Authentication** if not already set.

---

## 2. Set production identity vars

Put the two values from §1 into `wrangler.jsonc` (`vars`), **or** keep the file
generic and set them at deploy time:

```sh
# option A — edit wrangler.jsonc vars (committed)
#   "ACCESS_TEAM_DOMAIN": "yourteam", "ACCESS_AUD": "<aud-tag>"

# option B — keep them out of git, set as plain text vars on the deployed Worker
wrangler deploy --var ACCESS_TEAM_DOMAIN:yourteam --var ACCESS_AUD:<aud-tag>
```

> **Never set `DEV_IDENTITY` in production.** It lives only in `.dev.vars` (gitignored)
> for local dev. In prod it is unset, so the `X-Clista-Email` dev fallback is off and
> identity comes only from a verified Access JWT.

---

## 3. Deploy

```sh
npm ci
npm run build            # produces dist/ (the SPA the Worker serves via ASSETS)
npx wrangler deploy      # uploads the Worker + DOs, applies migrations, binds the custom domain
```

`custom_domain: true` in `wrangler.jsonc` makes wrangler create the `app.clista.ai`
DNS record and attach the cert (the zone is in the same account). First deploy also
runs the `v1`/`v2` DO migrations.

> Smoke-test option: comment out the `routes` line in `wrangler.jsonc` and deploy to
> get a `clista-ai-app.<account>.workers.dev` URL first (Access won't apply there —
> set `DEV_IDENTITY` is still off, so writes 401; use only to confirm the build runs).

---

## 4. Verify  **[you]**

With Access configured and signed in:

```sh
curl https://app.clista.ai/api/me            # 200 with your email/actorId once signed in
curl https://app.clista.ai/api/threads       # {"threads":[...]}
```

- `https://app.clista.ai` redirects through the Access login, then serves the cockpit.
- The cockpit auto-seeds `thd_scenario_demo` on first authenticated load and renders
  live state (decision, surviving objection, evidence hashes, audit chain + head hash).
- `GET …/validate` → `integrity` and `validation` both `true`.
- An unauthenticated `POST` (e.g. via curl without the Access cookie) → `401`.
- A signed-in non-participant sees **Join thread**; after joining, an objection appends
  and the chain re-validates.

---

## 5. Automatic deploys (GitHub Actions) — optional

`.github/workflows/deploy-app.yml` builds and `wrangler deploy`s on every push to
`main` that touches the app (and can be run manually from the **Actions** tab).

**One-time repo secrets**  **[you]** — Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | `wrangler whoami`, or dashboard → any domain → right sidebar. |
| `CLOUDFLARE_API_TOKEN` | Scoped token (below). |

Create the token at **My Profile → API Tokens → Create Custom Token** with:
- **Account › Workers Scripts › Edit**
- **Account › Workers KV Storage › Edit** *(DO migrations)*
- **Zone › Workers Routes › Edit** (zone: `clista.ai`) — for the custom domain
- **Account › Account Settings › Read**

The workflow fails fast with a clear message until both secrets exist.

---

## 6. Cut over `cli.clista.ai`  **[you]** *(separate repo)*

In `lati-cooki/clista-protocol-launch-planning`:

- `website/cli.clista.ai` is the **non-live mock**. Replace its "this is a mock"
  affordance with a link/redirect to `https://app.clista.ai` (the live cockpit), and
  add a hero link from `clista.ai`.
- Rebuild + redeploy that surface per `launch-planning/website/CLOUDFLARE.md`
  (`./deploy.sh` or the `deploy-website.yml` workflow).

This app stays an independent deploy — it is *not* added to `website/deploy.sh`'s
six-Pages loop (it's a Worker, deployed by §3/§5 here).

---

## Notes

- **Rollback:** `wrangler rollback` (or redeploy a previous commit). DO data persists
  across deploys; migrations are additive.
- **Local parity:** `npx wrangler dev` runs the exact same Worker + DOs locally with
  `.dev.vars` identity. `npm test` proves engine/scenario parity before any deploy.
- **Adding a future surface** under `*.clista.ai` is just another Worker/Pages project
  + custom domain — the wildcard cert already covers it.
