import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Rive from "@rive-app/react-canvas";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

export default function BetaScreen() {
  const [showAppreciation, setShowAppreciation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAppreciation(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingLayout nextButtonLabel="Los geht's!" onNext={() => {}}>
      <div className="space-y-4 text-center">
        {/* Beta Badge */}
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className="px-4 py-2 text-orange-800 bg-orange-100 border-orange-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Beta Version
          </Badge>
        </div>

        <h1 className="text-4xl font-bold text-accent">Du bist dabei! 🎉</h1>
      </div>

      {/* Animated character */}
      <div className="w-64 h-64 mx-auto">
        <Rive src="/plateful-character.riv" artboard="Fly-In" />
      </div>

      {/* Main message */}
      <div className="flex flex-col w-full max-w-sm gap-6 mx-auto">
        <div
          className={`text-center space-y-4 transition-all duration-700 ${
            showAppreciation
              ? "opacity-100 translate-y-0"
              : "opacity-70 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <RocketLaunchIcon />
            <p className="text-lg font-semibold text-gray-800">
              Danke, dass du dabei bist!
            </p>
          </div>

          <p className="leading-relaxed text-gray-600">
            Deine Erfahrungen werden uns dabei helfen, die beste Kochapp zu
            entwickeln.
          </p>

          <div className="p-4 mt-6 border border-orange-200 rounded-lg bg-orange-50">
            <ul className="space-y-1 text-sm text-orange-700">
              <li>• Du bekommst alle neuen Features zuerst</li>
              <li>• Deine Meinung fließt direkt in die Entwicklung ein</li>
              <li>• Du hilfst dabei, Plateful noch besser zu machen</li>
            </ul>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
