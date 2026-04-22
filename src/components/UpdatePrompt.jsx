/*
 * UpdatePrompt — Phase 1 (Kill Switch)
 *
 * Temporarily rendered as null. During the kill-switch window we do NOT
 * register any service worker from the app, because public/sw.js is a
 * self-destructing cleanup worker.
 *
 * In Phase 2, restore the original implementation from git history
 * (useRegisterSW from 'virtual:pwa-register/react') and re-enable
 * vite-plugin-pwa in vite.config.ts.
 */
export default function UpdatePrompt() {
    return null;
}
