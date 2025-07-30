import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";

export default function MealPlanningValue() {
  const user = useAppSelector(selectUser);
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
      alert("An error occurred while saving your progress. Please try again.");
      return;
    }

    navigate("/beta");
  }

  return (
    <OnboardingLayout onNext={completeValueScreen}>
      <div className="text-center">
        <h1 className="text-4xl font-bold">Planne Mahlzeiten</h1>

        <h2 className="text-2xl italic font-semibold">auf die einfache Art</h2>
      </div>

      <PhoneMockup screenshotUrl="/mealplannerScreenshot.jpg" />

      <p className="max-w-sm mt-2 text-center text-gray-600">
        Erstelle deinen Essensplan ohne Stress und spare Zeit und Geld beim
        Einkaufen!
      </p>
    </OnboardingLayout>
  );
}
