import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['favicon.ico', 'favicon-96x96.png', 'sq-v4-apple.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'SideQuest v3.5',
        short_name: 'SideQuest',
        description: 'Discover meaningful quests across Sri Lanka.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'sq-v4-apple.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        disableDevLogs: true, 
        navigateFallbackDenylist: [/^\/api/], 
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/dtowdaysr\/image\/fetch\/.*sisyjuaspeznyrmipmlo\.supabase\.co.*/i,
            handler: 'CacheFirst', 
            options: {
              cacheName: 'quest-image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    })
  ],
  optimizeDeps: {
    include: ['leaflet']
  }
});