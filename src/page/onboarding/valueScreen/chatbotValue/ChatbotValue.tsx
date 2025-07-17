import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export default function ChatbotValue() {
  const navigate = useNavigate();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  const h2Texts = [
    "für dein Wochenplan",
    "für Rezepte",
    "für Fragen"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % h2Texts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <OnboardingLayout onNext={() => navigate("/values/3")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold">Intelligenter Chatbot</h1>

        <h2 className="italic text-2xl font-semibold h-8 flex items-center justify-center">
          <span 
            key={currentTextIndex}
            className="inline-block animate-in fade-in-50 slide-in-from-bottom-3 duration-500"
          >
            {h2Texts[currentTextIndex]}
          </span>
        </h2>
      </div>

      <PhoneMockup screenshotUrl="/chatbotScreenshot.jpg" />

      <p className="text-gray-600 max-w-sm mt-2 text-center">
        Schreibe worauf du lust hast oder stelle Fragen zum Kochen!
      </p>
    </OnboardingLayout>
  );
}
