import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: false, 
      includeAssets: [
        'apple-touch-icon.png',
        'pwa-192-v3.png',
        'pwa-512-v3.png',
        'site.webmanifest'
      ],      
      workbox: {
        cleanupOutdatedCaches: true, 
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  optimizeDeps: {
    include: ['leaflet']
  },
});