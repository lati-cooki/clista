import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Allow the browser-automation container to reach the dev server by host alias.
    allowedHosts: ['host.docker.internal', 'localhost'],
  },
});
