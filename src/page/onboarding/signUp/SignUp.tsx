import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import CircleTransition from "@/components/general/CircleTransition";
import MascotBowl from "@/components/general/MascotBowl";
import mascotSalad from "@/assets/mascot-filled-salad.webp";
import { useNavigate, Link } from "react-router";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { toast } from "sonner";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";
import { clearPendingSignIn, markPendingSignIn } from "@/lib/pendingSignIn";
import { SocialLogin, type AppleProviderResponse } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { reportError } from "@/utils/reportError";

function getUrlSafeNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The two providers this screen exchanges an ID token with Supabase for. */
type SocialProvider = "google" | "apple";

/**
 * Apple's JS SDK rejects with `{ error }` when the person closes the popup or
 * cancels inside it. Neither is a failure worth a toast or a PostHog error —
 * the same silence as `.canceled` on iOS.
 */
const APPLE_CANCELLATIONS = new Set(["popup_closed_by_user", "user_cancelled_authorize"]);

function isAppleCancellation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    APPLE_CANCELLATIONS.has(String((error as { error: unknown }).error))
  );
}

/**
 * `connect` is this screen serving an OAuth request (`/oauth/consent` renders it
 * in place when the user is signed out). It swaps the marketing headline for
 * something that explains why they're being asked to sign in — landing on
 * "Never stare blankly at your fridge again!" after clicking Connect in another
 * app reads as a signup wall, and existing users are the ones connecting.
 *
 * The requesting app cannot be named here: its name comes from
 * `getAuthorizationDetails`, which needs a session we don't have yet. The
 * consent screen immediately after does name it.
 */
type Props = { variant?: "onboarding" | "connect" };

export default function SignUp({ variant = "onboarding" }: Readonly<Props>) {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showTransition, setShowTransition] = useState(true);
  const { trackScreenViewed } = useOnboardingTracking();
  const reduceMotion = useReducedMotion();

  // Sign in with Apple is web-only here. Android would need the plugin's
  // Broadcast Channel flow (and Google Play does not require Apple sign-in),
  // and the native iOS app has its own. The web needs it because the MCP
  // consent screen runs here, and people who created their account on iPhone
  // with their Apple ID have no other way in: docs/knowledge/apple-sign-in-web.md.
  const appleServicesId: string | undefined = import.meta.env.VITE_APPLE_SERVICES_ID;
  const appleAvailable = !Capacitor.isNativePlatform() && Boolean(appleServicesId);

  // Safari blocks the window.open inside SocialLogin.login once the click
  // handler has awaited real async work (crypto.subtle.digest), so the nonce
  // digest must already be computed when the user clicks.
  const nonceRef = useRef<{ raw: string; digest: string } | null>(null);

  const generateNonce = useCallback(() => {
    nonceRef.current = null;
    const raw = getUrlSafeNonce();
    sha256(raw).then((digest) => {
      nonceRef.current = { raw, digest };
    });
  }, []);

  useEffect(() => {
    // Only the onboarding funnel. Someone connecting an AI assistant is an
    // existing user, and counting them as a signup would distort it.
    if (variant === "onboarding") trackScreenViewed("signup");
  }, [variant]);

  useEffect(() => {
    generateNonce();
  }, [generateNonce]);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    SocialLogin.initialize({
      google: {
        webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
        iOSClientId: native ? import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID : undefined,
        redirectUrl: native ? undefined : `${globalThis.location?.origin}/signup`,
      },
      // Apple validates `redirectUrl` against the Services ID's registered
      // Return URLs even in popup mode. Left unset, the plugin sends the
      // current page URL, and `/oauth/consent?authorization_id=…` can never
      // be registered — so it is always `/signup`, like Google's.
      ...(appleAvailable && {
        apple: {
          clientId: appleServicesId,
          redirectUrl: `${globalThis.location?.origin}/signup`,
        },
      }),
    }).catch((error) => {
      // Loading Apple's script can fail (blocked CDN); the buttons then fail
      // on click with the toast below, but the screen itself must render.
      reportError("Social login initialization failed", error);
    });
  }, [appleAvailable, appleServicesId]);

  const handleTransitionComplete = () => {
    setShowTransition(false);
  };

  /**
   * Apple sends the user's name only on the *first* authorization; persist it
   * to user metadata or it is lost for good. Best-effort, like
   * `AuthStore.storeFullName` on iOS: the session is already established, so a
   * failure here only costs the display name.
   */
  const storeAppleName = async (profile: {
    givenName: string | null;
    familyName: string | null;
  }) => {
    const name = [profile.givenName, profile.familyName].filter(Boolean).join(" ");
    if (!name) return;
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    if (error) reportError("Failed to store the name from Sign in with Apple", error);
  };

  /**
   * One flow for both providers: the provider receives the SHA-256 of the
   * nonce and Supabase the raw value (GoTrue accepts either the raw nonce or
   * its hash in the token), then the ID token becomes a Supabase session.
   */
  const signInWith = async (provider: SocialProvider) => {
    try {
      let nonce = nonceRef.current;
      if (!nonce) {
        // Fallback if the precomputed nonce isn't ready yet; the await here
        // can trip Safari's popup blocker, but this path is practically
        // unreachable since the digest finishes during the intro transition.
        const raw = getUrlSafeNonce();
        nonce = { raw, digest: await sha256(raw) };
      }

      const result = await SocialLogin.login(
        provider === "google"
          ? { provider: "google", options: { nonce: nonce.digest } }
          : { provider: "apple", options: { nonce: nonce.digest, scopes: ["name", "email"] } },
      );

      const idToken = "idToken" in result.result ? result.result.idToken : null;
      if (!idToken) throw new Error(`No idToken returned from ${provider} sign-in`);

      // Marked before the request: the `signed_in` event is captured after
      // `posthog.identify()` in the auth bootstrap (`pendingSignIn.ts`), and
      // the auth event can get there before this call returns.
      markPendingSignIn(provider);
      const { error } = await supabase.auth.signInWithIdToken({
        provider,
        token: idToken,
        nonce: nonce.raw,
      });

      if (error) throw error;

      // `login` is typed by the union of providers passed in, so `result.result`
      // is not discriminated by `provider`; the check above makes the cast safe.
      if (result.provider === "apple") {
        await storeAppleName((result.result as AppleProviderResponse).profile);
      }
    } catch (error) {
      clearPendingSignIn();
      if (provider === "apple" && isAppleCancellation(error)) return;
      reportError("Unexpected error during sign up", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      generateNonce();
    }
  };

  return (
    <>
      <CircleTransition
        isVisible={showTransition}
        onComplete={handleTransitionComplete}
        duration={1.2}
      />

      <div className="flex flex-col items-center h-screen px-4 py-10">
        <div className="flex flex-col w-full mb-8 text-center">
          {variant === "connect" ? (
            <>
              <h1 className="font-bold text-5xl first-font">{t("oauthConsent.signInTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("oauthConsent.signInSubtitle")}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-bold text-7xl first-font">{t("signup.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("signup.subtitle")}</p>
            </>
          )}
        </div>

        <motion.div
          className="flex min-h-0 flex-1 w-full items-end justify-center pb-5"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
        >
          <MascotBowl src={mascotSalad} grounded className="w-[min(228px,58vw)] max-h-full" />
        </motion.div>

        <div className="flex flex-col w-full max-w-sm gap-2">
          <div className="text-balance text-center text-xs text-muted-foreground">
            {t("login.termsPrefix")}{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              {t("login.termsOfService")}
            </Link>{" "}
            {t("login.termsAnd")}{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              {t("login.privacyPolicy")}
            </Link>
            {t("login.termsSuffix")}
          </div>

          <OnboardingButton
            label={t("signup.continueWithGoogle")}
            onClick={() => signInWith("google")}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
            }
          />

          {appleAvailable && (
            <OnboardingButton
              label={t("signup.continueWithApple")}
              onClick={() => signInWith("apple")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
              }
            />
          )}

          <OnboardingButton
            label={t("signup.continueWithEMail")}
            variant="secondary"
            onClick={() => navigate("/signup/email")}
            icon={<EmailOutlinedIcon />}
          />
        </div>
      </div>
    </>
  );
}
