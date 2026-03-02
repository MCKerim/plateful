import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSupabase } from "@/utils/supabase";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = () => {
    return email.trim() !== "" && email.includes("@");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid()) {
      setError(t("login.errors.invalidEmail"));
      return;
    }

    setLoading(true);

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

      // Store email for verification page
      sessionStorage.setItem("signupEmail", email);

      // Navigate to verification page
      navigate("/signup/verify");
    } catch (err) {
      console.error("Login error:", err);
      setError(t("login.errors.loginFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen px-4" style={{ paddingTop: "calc(2.5rem + var(--safe-area-top, 0px))", paddingBottom: "calc(2.5rem + var(--safe-area-bottom, 0px))" }}>
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <h1 className="font-bold text-6xl first-font">{t("login.title")}</h1>
        <p className="text-sm text-muted-foreground second-font mt-2">{t("login.subtitle")}</p>
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

        {error && <p className="text-destructive text-sm">{error}</p>}

        <OnboardingButton
          label={loading ? t("login.loading") : t("login.loginButton")}
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

      <div className="mt-auto mb-8 text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        {t("signup.termsAndConditions")}
      </div>
    </div>
  );
}
