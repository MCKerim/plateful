import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import { useSupabase } from "@/utils/supabase";

export default function EmailVerification() {
  const { t } = useTranslation();
  const { supabase } = useSupabase();

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Get email from URL or session storage
    const urlParams = new URLSearchParams(globalThis.location.search);
    const emailParam = urlParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
      sessionStorage.setItem("signupEmail", emailParam);
    } else {
      const storedEmail = sessionStorage.getItem("signupEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      alert(t("Error: No email found to resend verification."));
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
        alert("Error resending verification email: " + signUpError.message);
        return;
      }

      alert(t("emailVerification.resendSent"));
    } catch (err) {
      console.error("Sign up error:", err);
      alert(t("emailSignup.errors.signupFailed"));
    }
  };

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10">
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <h1 className="font-bold text-4xl first-font">
          {t("emailVerification.title")}
        </h1>

        <p className="text-sm text-muted-foreground second-font">
          {t("emailVerification.subtitle", { email: email })}
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-3">
        <OnboardingButton
          label={t("emailVerification.resendButton")}
          onClick={handleResendEmail}
        />
      </div>
    </div>
  );
}
