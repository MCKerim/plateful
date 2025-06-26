import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import "./ImportRecipes.css";
import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import PhoneMockup from "@/components/ui/onboarding/phoneMockup/PhoneMockup";

export default function ImportRecipes() {
  const user = useAppSelector(selectUser);
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
      const randomOffset = (Math.random() - 0.5) * 300; // Random offset around center

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

    const interval = setInterval(addIcon, 800);
    return () => clearInterval(interval);
  }, []);

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

    navigate("/survey");
  }

  return (
    <div className="relative flex flex-col items-center justify-between h-screen px-4 py-10 overflow-hidden">
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
          <img
            src={icon.iconUrl}
            alt={icon.appName}
            className="w-16 h-16 rounded-xl shadow-lg"
          />
        </div>
      ))}

      <div className="text-center">
        <h1 className="text-4xl font-bold">Speichere Rezepte</h1>

        <h2 className="italic text-2xl font-semibold">von überall</h2>

        <p className="text-gray-600 max-w-sm mt-2">
          Teile deine Lieblingsrezepte aus allen Apps und Webseiten mit
          Plateful!
        </p>
      </div>

      <PhoneMockup screenshotUrl="/importRecipesScreenshot.jpg" />

      <div className="w-full max-w-sm">
        <OnboardingButton label="Weiter" onClick={completeValueScreen} />
      </div>
    </div>
  );
}
