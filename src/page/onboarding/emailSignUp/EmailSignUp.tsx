import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSupabase } from "@/utils/supabase";
import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmailSignUp() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = () => {
    return email.trim() !== "" && email.includes("@");
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

      // Store email for verification page
      sessionStorage.setItem("signupEmail", email);

      // Navigate to verification page
      navigate("/signup/verify");
    } catch (err) {
      console.error("Sign up error:", err);
      setError(t("emailSignup.errors.signupFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen px-4" style={{ paddingTop: "calc(2.5rem + var(--safe-area-top, 0px))", paddingBottom: "calc(2.5rem + var(--safe-area-bottom, 0px))" }}>
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <h1 className="font-bold text-4xl first-font">{t("emailSignup.title")}</h1>

        <p className="text-sm text-muted-foreground second-font">{t("emailSignup.subtitle")}</p>
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

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex flex-col w-full max-w-sm gap-3">
          <OnboardingButton
            label={loading ? t("emailSignup.loading") : t("emailSignup.signupButton")}
            onClick={() => navigate("/signup/email")}
          />
        </div>
      </form>
    </div>
  );
}
