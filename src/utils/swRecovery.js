export const STALE_SW_HEAL_FLAG = 'sq_sw_self_heal_attempted';
const BOOT_SWEEP_FLAG = 'sq_boot_sweep_done';

export async function purgeServiceWorkerAndCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

export async function hasStalePWARemnants() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length > 0) return true;
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    if (cacheNames.length > 0) return true;
  }

  return false;
}

export function hardReloadWithCacheBust() {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('sq_force_refresh', Date.now().toString());
  window.location.replace(nextUrl.toString());
}

export function recoverFromStaleServiceWorker() {
  purgeServiceWorkerAndCaches()
    .catch(() => {})
    .finally(hardReloadWithCacheBust);
}

/** @returns {Promise<boolean>} true if a reload was triggered */
export async function bootSweepIfNeeded() {
  try {
    if (!(await hasStalePWARemnants())) {
      sessionStorage.removeItem(BOOT_SWEEP_FLAG);
      return false;
    }

    if (sessionStorage.getItem(BOOT_SWEEP_FLAG) === '1') return false;

    sessionStorage.setItem(BOOT_SWEEP_FLAG, '1');
    await purgeServiceWorkerAndCaches();
    hardReloadWithCacheBust();
    return true;
  } catch {
    return false;
  }
}
