// node-sqlite-stub.js — inert stand-in for node:sqlite on Workers.
//
// hub.js requires ./store.js at module load, and store.js requires
// node:sqlite. On Workers the Hub is always constructed with a duck-typed
// DOStore, so Store is never instantiated — this stub only exists so the
// bundle resolves. Constructing it is a wiring bug, and it says so.
// (wrangler.jsonc aliases node:sqlite here; vitest.config.js mirrors it.)
export class DatabaseSync {
  constructor() {
    throw new Error(
      'node:sqlite is not available on Workers: construct Hub with a duck-typed ' +
      'store (DOStore over ctx.storage.sql), never with a database path.'
    );
  }
}
export default { DatabaseSync };
