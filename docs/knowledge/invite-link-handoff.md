# Invite links hand off to the app, and email sign-in returns to them

Since `cbdf004` (2026-10-22). Cause: the 2026-10-18 invitee opened the link without the app, got the generic sign-in, finished onboarding on the web, then installed the app and did it again ([onboarding-progress-is-one-flag.md](onboarding-progress-is-one-flag.md)).

**Who sees what on `/invite/:token`** (`src/components/general/InviteRoute.tsx`):

- Signed in: `InvitePage` (household name, Join).
- Signed out in a phone browser: "Du wurdest eingeladen" with "Weiter in der App" and "Weiter im Browser". The second shows `SignUp variant="invite"` ("Anmelden zum Beitreten") in place.
- Signed out on a desktop or inside the Android app (`Capacitor.isNativePlatform()`): `SignUp variant="invite"` directly.

**The app button** (`openInAppLink("invite", token)` in `src/lib/appStores.ts`, shared with the share page). Android gets an `intent://app.plateful.cloud/invite/<token>` URL that opens the app at the invite or falls back to Google Play by itself. iPhone links to `https://plateful.cloud/invite/<token>`, because a link to the page's own domain never opens the app. Since 2026-10-22 the website lists `/invite/*` in its AASA and redirects it to the App Store (`plateful-website` `4f87e1b`), and the iOS app's `HouseholdInvite.token(from:)` accepts the `plateful.cloud` host (iOS `invite-plateful-cloud` branch). iOS builds from before that change open the app on this link but drop the invite, as the App Store's "Open" would. After a store install, the invitee has to open the link again, which the page says. There is no deferred deep link.

**Email sign-in keeps the invite** (`src/lib/pendingInvite.ts`). Once the signed-out route shows sign-in, it stores the token in `localStorage` for one hour, like `pendingOAuthConsent`. While only the handoff screen is shown it stores nothing, so someone who joins in the app is not sent back to the invite by a later web sign-in. The magic link and the review password login both land on `/`, where `PostSignInLanding` redirects to the invite. A pending OAuth consent goes first. The signed-in invite route clears the entry, so Join (which navigates to `/`) does not loop back.

**Not covered:** the Safari Smart App Banner (it would need a server-rendered meta tag like `api/share.ts`), the household name while signed out (`preview_household_invite` needs auth), and the invite token in web PostHog URLs.

**Verification (2026-10-22):** `InviteRoute.test.tsx` (10 tests) and the variant tests in `SignUp.test.tsx`. In the browser at 375×812 and 360×640 (no scrolling), on a desktop, and end to end with the dev login from `/signup/email`, which landed back on the invite and, after "Nicht beitreten", on `/home`.
