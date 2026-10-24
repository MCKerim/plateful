# Android App Links keep their query

**Failure (2026-10-21):** Connecting the ChatGPT plugin on Android opened the app at `/oauth/consent` and showed "Dieser Verbindungslink ist unvollständig". Supabase sends the user to `https://app.plateful.cloud/oauth/consent?authorization_id=…`; the verified App Link opens the app, and `AppUrlListener` navigated to `url.pathname` only, so `OAuthConsent` saw no `authorization_id` (`missingRequest`). Web and the native iOS app were unaffected.

**Mechanism:** `AppUrlListener` now navigates to `url.pathname + url.search`. The hash is still left out on purpose: magic-link tokens arrive there and must not enter router history. Any App Link route that reads query parameters depends on this.

**Verification:** `src/components/AppUrlListener.test.tsx` fails without the fix and passes with it. Confirmed on a device 2026-10-23: Celine's build 46 reached `/auth/v1/oauth/authorizations/{id}` with the id (auth logs), where the next failure is the Origin check, see `oauth-consent-origin-allowlist.md`.
