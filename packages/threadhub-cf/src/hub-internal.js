// hub-internal.js — HubInternal: the hub's service-binding face. A named
// WorkerEntrypoint the studio Worker binds as
//   { "binding": "HUB", "service": "threadhub-cf", "entrypoint": "HubInternal" }
// and calls over RPC (workers/studio/src/hub.js is the client wrapper; its
// test/hub-stub.js is the exact contract this class implements).
//
// This is a SECOND face on the same store, not a second store. Both methods
// resolve the ONE named HubDO instance — idFromName('hub'), the same address
// worker.js's fetch path uses — so an identity minted here is immediately
// visible on the HTTP face and a publication event written over HTTP is
// immediately visible to isPublished. The DO holds the Hub and its
// invariants; this entrypoint only carries the two calls across the binding.
//
// The entrypoint deliberately does NO catching: both methods throw on hub
// failure, and the studio client (hub.js) owns the fail-closed policy —
// mintIdentity throws propagate (mint-first ordering: nothing filed), and
// isPublishedSafe swallows isPublished throws into `false`. Keeping the
// policy on the caller's side keeps this face a faithful transport.
import { WorkerEntrypoint } from 'cloudflare:workers';

// The single hub instance, addressed exactly as worker.js addresses it
// (instance name bumped 'hub'->'hub-prod' at the consensusprotocol.ai cutover
// for a fresh DO — MUST stay identical to worker.js).
const hubStub = (env) => env.HUB.get(env.HUB.idFromName('hub-prod'));

export class HubInternal extends WorkerEntrypoint {
  // mintIdentity({ display_name, kind }) -> { id }
  async mintIdentity({ display_name, kind }) {
    return await hubStub(this.env).mintIdentity({ display_name, kind });
  }

  // isPublished(slug) -> boolean (effective publication state; missing → false)
  async isPublished(slug) {
    return await hubStub(this.env).isPublished(slug);
  }
}
