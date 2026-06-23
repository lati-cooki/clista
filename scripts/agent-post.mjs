// Agent write client for app.clista.ai — lets a non-interactive agent update a
// thread without a browser. Authenticates with a Cloudflare Access SERVICE TOKEN
// (machine-to-machine): the CF-Access-Client-Id / CF-Access-Client-Secret pair
// is validated at the edge, Access issues a JWT, and the Worker resolves it to a
// server-authoritative agent participant (par_agent_<token-name>).
//
// Setup (one-time, owner): create the service token + policy per docs/AGENTS.md,
// then export its credentials:
//   export CF_ACCESS_CLIENT_ID=<id>.access
//   export CF_ACCESS_CLIENT_SECRET=<secret>
//   export CLISTA_BASE=https://app.clista.ai      # default
//
// Usage:
//   node scripts/agent-post.mjs <thread_id> ingest  <log.ndjson|events.json>
//   node scripts/agent-post.mjs <thread_id> append  <event.json>
//   node scripts/agent-post.mjs <thread_id> join    [role]
//   node scripts/agent-post.mjs <thread_id> state | summary | audit | validate
//   node scripts/agent-post.mjs me
//
// ingest accepts a raw protocol .ndjson log directly — chain fields are stripped
// so the engine re-chains deterministically (same as the bundled scenario seed).

import { readFileSync } from "node:fs";

const BASE = (process.env.CLISTA_BASE || "https://app.clista.ai").replace(/\/$/, "");
const ID = process.env.CF_ACCESS_CLIENT_ID;
const SECRET = process.env.CF_ACCESS_CLIENT_SECRET;
const CHAIN_FIELDS = ["content_hash", "prev_hash", "protocol_version", "hash_version"];

const [, , a, b, c] = process.argv;
if (!a) {
  console.error("usage: agent-post.mjs <thread_id> <ingest|append|join|state|summary|audit|validate> [arg]  (or: me)");
  process.exit(2);
}
if (!ID || !SECRET) {
  console.error("✘ set CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET (Access service token). See docs/AGENTS.md.");
  process.exit(2);
}

const authHeaders = { "CF-Access-Client-Id": ID, "CF-Access-Client-Secret": SECRET };

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...authHeaders, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (res.status === 302 || res.status === 401) {
    throw new Error(
      `auth failed (${res.status}). The service token isn't accepted — confirm the Access policy on ${BASE} includes this token, and ACCESS_AUD/team match.`
    );
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
  return { status: res.status, data };
}

function loadEvents(file) {
  const raw = readFileSync(file, "utf8").trim();
  // Whole-file JSON first — events.json ([...] / {events:[...]}) or a single
  // event object ({event_type:…}). ndjson starts with `{` too, so detect it by
  // the JSON.parse failing (multiple top-level objects) and fall back to lines.
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.events || [parsed];
  } catch {
    return raw.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
  }
}

const out = (r) => console.log(JSON.stringify(r.data, null, 1));

try {
  if (a === "me") {
    out(await call("GET", "/api/me"));
    process.exit(0);
  }
  const thread = a;
  const action = b;
  const base = `/api/threads/${encodeURIComponent(thread)}`;

  if (["state", "summary", "audit", "validate"].includes(action)) {
    out(await call("GET", `${base}/${action}`));
  } else if (action === "ingest") {
    const events = loadEvents(c).map((e) => {
      const ev = { ...e };
      for (const f of CHAIN_FIELDS) delete ev[f];
      return ev;
    });
    out(await call("POST", `${base}/ingest`, { events }));
  } else if (action === "append") {
    out(await call("POST", `${base}/append`, { event: loadEvents(c)[0] }));
  } else if (action === "join") {
    out(await call("POST", `${base}/join`, c ? { role: c } : {}));
  } else if (action === "purge") {
    out(await call("POST", `${base}/purge`));
  } else {
    console.error(`unknown action: ${action}`);
    process.exit(2);
  }
} catch (err) {
  console.error("✘", err.message);
  process.exit(1);
}
