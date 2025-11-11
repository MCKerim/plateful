import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";

export default function EmailVerification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleResendEmail = () => {
    // This would trigger a resend email function
    // For now, we'll just show a message
    alert(t("emailVerification.resendSent"));
  };

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10">
      <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
        <div className="mb-6 text-6xl">✉️</div>
        <h1 className="font-bold text-5xl first-font">{t("emailVerification.title")}</h1>
        <p className="text-sm text-muted-foreground second-font mt-4">
          {t("emailVerification.subtitle")}
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm font-medium">{email}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("emailVerification.checkEmail")}
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t("emailVerification.description")}
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm gap-3">
        <OnboardingButton
          label={t("emailVerification.continueButton")}
          onClick={() => navigate("/")}
        />

        <button
          onClick={handleResendEmail}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t("emailVerification.resendButton")}
        </button>

        <button
          onClick={() => navigate("/signup/email")}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
        >
          {t("emailVerification.changeEmailButton")}
        </button>
      </div>
    </div>
  );
}
