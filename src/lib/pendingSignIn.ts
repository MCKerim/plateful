/**
 * The sign-in method whose `signed_in` event is still owed.
 *
 * `signed_in` has to be captured *after* `posthog.identify()`. This PostHog
 * project stamps person properties onto an event at ingestion and never
 * rewrites them, so an event captured while the browser is still anonymous
 * keeps `email = null` for good, drops out of every person-property filter
 * (the internal-user filter included) and renders as an anonymous person.
 * The identify happens in `useUserData.fetchUserData`, well after the sign-in
 * call site, so the call site only *marks* the method here and the identify
 * *spends* it. Same design as `AuthStore.pendingSignInMethod` on iOS.
 *
 * A magic link has no call site at all: the user lands on the app with the
 * session in the URL fragment and the Supabase client picks it up on its own.
 * That arrival is detected once, at module load — before the client has had a
 * chance to consume the fragment — and marked as `magic_link`. Supabase's
 * `SIGNED_IN` auth event is not usable for this: it also fires when a stored
 * session is recovered on load and on every tab-focus refresh.
 */
export type SignInMethod = "google" | "apple" | "password" | "magic_link";

let pending: SignInMethod | null = null;

/** Call right before the sign-in request, not after — the auth event can
 * reach the bootstrap before the request returns. */
export function markPendingSignIn(method: SignInMethod): void {
  pending = method;
}

/** The sign-in did not happen (error, cancel): nothing to report later. */
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
 * Whether `url` is where a Supabase email link lands: the implicit-flow
 * fragment with the session and its `type`. `magiclink` is the sign-in link;
 * `signup` is what a brand-new address gets from the same `signInWithOtp`.
 * `recovery` / `email_change` / `invite` are not sign-ins.
 */
export function isMagicLinkLanding(url: string): boolean {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return false;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  if (!params.has("access_token")) return false;
  const type = params.get("type");
  return type === "magiclink" || type === "signup";
}

if (typeof globalThis.location !== "undefined" && isMagicLinkLanding(globalThis.location.href)) {
  pending = "magic_link";
}
