import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useOnboardingTracking } from "@/hooks/analytics/useOnboardingTracking";

export default function ChatbotValue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackScreenViewed } = useOnboardingTracking();

  useEffect(() => {
    trackScreenViewed("value_chatbot");
  }, []);

  return (
    <OnboardingLayout onNext={() => navigate("/survey/8")}>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.chatbot.title")}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      >
        <PhoneMockup mediaUrl="/chatbot-screen-recording.mp4" />
      </motion.div>

      <motion.p
        className="max-w-sm mt-2 text-center text-gray-600"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        {t("valueScreens.chatbot.description")}
      </motion.p>
    </OnboardingLayout>
  );
}
