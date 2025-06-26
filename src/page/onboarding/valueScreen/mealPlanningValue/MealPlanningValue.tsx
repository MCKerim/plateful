import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";

export default function MealPlanningValue() {
  return (
    <div className="relative flex flex-col items-center justify-between h-screen px-4 py-10 overflow-hidden">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Planne deine Mahlzeiten</h1>

        <h2 className="italic text-2xl font-semibold">auf die einfache Art</h2>

        <p className="text-gray-600 max-w-sm mt-2">
          Erstelle deinen Essensplan ohne Stress und spare Zeit und Geld beim Einkaufen!
        </p>
      </div>

      <PhoneMockup screenshotUrl="/importRecipesScreenshot.jpg" />

      <div className="w-full max-w-sm">
        <OnboardingButton label="Weiter" onClick={() => {}} />
      </div>
    </div>
  );
}
