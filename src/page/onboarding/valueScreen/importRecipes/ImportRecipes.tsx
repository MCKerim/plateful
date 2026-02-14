import { useNavigate } from "react-router";
import "./ImportRecipes.css";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";

import tiktokIcon from "@/assets/icons/tiktok.svg";
import instagramIcon from "@/assets/icons/instagram.svg";
import youtubeIcon from "@/assets/icons/youtube.svg";
import globeIcon from "@/assets/icons/globe.svg";

import arrow1 from "@/assets/arrows/Arrow1.svg";
import arrow3 from "@/assets/arrows/Arrow3.svg";
import arrow4 from "@/assets/arrows/Arrow4.svg";

const appIcons = [
  { url: globeIcon, name: "TikTok", position: "top-left", arrow: arrow1 },
  { url: instagramIcon, name: "Instagram", position: "top-right", arrow: arrow3 },
  { url: youtubeIcon, name: "YouTube", position: "bottom-left", arrow: arrow3 },
  { url: tiktokIcon, name: "Cookbook", position: "bottom-right", arrow: arrow4 },
] as const;

// Separate x/y durations create a smooth Lissajous-like drift
const floatConfigs = [
  { x: 3, y: 3.5, xDuration: 3.8, yDuration: 4.6 },
  { x: 3.5, y: 3, xDuration: 4.4, yDuration: 3.6 },
  { x: 3, y: 3, xDuration: 5.0, yDuration: 3.9 },
  { x: 3.5, y: 3, xDuration: 3.5, yDuration: 4.8 },
];

export default function ImportRecipes() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <OnboardingLayout onNext={() => navigate("/values/2")}>
      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.importRecipes.title")}</h1>
      </div>

      <div className="phone-with-icons">
        {appIcons.map((icon, i) => (
          <motion.div
            key={icon.name}
            className={`app-icon-bubble ${icon.position}`}
            animate={{
              x: [floatConfigs[i].x, -floatConfigs[i].x],
              y: [floatConfigs[i].y, -floatConfigs[i].y],
            }}
            transition={{
              x: {
                duration: floatConfigs[i].xDuration,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              },
              y: {
                duration: floatConfigs[i].yDuration,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              },
            }}
          >
            <img src={icon.url} alt={icon.name} />
          </motion.div>
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
