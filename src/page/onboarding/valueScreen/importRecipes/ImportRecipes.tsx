import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import "./ImportRecipes.css";
import PhoneMockup from "@/components/onboarding/phoneMockup/PhoneMockup";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { useTranslation } from "react-i18next";

export default function ImportRecipes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [animatedIcons, setAnimatedIcons] = useState<
    Array<{
      id: number;
      iconUrl: string;
      appName: string;
      side: "left" | "right";
      yPosition: number;
      delay: number;
    }>
  >([]);

  // Real app icons that will fly into the phone
  const appIcons = [
    {
      url: "https://logo.clearbit.com/tiktok.com",
      name: "TikTok",
    },
    {
      url: "https://logo.clearbit.com/instagram.com",
      name: "Instagram",
    },
    {
      url: "https://logo.clearbit.com/pinterest.com",
      name: "Pinterest",
    },
    {
      url: "https://logo.clearbit.com/youtube.com",
      name: "YouTube",
    },
    {
      url: "https://logo.clearbit.com/facebook.com",
      name: "Facebook",
    },
  ];

  useEffect(() => {
    const createIcon = () => {
      const selectedApp = appIcons[Math.floor(Math.random() * appIcons.length)];
      const side: "left" | "right" = Math.random() > 0.5 ? "left" : "right";
      const phoneCenter = window.innerHeight / 2; // Approximate phone center
      const randomOffset = (Math.random() - 0.5) * 200 - 100; // Random offset around center

      return {
        id: Date.now(),
        iconUrl: selectedApp.url,
        appName: selectedApp.name,
        side: side,
        yPosition: phoneCenter + randomOffset,
        delay: 0,
      };
    };

    const addIcon = () => {
      const icon = createIcon();
      setAnimatedIcons((prev) => [...prev, icon]);

      setTimeout(() => {
        setAnimatedIcons((prev) => prev.filter((item) => item.id !== icon.id));
      }, 3000);
    };

    const interval = setInterval(addIcon, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OnboardingLayout onNext={() => navigate("/values/2")}>
      {/* Flying app icons */}
      {animatedIcons.map((icon) => (
        <div
          key={icon.id}
          className={`flying-icon from-${icon.side}`}
          style={{
            left: icon.side === "left" ? "20px" : "calc(100% - 80px)",
            top: `${icon.yPosition}px`,
            animationDelay: `${icon.delay}ms`,
          }}
        >
          <img src={icon.iconUrl} alt={icon.appName} className="w-12 h-12 shadow-lg rounded-xl" />
        </div>
      ))}

      <div className="text-center">
        <h1 className="text-4xl font-bold first-font">{t("valueScreens.importRecipes.title")}</h1>

        <h2 className="text-2xl italic font-semibold second-font">
          {t("valueScreens.importRecipes.subtitle")}
        </h2>
      </div>

      <PhoneMockup mediaUrl="/import-recipes-recording.mp4" />

      <p className="max-w-sm text-center text-gray-600">
        {t("valueScreens.importRecipes.description")}
      </p>
    </OnboardingLayout>
  );
}
