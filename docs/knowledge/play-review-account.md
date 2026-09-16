# Play review account: hidden password sign-in

_`androidreview@plateful.test` typed into either email screen reveals a password field → `signInWithPassword`; own account, own household, never-expiring MANUAL entitlement; seeded from the iOS repo's script_

**Why.** Google Play rejected 1.1 twice under "Play Console requirements → app content restricted by a paywall". The entitlement was never the (whole) problem: the reviewer could not **sign in**. Production auth here is magic link or Google Sign-In, and a reviewer has neither the demo account's mailbox nor the ability to add its Google account to a review device (Google's own new-device challenges block that). Supabase's audit log is the proof: every magic link requested for the old demo address `platefuldemo@gmail.com` — including one on 2026-09-15 18:02 UTC, the day before the rejection — went unredeemed, and the only logins that address ever had are `provider: google` from Kerim's own device.

**Mechanism** (shipped 2026-09-16, mirrors the native iOS app's `AuthStore.reviewEmail` / `docs/app-review-account.md` there): `src/lib/reviewSignIn.ts` holds `REVIEW_EMAIL` and `isReviewEmail()`. Both email screens — `/login` (`Login.tsx`) and `/signup/email` (`EmailSignUp.tsx`, where "Continue with E-Mail" lands) — watch the typed address; on an exact match (trimmed, lower-cased, because reviewers paste) the subtitle switches to "Enter the review account password", a password field appears and the button becomes "Sign in" → `supabase.auth.signInWithPassword`, marked `password` through `markPendingSignIn` so PostHog's `signed_in` distinguishes reviewer sessions. Every other address keeps the magic-link flow. **No secret ships in the client** — only the address is compared; the password is checked server-side. `.test` is a reserved TLD, so the address is undeliverable and nobody can magic-link into it. The mode exists on the web build too, which is fine: same bundle.

**The account.** `androidreview@plateful.test`, household "Plateful Android Review", 6 English recipes with generated covers, filed into the starter collections, two ratings. It is **separate from the App Store's** `iosreview@plateful.test` (builds up to iOS 1.1: `review@plateful.test`) on purpose: reviewers test Delete Account, and with one shared account a deletion in one store would lock the other store's reviewer out mid-review.

**Server side.** `user_subscriptions` for the reviewer is `is_active = true`, `expires_at = null`, `store`/`environment` both `'MANUAL'` — seeded, so the RevenueCat webhook never touches or expires it, and premium reaches the household through the `household_entitlements` view. The paywall gate is `useHouseholdSubscription().isActive` (App.tsx `isPro()`), **not** the RevenueCat SDK, so the seeded row alone unlocks the app on Android. `has_completed_survey` is pre-set, so sign-in lands straight on Home.

**Re-seeding** (also the fix when a reviewer deletes the account): the iOS repo's script takes the store as its first argument and is idempotent — existing pieces kept, missing ones created, password reset from `scripts/.ota-env` (`ANDROID_REVIEW_ACCOUNT_PASSWORD`, git-ignored) on every run:

```
cd ~/programming/ios-native/plateful
node scripts/seed-review-account.mjs android          # create/repair
node scripts/seed-review-account.mjs android --wipe   # regenerate the library
```

**Play Console.** App content → App access → "All or some functionality is restricted", with the address, its password and instructions. Google requires the credentials to be re-checked **on every submission**:

> Plateful's sign-in is passwordless for normal users (magic link or Google Sign-In). For review, use the demo account below — it takes a password.
>
> 1. Open the app and tap "Get Started!", then "Continue with E-Mail".
> 2. Type the email address above into the Email field. A password field appears under it.
> 3. Type the password above into it and tap "Sign in".
>
> The demo household already has an active subscription, so the whole app is unlocked — no purchase is needed. To see the paywall and purchase flow instead, start a fresh account from the welcome screen.

**Analytics.** All three review addresses (`review@`, `iosreview@`, `androidreview@plateful.test`) are in PostHog's project internal filter and the "Internal & review accounts" cohort (239767); a new review address must be added to both.

**Gotchas.** The mode only reveals itself for this exact address, so it has to reach the reviewer **with the build**: a Console-only credential change on an older build does nothing. `platefuldemo@gmail.com` (household "Müller") is the old demo account and still holds a MANUAL entitlement; it is no longer the reviewer path — keep it out of the Console entry so nobody is sent down the magic-link dead end again.
