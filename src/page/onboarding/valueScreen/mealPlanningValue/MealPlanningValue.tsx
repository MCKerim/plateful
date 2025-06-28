import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";

export default function MealPlanningValue() {
  return (
    <OnboardingLayout onNext={() => {}}>
      <div className="text-center">
        <h1 className="text-4xl font-bold">Planne Mahlzeiten</h1>

        <h2 className="italic text-2xl font-semibold">auf die einfache Art</h2>
      </div>

      <PhoneMockup screenshotUrl="/importRecipesScreenshot.jpg" />

      <p className="text-gray-600 max-w-sm mt-2 text-center">
        Erstelle deinen Essensplan ohne Stress und spare Zeit und Geld beim
        Einkaufen!
      </p>
    </OnboardingLayout>
  );
}
