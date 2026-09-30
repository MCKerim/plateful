# OAuth consent after email sign-in

**Failure (2026-09-30):** Starting the OpenAI plugin connection while signed out reached `/oauth/consent?authorization_id=…`. Choosing email sign-in navigated to `/signup/email`; after the review account's password login, the route guard sent the user directly to `/home`, leaving the OAuth request unanswered. A second connection attempt worked because the Plateful session was then active.

**Mechanism:** `OAuthConsentRoute` stores the pending authorization URL in `pendingOAuthConsent`. `PostSignInLanding` at `/` consumes it and routes back to consent. Signed-in guards for `/signup`, `/signup/email`, `/signup/verify`, and `/login` must therefore redirect to `/`, not directly to `/home`. When there is no pending request, `/` still goes to `/home`. Keep the pending URL's `authorization_id` intact and clear it only after the landing redirect; never put OAuth codes or credentials in the stored value.

**Verification:** `npm run build` and the `OAuthConsentRoute` / `pendingOAuthConsent` tests passed after the guard change. The initial failure and the successful second OAuth attempt were observed in the OpenAI Platform plugin dashboard.
