/*
 * SideQuest — Phase 1 Kill-Switch Service Worker
 *
 * Purpose: One-time, self-destructing Service Worker deployed at /sw.js
 * to recover browsers that are stuck on an older, poisoned Service Worker
 * from a previous release. It never intercepts fetches, never caches,
 * and unregisters itself the moment it activates.
 *
 * Design guarantees:
 *   - No `fetch` event handler => browser passes every request straight to
 *     the network, so even while this SW is transiently active it cannot
 *     serve stale content.
 *   - `skipWaiting()` in install + `clients.claim()` in activate => takes
 *     control of every open tab in scope as soon as possible.
 *   - Caches are purged in BOTH install and activate so we catch entries
 *     that may have been (re)created between the two phases.
 *   - The reload message is posted to clients BEFORE unregister() is
 *     called, to avoid any browser-specific race where unregister tears
 *     down the messaging channel before delivery.
 *   - A sessionStorage guard on the client side prevents reload loops.
 *
 * Do NOT edit in Phase 2. This file should be deleted (and vite-plugin-pwa
 * re-enabled) when the kill-switch window ends.
 */

const KILL_SWITCH_VERSION = 'sq-killswitch-v1';

async function purgeAllCaches() {
  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } catch (_e) {
    // caches API may be unavailable in some contexts; fail open.
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(purgeAllCaches());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch (_e) {}

      await purgeAllCaches();

      // Post the one-time reload message to every window client BEFORE we
      // unregister. Posting after unregister is spec-legal but has been
      // observed to race in some browsers.
      try {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          try {
            client.postMessage({
              type: 'SQ_KILLSWITCH_RELOAD',
              version: KILL_SWITCH_VERSION,
            });
          } catch (_e) {}
        }
      } catch (_e) {}

      try {
        await self.registration.unregister();
      } catch (_e) {}

      // Final safety sweep: if anything repopulated caches during
      // unregister, clear once more. This is paranoid but harmless.
      await purgeAllCaches();
    })()
  );
});
