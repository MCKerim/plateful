# E2E tests never reach the backend

_Since 2026-10-05 the Playwright suite runs against a backend host that cannot resolve, and a request without a mock fails the test. Before that, CI queried the production project on every push and had been red since the profile hardening of 2026-07-26._

**What went wrong.** `ci.yml` gave the E2E dev server the production project URL and a fake anon key, and the fixtures mocked only the endpoints someone had thought of. On 2026-07-26 the app started reading the profile through `rpc/get_current_profile` (`f47b5b4`); the fixtures still mocked `users` for it. From then on every signed-in test asked production for the profile, got a 401, and timed out: 53 of 65 tests failed, a run took 50 minutes instead of one, and each push sent ≈ 280 unauthenticated requests to production (559 in the 24 hours before it was found). The `build` job needs the E2E job, so it was skipped the whole time as well. Nobody noticed because a red CI on `main` blocks nothing here: Vercel deploys regardless.

It surfaced from the other side, as "a web client polling with a dead session" in the Supabase logs. The giveaway was the referer `http://localhost:5173/`, a user agent that is Playwright's `Desktop Chrome` descriptor, an Azure address (GitHub's runners), and bursts that matched the CI runs to the minute.

**How it is closed now.**

- `playwright.config.ts` starts its own dev server on port **5174** with `VITE_SUPABASE_URL=https://e2e.supabase.invalid` (`e2e/fixtures/backend.ts`). Process env wins over `.env`, and a server on 5173 with the real backend configured is never reused. `ci.yml` no longer names the project for the E2E step.
- `backendGuard` (an automatic fixture in `e2e/fixtures/index.ts`) answers every unmocked backend request with a 501, records it, and fails the test with the list. It is registered before the mocks, because Playwright asks the most recently registered route first. Realtime is a WebSocket, which `page.route` never sees; `routeWebSocket` opens it and keeps it silent.
- All specs import from `./fixtures`, including the signed-out ones, so the guard is always on.
- `auth.fixture.ts` falls back to the guard for auth endpoints it does not mock instead of calling `route.continue()`, which let them through to the network.

**What a missing mock looks like.** The test fails at the end with `backend requests without an E2E mock` and entries like `POST /rest/v1/rpc/increment_household_mission`. Add the mock to `e2e/fixtures/api-mocks.fixture.ts`; do not loosen the guard.

**The storage key follows the host.** supabase-js names its localStorage entry `sb-<first label of the host>-auth-token`, so with the fake host it is `sb-e2e-auth-token`. `getSupabaseStorageKey()` derives it from the same constant the dev server gets; changing one without the other signs every test out.

**Stale assertions fixed on the way** (they had been failing unseen): the version reads `v1.2`, not `v0.0.x`; the delete-account dialog starts "This is permanent"; the members list shows names and the Owner badge, no email addresses; leaving as the last member says so; and on a recipe page the title exists twice until the stylesheet hides the print view, so those checks use `.first()`.

**Verified** 2026-10-05: 65 of 65 pass (three runs in CI mode, 1.3 minutes each, no flaky test), lint, unit tests and build pass, and the Supabase edge logs show no request with a `localhost` referer during those runs.

Source: Supabase edge logs and `gh run list` for this repo, 2026-10-05; the fix was developed against local runs of the suite.
