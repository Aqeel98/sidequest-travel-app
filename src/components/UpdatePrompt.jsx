import React, { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdatePrompt
 * --------------------------------------------------------------
 * Canonical vite-plugin-pwa update flow (registerType: 'prompt').
 *
 * When a new Service Worker finishes installing in the background,
 * `needRefresh` becomes true and we render a small, non-blocking
 * banner asking the user to reload. The reload happens exactly
 * ONCE, only on explicit user action.
 *
 * Replaces the old manual "nuke SW + caches + location.replace"
 * pattern that caused reload loops on deploy.
 */
export default function UpdatePrompt() {
    // The latest ServiceWorkerRegistration, kept in a ref so the
    // polling interval always sees the current value without being
    // recreated when it changes.
    const registrationRef = useRef(null);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl, registration) {
            registrationRef.current = registration || null;
        },
        onRegisterError() {
            // Silently ignore. The app still works without SW updates.
        },
    });

    // Poll for a new version every 10 minutes while the app is open.
    // Interval is owned here (not inside onRegisteredSW) so it is
    // guaranteed to be cleared on unmount.
    useEffect(() => {
        const intervalId = setInterval(() => {
            registrationRef.current?.update().catch(() => {});
        }, 10 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    if (!needRefresh) return null;

    const handleRefresh = () => {
        updateServiceWorker(true);
    };

    const handleDismiss = () => {
        setNeedRefresh(false);
    };

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2100] w-[min(92vw,420px)]"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-white/10 text-white rounded-2xl shadow-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-wide">
                        New version of SideQuest is ready
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                        Refresh to get the latest features and fixes.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 active:scale-95 transition-all px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg"
                >
                    <RefreshCw size={12} />
                    Refresh
                </button>
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss update notice"
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg shrink-0"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
