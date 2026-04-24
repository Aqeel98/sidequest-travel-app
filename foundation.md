# SideQuest Foundation Reference

This document is the canonical technical foundation for the `sidequest-travel-app` codebase.
It is intended for:
- Developers onboarding to the project
- AI agents assisting with future implementation

---

## 1) Project Identity

- **Project Name:** SideQuest (current package name is still template-derived: `vite-react-typescript-starter`)
- **Product Type:** PWA web app for impact-focused travel quests in Sri Lanka
- **Primary Runtime:** Browser (client-side SPA)
- **Core Domain Flows:**
  - Discover and filter quests
  - Join quest and submit proof
  - Earn XP and redeem rewards
  - Partner content creation and voucher verification
  - Admin moderation and security management
  - Quiz gamification and emergency support directory

---

## 2) Full Stack Inventory (Detected)

### Frontend Framework and App Runtime
- **React** `^18.3.1`
- **React DOM** `^18.3.1`
- **Routing:** `react-router-dom` `^7.13.1` (using `BrowserRouter`, nested routes)
- **State Pattern:** Global React Context (`SideQuestContext`) + local component state
- **App Entry:** `src/main.tsx` -> renders `App.jsx`

### Build System and Tooling
- **Bundler/Dev Server:** `vite` `^7.2.4`
- **React Plugin:** `@vitejs/plugin-react` `^4.3.1`
- **TypeScript:** `~5.9.3` (mixed TS + JS codebase)
- **Build Script:** `tsc -b && vite build`

### Styling and UI
- **Tailwind CSS** `^3.4.1`
- **PostCSS** `^8.4.35`
- **Autoprefixer** `^10.4.17`
- **Custom CSS:** `src/index.css` + `src/App.css`
- **Icons:** `lucide-react` `^0.263.1`
- **Font:** Plus Jakarta Sans (Google Fonts)

### Maps and Geolocation
- **Leaflet** `^1.9.4`
- **React Leaflet** `^4.2.1`
- Browser Geolocation API (manual locate + watch mode + fallback modes)

### Backend and Data Layer
- **Backend-as-a-Service:** Supabase
- **Client SDK:** `@supabase/supabase-js` `^2.99.0`
- **Used Features:**
  - Auth (password login/signup, reset password, MFA challenge/verify)
  - Database (CRUD and realtime subscriptions)
  - RPC calls (`submit_quiz_answer`, `redeem_reward`)
  - Storage buckets (`quest-images`, `proofs`)
  - Realtime channels (`postgres_changes`)
- **Supabase Config Source:** env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

### PWA and Performance
- **PWA Plugin:** `vite-plugin-pwa` `^1.2.0`
- **Current release mode:** plugin intentionally disabled in `vite.config.ts` during Phase 1 stale-SW recovery
- Active service worker is the one-time kill-switch at `public/sw.js`:
  - no fetch interception (network-first behavior preserved)
  - cache purge in install/activate
  - self-unregister on activate
  - client reload message dispatch for stale-tab recovery
- App-level fallback recovery in `App.jsx` (`recoverFromStaleServiceWorker`) with a loop guard key: `sq_sw_self_heal_attempted`
- `UpdatePrompt` remains mounted but install/update prompt behavior is intentionally muted while kill switch is active
- Long-term immutable cache for hashed build output via `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` in `vercel.json`

### Analytics and Monitoring
- **Vercel Analytics:** `@vercel/analytics` `^1.0.0`
- **Vercel Speed Insights:** `@vercel/speed-insights` `^1.0.0`
- No error monitoring SDK detected (e.g., Sentry, Bugsnag)

### Additional Libraries
- **Image compression:** `browser-image-compression` `^2.0.2`
- **Gestures/swipe:** `react-swipeable` `^7.0.0`
- **SEO head management:** `react-helmet-async` `^2.0.5`

### Linting and Code Quality
- **ESLint** `^9.39.1`
- `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Lint script currently runs across the repo via `eslint .`

### Deployment / Hosting
- **Deployment target detected:** Vercel
- `vercel.json` configured for SPA rewrites and security/cache headers
- No CI workflows detected (`.github/workflows` absent)

---

## 3) Architecture Overview

### Application Shape
- **Architecture:** Client-heavy SPA with Supabase as managed backend
- **Data Orchestration:** Centralized in `SideQuestContext`
- **Rendering:** Route-based page components under `src/pages`

### Global State and Domain Hub
- **Main state container:** `src/context/SideQuestContext.jsx`
- **Preferences state container:** `src/context/AppPreferencesContext.jsx` (theme + language + translation helper)
- Handles:
  - Authentication/session hydration
  - Profile and role state
  - Quest, reward, submission, redemption, quiz, suggestions datasets
  - Realtime DB synchronization
  - Toast system
  - Cross-flow action methods (accept quest, submit proof, redeem reward, moderation)

### Offline/Resilience Model
- Uses browser storage for deferred payloads:
  - `sq_auto_proof`
  - `sq_auto_submit`
  - `sq_pending_quiz`
  - `sq_pending_suggestion`
  - `sq_admin_deferred`
  - `sq_pending_redemption`
  - `sq_pending_voucher`
- Pattern used extensively:
  1. Save payload locally
  2. Force page reload
  3. Resume flow from storage
- Goal: recover from unstable mobile networks / dormant sockets

### Security and Access Model (App-Level)
- Role-aware UX and data handling for:
  - Traveler
  - Partner
  - Admin
- MFA integrated for admin flows
- Password policy validator in `src/utils/security.js`
- Security headers via `vercel.json`

---

## 4) Route and Feature Map

Defined in `App.jsx`:

- `/` -> Home
- `/map` -> Interactive map + nearest quests + suggestion modal
- `/how-it-works` -> Traveler/Partner guides + invite request
- `/quest/:id` -> Quest details + acceptance + proof submission
- `/my-quests` -> User progress + proof statuses + suggestions status
- `/rewards` -> Reward catalog + redemption history
- `/profile` -> XP, level, badges, completed quest timeline
- `/partner` -> Partner dashboard (create/manage quests/rewards, verify codes)
- `/admin` -> Admin moderation/oversight/security controls
- `/emergency` -> Island-wide emergency and hospital lookup
- `/quiz` -> Tiered quiz system with XP rewards
- `/privacy` -> Privacy policy page
- `/terms` -> Terms and conditions page

---

## 5) Data Surfaces (Observed Supabase Tables/Views/RPC)

### Tables / Views Referenced
- `profiles`
- `quests`
- `rewards`
- `submissions`
- `redemptions`
- `quiz_completions`
- `view_quiz_public` (view)
- `quest_suggestions`
- `partner_requests`
- `invite_codes`

### RPC Functions Referenced
- `submit_quiz_answer`
- `redeem_reward`

### Storage Buckets Referenced
- `quest-images`
- `proofs`

---

## 6) Environment and Configuration

### Required Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Not Present in Repo
- `.env.example` not found
- `.env.local` is present for local development secrets
- Supabase SQL migrations not found in `supabase/**/*.sql`
- GitHub Actions workflow files not found

---

## 7) Build, Dev, and Commands

From `package.json`:

- `npm run dev` -> Start Vite dev server
- `npm run build` -> TypeScript build + Vite production build
- `npm run lint` -> Run ESLint
- `npm run preview` -> Preview production build locally

---

## 8) Notable Implementation Patterns

- Mixed TypeScript + JavaScript codebase:
  - TS configs exist, but many core modules are `.jsx/.js`
  - Entry is TS (`main.tsx`) importing JS App component
- Heavy use of optimistic UI updates in context actions
- Realtime synchronization via Supabase channel listeners
- Significant mobile/network hardening logic with timeouts and retries
- PWA install and cache behavior tuned for app-like usage
- Dynamic SEO tags with `react-helmet-async`

---

## 9) Security and Platform Posture

### Positive Signals
- Security headers in `vercel.json`
- Password complexity rules implemented
- Supabase MFA logic for admin flows
- Canonical tags and metadata present
- No-store cache policy applied to `sw.js`, `workbox-*.js`, and `manifest.webmanifest`

### Risks / Gaps To Watch
- Auth and admin logic partly enforced in frontend code; final authority should remain in Supabase RLS and policies
- Potentially sensitive info can leak if verbose client logs are left enabled in production for some code paths
- No explicit CSP header in `vercel.json`
- No formal secret template (`.env.example`) for onboarding consistency

---

## 10) Testing, QA, and CI Status

- **Automated tests:** none detected (no Jest/Vitest/Playwright/Cypress config)
- **CI pipelines:** none detected
- **Type safety:** partial (mixed JS/TS; broad linting enabled via `eslint .`)

Implication: regressions are currently likely to be caught mostly by manual testing.

---

## 11) Current External Integrations

- **Supabase** (auth, db, storage, realtime)
- **Vercel** (hosting config + analytics + speed insights)
- **Google Maps web links** for navigation handoff
- **Google Fonts CDN** for typography
- **Carto tile servers** for map tiles

---

## 12) Project Structure Snapshot

Top-level key files/folders:

- `src/`
  - `components/`
    - `UpdatePrompt.jsx` — PWA update banner (service worker controller)
    - `InstallBanner.jsx` — PWA install prompt UX
  - `context/SideQuestContext.jsx`
  - `pages/`
  - `supabaseClient.js`
  - `utils/security.js`
- `index.html`
- `vite.config.ts` (sole Vite config; do not reintroduce a `.js` duplicate)
- `tailwind.config.js`
- `postcss.config.js`
- `eslint.config.js`
- `tsconfig*.json` (build artifacts routed to `node_modules/.cache/` via `outDir` / `tsBuildInfoFile`)
- `vercel.json`

---

## 13) Cross-Branch Feature Inventory (Main + Active Feature Branches)

This section captures branch-level deltas that are not fully merged into `main` yet.
Source basis: `git diff --name-only main..feature/*` plus route inspection from branch `src/App.jsx`.

### `feature/travel-agency` Delta (vs `main`)

- **Additional routes observed:**
  - `/hunt`
  - `/hunt/:stopId`
  - `/leaderboard`
  - `/plan-trip`
  - `/my-journey`
- **Additional pages/components observed:**
  - `src/pages/TravelAgency.jsx`
  - `src/pages/MyJourney.jsx`
  - `src/pages/HuntDashboard.jsx`
  - `src/pages/HuntStop.jsx`
  - `src/pages/Leaderboard.jsx`
  - `src/pages/HuntAdminTab.jsx`
  - `src/components/HuntCodeModal.jsx`
  - `src/components/HuntStopCard.jsx`
- **Backend/serverless additions observed:**
  - `supabase/functions/create-checkout-session/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`
- **Branch notes:**
  - Introduces travel-planning and hunt gamification surfaces not currently active on `main`.
  - Includes broad UI asset + theme updates (landing icons, category images, navigation assets).

### `feature/colombo-hunt` Delta (vs `main`)

- **Additional routes observed:**
  - `/hunt`
  - `/hunt/register`
  - `/hunt/payment`
  - `/hunt/:stopId`
  - `/leaderboard`
- **Additional pages/components observed:**
  - `src/pages/HuntDashboard.jsx`
  - `src/pages/HuntRegistration.jsx`
  - `src/pages/HuntPayment.jsx`
  - `src/pages/HuntStop.jsx`
  - `src/pages/Leaderboard.jsx`
  - `src/pages/HuntAdminTab.jsx`
  - `src/components/HuntCodeModal.jsx`
  - `src/components/HuntStopCard.jsx`
- **Backend/serverless additions observed:**
  - `supabase/functions/create-hunt-checkout-session/index.ts`
  - `supabase/functions/stripe-webhook-hunt/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`
- **DB migration footprint observed:**
  - `supabase/migrations/001_hunt_rls_hardening.sql`
  - `supabase/migrations/002_hunt_rpc_guardrails.sql`
  - `supabase/migrations/003_hunt_leaderboard_ordering.sql`
  - `supabase/migrations/004_hunt_teams_and_registrations.sql`
  - `supabase/migrations/005_hunt_registration_rls.sql`
  - `supabase/migrations/006_hunt_payments_core.sql`
  - `supabase/migrations/007_hunt_bank_transfer.sql`
  - `supabase/migrations/008_admin_reset_hunt_access_cleanup.sql`
- **Branch notes:**
  - Hunt feature is operationally deeper than `feature/travel-agency` (registration + payment + migration set).
  - Adds explicit database hardening and payment lifecycle support for hunt operations.

### Consolidation Guidance

- Treat `main` as canonical runtime baseline until branch features are merged.
- Before merging either branch, reconcile:
  - route collisions in `src/App.jsx`
  - Supabase edge function naming/ownership (`create-checkout-session` vs `create-hunt-checkout-session`)
  - migration ordering and idempotency
  - admin panel overlap (`HuntAdminTab` + existing moderation controls)

---

## 14) Recommendations (Detected + Suggested Improvements)

Priority ordered for maintainability and safe scaling:

1. **Add CI immediately**
   - Run `npm run lint` + `npm run build` on PRs
   - Block merges on failure

2. **Add test baseline**
   - Unit tests for critical context actions
   - Integration tests for auth, quest flow, reward redemption

3. **Add `.env.example`**
   - Document required env keys and expected formats

5. **Tighten lint/type coverage**
   - Extend linting to JS/JSX files
   - Gradually migrate critical modules (especially context) to TypeScript

6. **Formalize architecture docs for data model**
   - Add ERD/table contract docs (profiles, quests, submissions, redemptions)
   - Include expected RPC behavior and role policy assumptions

7. **Introduce error monitoring**
   - Add Sentry or equivalent for runtime error visibility in production

8. **Review resilience pattern**
   - Current localStorage + forced reload strategy is pragmatic but complex
   - Consider service-worker-backed queue or controlled retry layer to reduce full refresh dependency

9. **Strengthen security headers**
   - Add CSP and refine Permissions-Policy as app evolves

10. **README modernization**
   - Replace template README with project-specific setup, architecture, and operations docs

### Recently Completed

- Phase 1 stale-service-worker recovery deployed:
  - `vite-plugin-pwa` temporarily disabled in `vite.config.ts`
  - one-time self-destructing kill-switch service worker added at `public/sw.js`
  - app-side stale SW fallback recovery added in `App.jsx` with loop guard
- Collapsed duplicate Vite config to a single `vite.config.ts`; redirected `tsc -b` build artifacts into `node_modules/.cache/` so the repo root stays clean
- Added long-term immutable caching for `/assets/*` in `vercel.json`

---

## 15) AI Usage Notes (For Future Agent Work)

When building features in this repo, assume:

- Most business behavior is centralized in `SideQuestContext`; update there first for cross-page consistency.
- Role-based behavior is tightly coupled to UI + context action guards.
- Network instability handling is intentional; avoid removing local persistence/recovery paths unless replacing with equivalent reliability.
- Realtime updates may duplicate local optimistic changes; preserve dedupe checks.
- PWA behavior is in a temporary kill-switch phase; do not remove `public/sw.js` or re-enable `vite-plugin-pwa` until Phase 2 is explicitly scheduled.
- Keep stale-SW recovery guard semantics (`sq_sw_self_heal_attempted`) to avoid client reload loops.
- Keep exactly one Vite config (`vite.config.ts`). If a `vite.config.js` or `vite.config.d.ts` reappears at the repo root, it means `tsc -b` emit paths regressed — fix `tsconfig.node.json` / `tsconfig.app.json` `outDir` + `tsBuildInfoFile` rather than committing the artifacts.

Recommended first checks before major changes:
- `package.json` scripts
- `src/context/SideQuestContext.jsx`
- `src/App.jsx` route map
- `vite.config.ts` PWA setup
- `vercel.json` routing/security headers

---

## 16) Quick Start for New Contributors

1. Install deps: `npm install`
2. Add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run dev server: `npm run dev`
4. Validate quality:
   - `npm run lint`
   - `npm run build`
5. Review role flows manually:
   - Traveler: quest accept + proof submit
   - Partner: create/edit + verify voucher
   - Admin: moderation + security vault

---

This file should be updated whenever:
- major dependencies change
- route structure changes
- Supabase schema/RPC contracts change
- deployment/security policies change
