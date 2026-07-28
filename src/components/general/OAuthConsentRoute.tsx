import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router";
import SignUp from "@/page/onboarding/signUp/SignUp";
import OAuthConsent from "@/page/OAuthConsent";
import {
  clearPendingConsent,
  peekPendingConsent,
  rememberPendingConsent,
} from "@/lib/pendingOAuthConsent";

/**
 * The `/oauth/consent` route.
 *
 * Signed in, it is just the consent screen. Signed out, it shows sign-in *in
 * place* — the URL never changes, so Apple and Google sign-in return straight to
 * consent — and stashes the request so the email path can find its way back
 * after the magic link drops the user on the home page.
 */
export default function OAuthConsentRoute({ isLoggedIn }: Readonly<{ isLoggedIn: boolean }>) {
  const { search } = useLocation();

  useEffect(() => {
    if (!isLoggedIn) rememberPendingConsent(search);
  }, [isLoggedIn, search]);

  return isLoggedIn ? <OAuthConsent /> : <SignUp variant="connect" />;
}

/**
 * Where a signed-in user lands on `/`.
 *
 * Normally the home screen, but a magic link sent from a consent request returns
 * here — so a pending request takes precedence and the user is handed back to
 * the screen they were trying to reach.
 */
export function PostSignInLanding() {
  // Read once per mount so a re-render can't lose it, and clear only after the
  // redirect is committed (StrictMode mounts effects twice in development).
  const pending = useMemo(() => peekPendingConsent(), []);

  useEffect(() => {
    if (pending) clearPendingConsent();
  }, [pending]);

  return <Navigate to={pending ?? "/home"} replace />;
}
