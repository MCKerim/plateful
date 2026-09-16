/**
 * The store-review account, which signs in with a password instead of a magic
 * link.
 *
 * Production auth here is passwordless (magic link) or Google Sign-In, and a
 * store reviewer can use neither: the magic link needs the account's mailbox,
 * and Google Sign-In needs the Google account added to the review device,
 * which Google's own new-device challenges routinely block. Google Play
 * rejected the app twice for "content restricted by a paywall" — the
 * reviewer never got past sign-in (Supabase's audit log shows magic links
 * requested for this address and never redeemed).
 *
 * So typing exactly this address in the email screens reveals a password
 * field and a "Sign in" button, the same hidden mode the native iOS app has
 * for App Review (`AuthStore.reviewEmail`, `docs/app-review-account.md`
 * there). No secret ships in the client: the app only compares the address,
 * the password is checked server-side by Supabase. `.test` is a reserved TLD,
 * so the address is undeliverable and nobody can magic-link into it. The
 * account holds a seeded, never-expiring entitlement (`user_subscriptions`,
 * `environment = 'MANUAL'`), so the reviewer lands on Home with the app fully
 * unlocked. It is its own account, separate from the App Store's, so a
 * Delete Account test in one store cannot lock the other one out.
 *
 * Details and the Play Console text: docs/knowledge/play-review-account.md.
 */
export const REVIEW_EMAIL = "androidreview@plateful.test";

/** `true` when `email` is the review account — case- and whitespace-insensitive,
 * because reviewers paste the address in from the Play Console. */
export function isReviewEmail(email: string): boolean {
  return email.trim().toLowerCase() === REVIEW_EMAIL;
}
