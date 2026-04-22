/*
 * SideQuest — Phase 1 Kill-Switch Service Worker
 *
 * Purpose: One-time, self-destructing Service Worker deployed at /sw.js
 * to recover browsers that are stuck on an older, poisoned Service Worker
 * from a previous release. It never intercepts fetches, never caches,
 * and unregisters itself the moment it activates.
 *
 * Do NOT edit in Phase 2. This file should be deleted (and vite-plugin-pwa
 * re-enabled) when the kill-switch window ends.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      } catch (_e) {
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch (_e) {}

      try {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      } catch (_e) {}

      try {
        await self.registration.unregister();
      } catch (_e) {}

      try {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          try {
            client.postMessage({ type: 'SQ_KILLSWITCH_RELOAD' });
          } catch (_e) {}
        }
      } catch (_e) {}
    })()
  );
});
