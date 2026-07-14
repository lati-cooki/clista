// vitest.node.config.js — a plain Node-environment project for the ONE test
// that must import verify-standalone.mjs as a MODULE (the Worker bundle
// Text-imports it, so it is a string in-pool). Here there is no cloudflareTest
// plugin and no Text rule, so the real checker is callable — the same
// Node-side approach the Phase-0 spike used to prove PASS n/n.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test-node/**/*.test.js'],
    environment: 'node',
  },
});
