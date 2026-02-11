import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectUser, setUser } from "@/redux/slices/userSlice";
import { useSupabase } from "@/utils/supabase";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function MealPlanningValue() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function completeValueScreen() {
    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ has_seen_value_screens: true })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user:", error);
      toast.error(t("onboarding.errors.saveFailed"));
      return;
    }

    dispatch(setUser({ ...user, has_seen_value_screens: true }));
    navigate("/beta");
  }

  return (
    <OnboardingLayout onNext={completeValueScreen}>
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
