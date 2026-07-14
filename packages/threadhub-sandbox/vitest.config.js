// vitest.config.js — mirrors packages/threadhub-cf. @cloudflare/vitest-pool-
// workers 0.18.x exposes cloudflareTest as a Vite PLUGIN. Wrangler config
// supplies compat date/flags, the DO binding, the vars, and the Text rule for
// verify-standalone.mjs.
//
// NOTE: TURNSTILE_SECRET is intentionally NOT bound here. An unset secret is
// the seam's allow/no-op posture, so the end-to-end suite runs without a
// widget. The fail-closed-when-secret-set path is exercised by tests that
// mutate `env.TURNSTILE_SECRET` at runtime.
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
    }),
  ],
  // Only the Worker-pool tests here. The real-checker test runs in a Node
  // environment (vitest.node.config.js) because verify-standalone.mjs is a
  // Text import in the Worker bundle and is not callable as a module in-pool —
  // the same limitation the Phase-0 spike hit; it ran the checker Node-side.
  test: { include: ['test/**/*.test.js'] },
  resolve: {
    alias: {
      'node:sqlite': path.resolve(import.meta.dirname, 'src/node-sqlite-stub.js'),
    },
  },
});
