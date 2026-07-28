/**
 * Remembers an OAuth consent request across sign-in.
 *
 * Connecting an AI assistant sends the user to `/oauth/consent?authorization_id=…`.
 * If they aren't signed in, the app shows the sign-in screen — and the pending
 * request has to survive whatever they do next. Email sign-in loses it twice
 * over: choosing "continue with email" navigates away from the consent URL, and
 * the magic link then lands on the home page. Either alone strands the request,
 * which expires after ten minutes and leaves the connector reporting a failure
 * the user can do nothing about.
 *
 * Since most Plateful accounts have no password, magic link is the common path,
 * and mobile-only users signing in on the web for the first time hit it every
 * time. Apple and Google sign-in resolve in place and never leave the page, so
 * they were always fine.
 *
 * `localStorage`, not `sessionStorage`: a magic link commonly opens in a new tab,
 * and session storage is per-tab.
 */

const KEY = "plateful.pendingOAuthConsent";

/**
 * Slightly longer than the ten minutes Supabase gives an authorization request,
 * so an expired one still returns to the consent page and gets a real
 * explanation there rather than silently going to the home screen.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

type Stored = { search: string; at: number };

/** Called when the consent route renders for a signed-out user. */
export function rememberPendingConsent(search: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ search, at: Date.now() } satisfies Stored));
  } catch {
    // Storage disabled (private mode, blocked cookies) — the user can still
    // sign in and reconnect from the assistant. Never break sign-in over this.
  }
}

/** The consent path to return to, or null. Does not clear — see `clearPendingConsent`. */
export function peekPendingConsent(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { search, at } = JSON.parse(raw) as Stored;
    if (typeof search !== "string" || typeof at !== "number") return null;
    if (Date.now() - at > MAX_AGE_MS) return null;
    return `/oauth/consent${search}`;
  } catch {
    return null;
  }
}

export function clearPendingConsent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
