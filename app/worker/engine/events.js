// PORT of src/events.js — pure builders only. The original's filesystem store
// (.clista/events.ndjson via fs/path/process.cwd) is replaced by the ThreadDO's
// SQLite event log, so none of the I/O functions are carried over. Randomness
// uses Web Crypto (available in Workers) instead of node:crypto.randomBytes.
const {
  EVENT_HASH_VERSION,
  PROTOCOL_VERSION,
  contentHash,
  prepareEventForAppend,
  stableStringify
} = require("./integrity");

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = "";
  for (const b of buf) out += b.toString(16).padStart(2, "0");
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function newId(prefix, hint = "") {
  const slug = slugify(hint);
  const entropy = randomHex(4);
  const time = Date.now().toString(36);
  return `${prefix}_${slug ? `${slug}_` : ""}${time}_${entropy}`;
}

function participantIdFor(value) {
  if (!value) {
    return "par_system";
  }
  const text = String(value).trim();
  if (/^par_[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(text)) {
    return text;
  }
  return `par_${slugify(text) || "participant"}`;
}

function createEvent({ type, threadId, actorId, payload, at = nowIso(), id, metadata }) {
  const base = {
    event_id: id || newId("evt", type),
    event_type: type,
    thread_id: threadId || null,
    actor_id: actorId || null,
    timestamp: at,
    payload,
    protocol_version: PROTOCOL_VERSION,
    hash_version: EVENT_HASH_VERSION
  };
  if (metadata && Object.keys(metadata).length) {
    base.metadata = metadata;
  }
  base.content_hash = prepareEventForAppend(base).content_hash;
  return base;
}

function createParticipant(value, role, kind = "human") {
  const id = participantIdFor(value);
  const name = /^par_/.test(String(value || "")) ? id.replace(/^par_/, "").replace(/_/g, " ") : String(value || "System");
  return {
    id,
    object: "participant",
    kind,
    name,
    role
  };
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.flatMap(parseList);
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  contentHash,
  createEvent,
  createParticipant,
  newId,
  nowIso,
  parseList,
  participantIdFor,
  slugify,
  stableStringify
};
