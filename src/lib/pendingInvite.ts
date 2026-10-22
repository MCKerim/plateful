/**
 * Remembers a household invite across email sign-in.
 *
 * Signed out, `/invite/:token` shows sign-in in place, so Apple and Google
 * sign-in (popups) come straight back to the invite. Email sign-in leaves for
 * `/signup/email`, and the magic link then lands on `/`, which dropped the
 * invite. `PostSignInLanding` reads this to send the user back. Same mechanism
 * and storage choice as `pendingOAuthConsent.ts`.
 */

const KEY = "plateful.pendingInvite";

/**
 * A magic link is used within minutes. An hour covers that without sending
 * someone who abandoned an invite back to it days later. The invite itself is
 * valid for 24 hours, and the invite page explains an expired one.
 */
const MAX_AGE_MS = 60 * 60 * 1000;

type Stored = { token: string; at: number };

/** Called when the invite route renders for a signed-out user. */
export function rememberPendingInvite(token: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() } satisfies Stored));
  } catch {
    // Storage disabled (private mode, blocked cookies). The user can still
    // sign in and open the invite link again. Never break sign-in over this.
  }
}

/** The invite path to return to, or null. Does not clear, see `clearPendingInvite`. */
export function peekPendingInvite(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { token, at } = JSON.parse(raw) as Stored;
    if (typeof token !== "string" || !token || typeof at !== "number") return null;
    if (Date.now() - at > MAX_AGE_MS) return null;
    return `/invite/${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
