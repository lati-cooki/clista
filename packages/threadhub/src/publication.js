// publication.js — publication state as a pure function of the records.
// (DR-2026-07-13-record-is-the-interface, rule 2.)
//
// Publication is a witnessed per-thread act: a ThreadPublished protocol
// event appended to the thread itself, revocable only by appending a
// ThreadPublicationRevoked. No schema change, no flag column — the record
// IS the state, and the effective state is the LAST publication event on
// the thread.
//
// Fail closed: a publication event that is malformed, carries an action
// disagreeing with its event type, or names a scope other than the one
// registered scope ("public-read") publishes nothing — and, being the last
// publication event, it also masks any earlier publish. Unguessable slugs
// are not access control; this function is.
'use strict';

const PUBLISH = 'ThreadPublished';
const REVOKE = 'ThreadPublicationRevoked';

// envelopes: the thread's parsed record bodies, in seq order
// ({ kind, payload } is all this reads). Returns { published, act } where
// act is the governing event's threadPublication object (null if none).
function effectivePublication(envelopes) {
  let last = null;
  for (const env of envelopes) {
    if (env?.kind !== 'clista.event') continue;
    const type = env.payload?.event_type;
    if (type === PUBLISH || type === REVOKE) last = env;
  }
  if (!last) return { published: false, act: null };
  const act = last.payload?.payload?.threadPublication ?? null;
  const published = last.payload.event_type === PUBLISH
    && act?.action === 'publish'
    && act?.scope === 'public-read';
  return { published, act };
}

module.exports = { effectivePublication, PUBLICATION_EVENT_TYPES: Object.freeze([REVOKE, PUBLISH]) };
