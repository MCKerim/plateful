import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSupabase } from "@/utils/supabase";
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportError } from "@/utils/reportError";
import { isReviewEmail } from "@/lib/reviewSignIn";
import { clearPendingSignIn, markPendingSignIn } from "@/lib/pendingSignIn";
import { devAccount } from "@/lib/devSignIn";

export default function EmailSignUp() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The store-review account signs in with a password instead of a magic link;
  // see src/lib/reviewSignIn.ts. This is the screen a reviewer reaches from
  // "Continue with email".
  const isReviewAccount = isReviewEmail(email);

  // Off the dev server with `.env.local` credentials: one tap into the test household.
  const handleDevLogin = async () => {
    if (!devAccount) return;
    setError(null);
    setLoading(true);
    markPendingSignIn("password");
    const { error: devError } = await supabase.auth.signInWithPassword(devAccount);
    if (devError) {
      clearPendingSignIn();
      setError(devError.message);
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (email.trim() === "" || !email.includes("@")) return false;
    return !isReviewAccount || password !== "";
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid()) {
      if (email.includes("@")) {
        // Email is valid, so check other conditions
        setError(t("emailSignup.errors.fillAllFields"));
      } else {
        setError(t("emailSignup.errors.invalidEmail"));
      }
      return;
    }

    setLoading(true);

    if (isReviewAccount) {
      // Marked before the request, like every other sign-in call site: the
      // auth event can reach the bootstrap before this returns.
      markPendingSignIn("password");

      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (passwordError) {
        clearPendingSignIn();
        setError(t("reviewSignIn.errors.passwordFailed"));
        setLoading(false);
      }
      // On success the session lands and the route guard sends them to /home.
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${globalThis.location.origin}/`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      posthog?.capture(AnalyticsEvent.magicLinkRequested);

      // Store email for verification page
      sessionStorage.setItem("signupEmail", email);

      // Navigate to verification page
      navigate("/signup/verify");
    } catch (err) {
      reportError("Sign up error", err);
      setError(t("emailSignup.errors.signupFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-dvh px-4 py-10">
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <h1 className="font-bold text-4xl first-font">{t("emailSignup.title")}</h1>

        <p className="text-sm text-muted-foreground">
          {isReviewAccount ? t("reviewSignIn.hint") : t("emailSignup.subtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSignUp}
        className="flex flex-col w-full max-w-sm gap-3 h-full justify-center"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("emailSignup.emailLabel")}</Label>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailSignup.emailPlaceholder")}
            disabled={loading}
            required
          />
        </div>

        {isReviewAccount && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("reviewSignIn.passwordLabel")}</Label>

            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("reviewSignIn.passwordPlaceholder")}
              disabled={loading}
              required
            />
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex flex-col w-full max-w-sm gap-3">
          <OnboardingButton
            label={(() => {
              if (isReviewAccount) {
                return loading ? t("reviewSignIn.loading") : t("reviewSignIn.signInButton");
              }
              return loading ? t("emailSignup.loading") : t("emailSignup.signupButton");
            })()}
            onClick={() => navigate("/signup/email")}
          />
        </div>
      </form>

      {devAccount && (
        <button
          type="button"
          onClick={handleDevLogin}
          disabled={loading}
          className="mt-4 text-xs text-muted-foreground underline underline-offset-4 disabled:opacity-50"
        >
          Dev-Login ({devAccount.email})
        </button>
      )}
    </div>
  );
}
