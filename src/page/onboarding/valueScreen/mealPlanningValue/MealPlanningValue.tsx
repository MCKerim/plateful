import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

export default function MealPlanningValue() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/beta")}>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.mealPlanning.title")}</h1>

        <motion.h2
          className="text-2xl italic font-semibold second-font"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {t("valueScreens.mealPlanning.subtitle")}
        </motion.h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      >
        <PhoneMockup mediaUrl="/meal-planner-screenshot.jpg" />
      </motion.div>

      <motion.p
        className="max-w-sm mt-2 text-center text-gray-600"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        {t("valueScreens.mealPlanning.description")}
      </motion.p>
    </OnboardingLayout>
  );
}
