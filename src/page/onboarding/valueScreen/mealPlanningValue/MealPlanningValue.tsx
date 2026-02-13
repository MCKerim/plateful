import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export default function MealPlanningValue() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/beta")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.mealPlanning.title")}</h1>

        <h2 className="text-2xl italic font-semibold second-font">
          {t("valueScreens.mealPlanning.subtitle")}
        </h2>
      </div>

      <PhoneMockup mediaUrl="/meal-planner-screenshot.jpg" />

      <p className="max-w-sm mt-2 text-center text-gray-600">
        {t("valueScreens.mealPlanning.description")}
      </p>
    </OnboardingLayout>
  );
}
