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
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";

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
  const posthog = usePostHog();
  const reduceMotion = useReducedMotion();

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
    SocialLogin.initialize({
      google: {
        webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
        iOSClientId: Capacitor.isNativePlatform()
          ? import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID
          : undefined,
        redirectUrl: Capacitor.isNativePlatform()
          ? undefined
          : `${globalThis.location?.origin}/signup`,
      },
    });
  }, []);

  const handleTransitionComplete = () => {
    setShowTransition(false);
  };

  const signUp = async () => {
    try {
      let nonce = nonceRef.current;
      if (!nonce) {
        // Fallback if the precomputed nonce isn't ready yet; the await here
        // can trip Safari's popup blocker, but this path is practically
        // unreachable since the digest finishes during the intro transition.
        const raw = getUrlSafeNonce();
        nonce = { raw, digest: await sha256(raw) };
      }

      const result = await SocialLogin.login({
        provider: "google",
        options: { nonce: nonce.digest },
      });

      const idToken = "idToken" in result.result ? result.result.idToken : null;
      if (!idToken) throw new Error("No idToken returned from Google Sign-In");

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce: nonce.raw,
      });

      if (error) throw error;

      posthog?.capture(AnalyticsEvent.signedIn, { method: "google" });
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
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
              <p className="mt-2 text-sm text-muted-foreground second-font">
                {t("oauthConsent.signInSubtitle")}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-bold text-7xl first-font">{t("signup.title")}</h1>
              <p className="text-sm text-muted-foreground second-font">{t("signup.subtitle")}</p>
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
            onClick={signUp}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
            }
          />

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
