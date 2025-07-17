import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";

export default function ChatbotValue() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/values/3")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold">Nutze Chatbot</h1>

        <h2 className="italic text-2xl font-semibold">zum chatten</h2>
      </div>

      <PhoneMockup screenshotUrl="/importRecipesScreenshot.jpg" />

      <p className="text-gray-600 max-w-sm mt-2 text-center">
        chat chat
      </p>
    </OnboardingLayout>
  );
}
