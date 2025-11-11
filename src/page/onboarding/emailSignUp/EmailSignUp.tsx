import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSupabase } from "@/utils/supabase";
import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmailSignUp() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = () => {
    return email.trim() !== "" && password.trim() !== "" && email.includes("@");
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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${globalThis.location.origin}/`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Show transition and navigate
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("Sign up error:", err);
      setError(t("emailSignup.errors.signupFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10">
      <form
        onSubmit={handleSignUp}
        className="flex flex-col w-full max-w-sm gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            {t("emailSignup.emailLabel")}
          </Label>

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">
            {t("emailSignup.passwordLabel")}
          </Label>

          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("emailSignup.passwordPlaceholder")}
            disabled={loading}
            required
          />
        </div>

        {error && (
          <p className="text-destructive text-sm">
            {error}
          </p>
        )}

        <OnboardingButton
          label={
            loading ? t("emailSignup.loading") : t("emailSignup.signupButton")
          }
          onClick={() => navigate("/signup/email")}
        />
      </form>
    </div>
  );
}
