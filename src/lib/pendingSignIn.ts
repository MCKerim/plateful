/**
 * The sign-in method whose `signed_in` event is still owed.
 *
 * The event is captured *after* `posthog.identify()`, never at the sign-in
 * call site — why: docs/knowledge/signed-in-after-identify.md. Call sites mark
 * the method before their request; `useUserData.fetchUserData` spends it right
 * after identify. Same design as `AuthStore.pendingSignInMethod` on iOS.
 *
 * Magic links have no call site:
 * - In the browser the user lands on the app with the session in the URL
 *   fragment and the Supabase client consumes it on its own. The fragment's
 *   access token is remembered at module load (before the client exists) and
 *   the mark is set only once the auth client reports a session carrying that
 *   token (`markIfMagicLinkSession`), so a stale or failed link never turns an
 *   ordinary session restore into a sign-in.
 * - On Android the link arrives as an App Link and `AppUrlListener` completes
 *   the sign-in itself, so it marks explicitly.
 * Supabase's `SIGNED_IN` auth event alone is not usable: it also fires when a
 * stored session is recovered on load and on every tab-focus refresh.
 *
 * In-memory only, like iOS: a page reload between the sign-in request and the
 * identify (say, after a failed profile load) loses the mark and that sign-in
 * goes uncounted.
 */
export type SignInMethod = "google" | "apple" | "password" | "magic_link";

let pending: SignInMethod | null = null;

/** Call right before the sign-in request, not after — the auth event can
 * reach the bootstrap before the request returns. */
export function markPendingSignIn(method: SignInMethod): void {
  pending = method;
}

/** The sign-in did not happen (error, cancel, sign-out): nothing to report. */
export function clearPendingSignIn(): void {
  pending = null;
}

/** Hands over the owed method once; `null` when nothing is pending — an
 * ordinary reload identifies without anyone having signed in. */
export function spendPendingSignIn(): SignInMethod | null {
  const method = pending;
  pending = null;
  return method;
}

/**
 * The access token in `url` when it is where a Supabase email link lands: the
 * implicit-flow fragment with the session and its `type`. `magiclink` is the
 * sign-in link; `signup` is what a brand-new address gets from the same
 * `signInWithOtp`. `recovery` / `email_change` / `invite` are not sign-ins.
 */
export function magicLinkAccessToken(url: string): string | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const token = params.get("access_token");
  const type = params.get("type");
  if (!token || (type !== "magiclink" && type !== "signup")) return null;
  return token;
}

export function isMagicLinkLanding(url: string): boolean {
  return magicLinkAccessToken(url) !== null;
}

let landingToken: string | null = null;

/** Remembers the email-link landing in `url`, if it is one. Called once at
 * module load with the page URL; exported for tests. */
export function rememberMagicLinkLanding(url: string): void {
  landingToken = magicLinkAccessToken(url);
}

/**
 * Marks `magic_link` when `session` is the one the remembered landing
 * established — its access token is the fragment's. Call from the auth-state
 * listener with every session it reports; a no-op without a landing, and
 * spent after the first match.
 */
export function markIfMagicLinkSession(session: { access_token: string } | null | undefined): void {
  if (!landingToken || !session || session.access_token !== landingToken) return;
  landingToken = null;
  pending = "magic_link";
}

if (typeof globalThis.location !== "undefined") {
  rememberMagicLinkLanding(globalThis.location.href);
}
