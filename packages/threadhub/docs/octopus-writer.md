# Octopus writer — build decisions as verifiable records

How a Hermes Agent plugin (Octopus) emits its build decisions into Thread
Hub as `clista.event` records. Module: `adapters/octopus.js`. Tests:
`test/octopus.test.js`.

## The two rules

1. **The adapter emits protocol; it does not own protocol.** Octopus maps
   its build events to plain ClisTa events. The hub stores, chains, and
   verifies them like any other record. No privileged writer exists.
2. **Agents are non-custodial.** Octopus generates and holds its own
   ed25519 keypair and submits pre-signed envelopes via
   `POST /t/:slug/records/signed`. The hub never sees the private key, so
   an Octopus signature proves authorship, not just custody — the exact
   property the founding thread's minority report says custodial
   signatures lack.

## Event mapping

| Octopus build event | ClisTa event | Why |
| --- | --- | --- |
| `cascade-block` | `ObjectionRaised` | A halted cascade is a dissent against the build proceeding: who blocked, what gate, what reason — recorded, attributable, permanent. |
| `recovery` | `DecisionMerged` | The unblock is a decision. Its `preservedObjectionIds` carries the id of the cascade-block it resolves, so the objection is answered on the record, never erased. |

Anything else throws `unsupported build event type` — unknown events are
refused, not guessed at. Extend the mapping deliberately, with a test.

Object ids are derived from build content (`obj_<hash of build_id+task>`),
so re-emitting the same build event is idempotent in content; only the
chain position differs. A recovery computes the same objection id from the
same `build_id` + `task`, which is how the pair links without shared state.

## One-time setup (per Octopus instance)

```js
const identity = require('threadhub/src/identity');

// 1. Octopus generates and keeps its own keypair (never share privateKeyPem)
const keypair = identity.generateKeypair();

// 2. Register only the public key with the hub
await fetch(`${HUB}/identities`, {
  method: 'POST',
  body: JSON.stringify({
    display_name: 'Octopus', kind: 'agent', public_key: keypair.publicKeyHex,
  }),
}); // -> { id: "id_...", custodial: false }
```

## Per build decision

```js
const { OctopusWriter } = require('threadhub/adapters/octopus');

const writer = new OctopusWriter({
  baseUrl: HUB,            // e.g. "https://hub.example"
  slug: 'octo-build',      // an existing thread
  authorId: 'id_octopus',  // from registration
  keypair,                 // client-held
  actorId: 'par_octopus',  // ClisTa participant id inside the events
});

// when a cascade blocks:
await writer.emit({
  type: 'cascade-block',
  build_id: 'bld_7',
  task: 'deploy preview',
  reason: 'failing healthcheck',
  at: new Date().toISOString(),
});

// when the build recovers:
await writer.emit({
  type: 'recovery',
  build_id: 'bld_7',
  task: 'deploy preview',
  resolution: 'rolled back migration 0042',
  at: new Date().toISOString(),
});
```

`emit()` reads the thread head from `GET /t/:slug/verify`, builds the
envelope at the next chain position, signs its content address, and
submits. If another writer landed a record in between, the hub rejects
with `stale chain position` — re-call `emit()` to rebuild against the new
head. The hub re-validates everything on submit; the writer needs no
trust beyond the records it can verify itself.
