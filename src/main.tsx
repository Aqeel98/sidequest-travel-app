import { createRoot } from 'react-dom/client'
import './index.css'
// @ts-expect-error App.jsx is not typed
import App from './App.jsx'

// One-time housekeeping: remove dead localStorage keys left over from legacy
// cache-purge mechanisms that predated the Phase 1 kill-switch. These keys
// are never read or written by any current code (the purge/version system
// that used them was removed before the kill-switch release). Sweeping them
// keeps every user's localStorage clean so inert fossils don't accumulate.
try {
  localStorage.removeItem('sq_v370_stable_purge');
  localStorage.removeItem('sq_app_version');
} catch {
  // localStorage can throw in privacy mode or sandboxed contexts. The app
  // still runs fine without this cleanup, so we silently ignore.
}

createRoot(document.getElementById('root')!).render(
  
    <App />
  
)
