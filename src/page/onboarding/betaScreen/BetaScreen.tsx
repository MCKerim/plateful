import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Rive from "@rive-app/react-canvas";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function BetaScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAppreciation, setShowAppreciation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAppreciation(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigate("/survey");
  };

  return (
    <OnboardingLayout
      nextButtonLabel={t("beta.nextButton")}
      onNext={handleNext}
    >
      <div className="flex flex-col justify-center w-full mb-8 text-center">
        <h1 className="font-bold text-4xl first-font">{t("beta.title")}</h1>

        <p className="text-sm text-muted-foreground second-font">
          {t("beta.thankYou")}
        </p>
      </div>

      <div className="w-64 h-64 mx-auto">
        <Rive src="/plateful-character.riv" artboard="Fly-In" />
      </div>

      <div className="flex flex-col w-full max-w-sm gap-6 mx-auto">
        <div
          className={`text-center space-y-2 transition-all duration-700 ${
            showAppreciation
              ? "opacity-100 translate-y-0"
              : "opacity-70 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-center">
            <p className="text-md second-font font-bold">
              {t("beta.description")}
            </p>
          </div>

          <div className="py-4 px-2 border border-primary rounded-lg">
            <ul className="space-y-1 text-xs">
              <li>• {t("beta.benefits.newFeatures")}</li>
              <li>• {t("beta.benefits.directInput")}</li>
              <li>• {t("beta.benefits.helpImprove")}</li>
            </ul>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
