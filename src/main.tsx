import { createRoot } from 'react-dom/client'
import './index.css'
// @ts-expect-error App.jsx is not typed
import App from './App.jsx'

// Phase 1 — Kill Switch fast path.
// When the kill-switch service worker finishes cleanup it posts a
// one-time reload message. We guard with sessionStorage so this can
// never loop, and we silently ignore if the browser has no SW support
// or the page was loaded in an incompatible context.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event && (event as MessageEvent).data;
      if (data && data.type === 'SQ_KILLSWITCH_RELOAD') {
        const key = 'sq_killswitch_reloaded';
        try {
          if (sessionStorage.getItem(key) === '1') return;
          sessionStorage.setItem(key, '1');
        } catch (_e) {
        }
        window.location.reload();
      }
    });
  } catch (_e) {
  }
}

createRoot(document.getElementById('root')!).render(
  
    <App />
  
)
