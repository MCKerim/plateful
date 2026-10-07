# The E2E dev server mounts no React Query devtools

_Since 2026-10-07 `playwright.config.ts` passes `VITE_E2E=true` to the dev server it starts, and `src/main.tsx` mounts `ReactQueryDevtools` only in development without that flag._

**Symptom.** `Authenticated User Flows › should navigate between cookbook and planner` (`e2e/authenticated.spec.ts`) failed on every run of the `Mobile Chrome` project (Pixel 5 viewport) and passed on desktop `chromium`. Playwright retried the click for the whole timeout with `<circle …> from <div class="tsqd-parent-container"> subtree intercepts pointer events`. That `div` is the TanStack Query devtools' floating toggle. Its default `buttonPosition` is bottom-right, which at a phone width lands exactly on the Planner link, the rightmost item of `BottomNav`. On a desktop width the toggle sits far to the right of the centred `max-w-lg` navigation and overlaps nothing.

**Why it reached the tests.** The suite runs `npm run dev`, so `import.meta.env.MODE` is `development`, and the devtools used to be mounted on that condition alone. Switching the server to another Vite mode (`--mode e2e`) is the wrong fix: `AppProviders` skips PostHog only in `development`, so any other mode would make every test send analytics to the real PostHog host, which the `backendGuard` does not cover (it guards Supabase paths and the extractor host).

**The rule.** Anything that only serves developers and paints over the UI (devtools, overlays, debug toggles) is mounted behind `showQueryDevtools`-style flags that are off under `VITE_E2E`, so the suite sees the app as a user does. Do not work around an overlay in a test with `force: true` or by moving the overlay somewhere else; a forced click proves nothing about what a user can reach.

Source: local runs of `npx playwright test e2e/authenticated.spec.ts --project="Mobile Chrome" --repeat-each=3` on `main`, 2026-10-07 (3 failed, 9 passed before; 12 passed after).
