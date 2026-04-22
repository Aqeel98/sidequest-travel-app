import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE (Phase 1 — Kill Switch):
// vite-plugin-pwa is intentionally disabled for this release so the only
// service worker served at /sw.js is the self-destructing kill-switch in
// public/sw.js. Re-enable (and remove public/sw.js) in Phase 2 when the
// kill-switch window ends. See foundation.md §13 for details.

export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: ['leaflet']
  }
});
