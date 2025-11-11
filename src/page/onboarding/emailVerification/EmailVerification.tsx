import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";

export default function EmailVerification() {
  const { t } = useTranslation();
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
        <h1 className="font-bold text-5xl first-font">
          {t("emailVerification.title")}
        </h1>

        <p className="text-md second-font mt-4 p-4">
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
