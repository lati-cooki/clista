import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

// Runs the in-runtime DO tests inside workerd (the real Worker + ThreadDO/IndexDO
// SQLite + ported engine), driven through the actual fetch router. Engine parity
// tests stay on node:test (`npm test`); this is `npm run test:workers`.
// (pool-workers 0.16 / vitest 4 replaced defineWorkersConfig with this plugin.)
export default defineConfig({
  plugins: [
    cloudflareTest({
      // Worker definition (DO bindings, migrations, engine) from the real deploy config.
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        // Enable the dev-identity path so writes authenticate via X-Clista-Email
        // (production reads Cloudflare Access; never set DEV_IDENTITY in prod).
        bindings: { DEV_IDENTITY: 'true', DEV_EMAIL: 'troylati@gmail.com' },
      },
    }),
  ],
  test: {
    include: ['test/workers/**/*.test.js'],
  },
});
