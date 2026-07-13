// vitest.config.js — @cloudflare/vitest-pool-workers 0.18.x pairs with
// vitest 4 and exposes cloudflareTest as a Vite PLUGIN (defineWorkersConfig
// is gone). Wrangler config supplies compat date/flags, the DO binding,
// and the Text rule for verify-standalone.mjs; the miniflare block injects
// the test-only write token (production uses a wrangler secret).
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: { THREADHUB_WRITE_TOKEN: 'test-operator-token' },
      },
    }),
  ],
  resolve: {
    // Mirror of wrangler.jsonc's alias. In the test pool node:sqlite is on
    // workerd's builtin list, so this alias is usually bypassed; it is kept
    // so any non-externalized resolution still lands on the inert stub.
    alias: {
      'node:sqlite': path.resolve(import.meta.dirname, 'src/node-sqlite-stub.js'),
    },
  },
});
