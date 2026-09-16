import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import { useSupabase } from "@/utils/supabase";
import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";
import { reportError } from "@/utils/reportError";
import { isReviewEmail } from "@/lib/reviewSignIn";
import { clearPendingSignIn, markPendingSignIn } from "@/lib/pendingSignIn";

export default function Login() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackScreenViewed } = useOnboardingTracking();

  useEffect(() => {
    trackScreenViewed("login");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The store-review account signs in with a password instead of a magic link;
  // see src/lib/reviewSignIn.ts.
  const isReviewAccount = isReviewEmail(email);

  const isFormValid = () => {
    if (email.trim() === "" || !email.includes("@")) return false;
    return !isReviewAccount || password !== "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid()) {
      setError(t("login.errors.invalidEmail"));
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
      // On success the session lands, the route guard sends them to /home, and
      // the button stays disabled until it does.
      return;
    }

    try {
      const { error: loginError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${globalThis.location.origin}/`,
        },
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      posthog?.capture(AnalyticsEvent.magicLinkRequested);

      // Store email for verification page
      sessionStorage.setItem("signupEmail", email);

      // Navigate to verification page
      navigate("/signup/verify");
    } catch (err) {
      reportError("Login error", err);
      setError(t("login.errors.loginFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10">
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <h1 className="font-bold text-6xl first-font">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {isReviewAccount ? t("reviewSignIn.hint") : t("login.subtitle")}
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col w-full max-w-sm gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("login.emailLabel")}</Label>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder")}
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

        <OnboardingButton
          label={(() => {
            if (isReviewAccount) {
              return loading ? t("reviewSignIn.loading") : t("reviewSignIn.signInButton");
            }
            return loading ? t("login.loading") : t("login.loginButton");
          })()}
          onClick={() => {
            const form = document.querySelector("form");
            if (form) {
              const event = new Event("submit", { bubbles: true, cancelable: true });
              form.dispatchEvent(event);
            }
          }}
        />
      </form>

      <div className="flex flex-col w-full max-w-sm gap-3 mt-6">
        <button
          onClick={() => navigate("/signup")}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 disabled:opacity-50 transition-colors"
        >
          {t("login.dontHaveAccount")}
        </button>
      </div>

      <div className="mt-auto mb-8 text-center text-xs text-muted-foreground">
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
    </div>
  );
}
