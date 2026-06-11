// canonical.js — deterministic serialization + content addressing.
// Every record hash in Thread Hub is sha256 over canonical JSON:
// object keys sorted lexicographically, no insignificant whitespace,
// UTF-8 bytes. Two parties serializing the same record MUST get the
// same hash, or federation and attestation are impossible.
'use strict';
const crypto = require('node:crypto');

function canonicalize(value) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error('canonicalize: non-finite number');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys
      .filter((k) => value[k] !== undefined)
      .map((k) => JSON.stringify(k) + ':' + canonicalize(value[k]))
      .join(',') + '}';
  }
  throw new Error(`canonicalize: unsupported type ${typeof value}`);
}

function sha256hex(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Content address of any JSON value: "sha256:<hex>"
function contentAddress(value) {
  return 'sha256:' + sha256hex(canonicalize(value));
}

module.exports = { canonicalize, sha256hex, contentAddress };
