import { useNavigate } from "react-router";
import "./ImportRecipes.css";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { useTranslation } from "react-i18next";

import tiktokIcon from "@/assets/icons/tiktok.svg";
import instagramIcon from "@/assets/icons/instagram.svg";
import youtubeIcon from "@/assets/icons/youtube.svg";
import globeIcon from "@/assets/icons/globe.svg";

import arrow1 from "@/assets/arrows/Arrow1.svg";
import arrow2 from "@/assets/arrows/Arrow2.svg";
import arrow3 from "@/assets/arrows/Arrow3.svg";
import arrow4 from "@/assets/arrows/Arrow4.svg";

const appIcons = [
  { url: tiktokIcon, name: "TikTok", position: "top-left", arrow: arrow1 },
  { url: instagramIcon, name: "Instagram", position: "top-right", arrow: arrow2 },
  { url: youtubeIcon, name: "YouTube", position: "bottom-left", arrow: arrow3 },
  { url: globeIcon, name: "Cookbook", position: "bottom-right", arrow: arrow4 },
] as const;

export default function ImportRecipes() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/values/2")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.importRecipes.title")}</h1>
      </div>

      <div className="phone-with-icons">
        {appIcons.map((icon) => (
          <div key={icon.name} className={`app-icon-bubble ${icon.position}`}>
            <img src={icon.url} alt={icon.name} />
          </div>
        ))}

        {appIcons.map((icon) => (
          <img
            key={`arrow-${icon.name}`}
            src={icon.arrow}
            alt=""
            className={`cartoon-arrow ${icon.position}`}
          />
        ))}

        <PhoneMockup mediaUrl="/import-recipes-recording.mp4" />
      </div>

      <p className="max-w-sm text-center text-gray-600">
        {t("valueScreens.importRecipes.description")}
      </p>
    </OnboardingLayout>
  );
}
