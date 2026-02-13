import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function ChatbotValue() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/values/3")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.chatbot.title")}</h1>
      </div>

      <PhoneMockup mediaUrl="/chatbot-screen-recording.mp4" />

      <p className="max-w-sm mt-2 text-center text-gray-600">
        {t("valueScreens.chatbot.description")}
      </p>
    </OnboardingLayout>
  );
}
