/**
 * The review accounts, which sign in with a password instead of a magic link.
 *
 * Production auth here is passwordless (magic link) or Google Sign-In, and a
 * reviewer can use neither: the magic link needs the account's mailbox,
 * and Google Sign-In needs the Google account added to the review device,
 * which Google's own new-device challenges routinely block. Google Play
 * rejected the app twice for "content restricted by a paywall" — the
 * reviewer never got past sign-in (Supabase's audit log shows magic links
 * requested for this address and never redeemed).
 *
 * So typing exactly one of these addresses in the email screens reveals a
 * password field and a "Sign in" button, the same hidden mode the native iOS
 * app has for App Review (`AuthStore.reviewEmail`, `docs/app-review-account.md`
 * there). No secret ships in the client: the app only compares the address,
 * the password is checked server-side by Supabase. `.test` is a reserved TLD,
 * so the addresses are undeliverable and nobody can magic-link into one. Each
 * account holds a seeded, never-expiring entitlement (`user_subscriptions`,
 * `environment = 'MANUAL'`), so the reviewer lands on Home with the app fully
 * unlocked.
 *
 * One account per reviewing party, because reviewers test Delete Account and a
 * deletion in one review must not lock another one out mid-review:
 *
 * - `androidreview@` — Play Console.
 * - `chatgptreview@` — OpenAI's reviewers for the ChatGPT plugin directory.
 *   They never open this app on purpose: they connect the MCP server, and the
 *   OAuth consent page (`/oauth/consent`) drops them here to sign in first.
 *   Same dead end as a store reviewer, so the same hidden password field.
 * - `claudereview@` — Anthropic's reviewers for the Claude Connectors
 *   Directory, who arrive the same way. Its own account because both reviews
 *   can run at once and each is invited to write and delete freely.
 *
 * The App Store's `iosreview@plateful.test` is not listed here — App Review
 * uses the native app, which carries its own copy of this mechanism.
 *
 * Details and the Play Console text: docs/knowledge/review-accounts.md.
 * Seeding (all accounts): `scripts/seed-review-account.mjs` in the iOS repo.
 */
export const REVIEW_EMAILS = [
  "androidreview@plateful.test",
  "chatgptreview@plateful.test",
  "claudereview@plateful.test",
] as const;

/** `true` when `email` is one of the review accounts — case- and
 * whitespace-insensitive, because reviewers paste the address in from a
 * console or a submission form. */
export function isReviewEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return REVIEW_EMAILS.some((address) => address === normalized);
}
