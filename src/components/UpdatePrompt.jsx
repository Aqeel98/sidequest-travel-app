import React from 'react';
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
 * This replaces the old manual "nuke SW + caches + location.replace"
 * pattern that caused reload loops on deploy.
 */
export default function UpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl, registration) {
            // Poll for a new version every 60 minutes while the app is open.
            // Users on long sessions (e.g. during a trip) will still get prompted.
            if (registration) {
                setInterval(() => {
                    registration.update().catch(() => {});
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError() {
            // Silently ignore. The app still works without SW updates.
        },
    });

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
            <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-2xl shadow-2xl px-4 py-3">
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
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors px-3 py-2 rounded-xl text-sm font-bold shadow-sm"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss update notice"
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
