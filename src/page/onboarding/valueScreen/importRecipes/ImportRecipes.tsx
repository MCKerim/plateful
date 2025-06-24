import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import "./ImportRecipes.css";

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
    {
      url: "https://logo.clearbit.com/twitter.com",
      name: "Twitter",
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

    const interval = setInterval(addIcon, 1000);
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
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10 px-4 relative overflow-hidden gap-4">
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
        <h1 className="text-4xl font-bold mb-2">
          Import Recipes <br />
          <span className="italic text-2xl">from everywhere</span>
        </h1>

        <p className="text-gray-600">Just Share with Plateful!</p>
      </div>

      {/* Phone Screen Mockup */}
      <div className="h-full bg-gray-900 rounded-[2.2rem] p-2 shadow-2xl relative z-20">
        <img
          src="/importRecipesScreenshot.jpg"
          alt="Mobile app interface screenshot"
          className="object-cover rounded-[1.8rem]"
        />
      </div>

      <div className="w-full">
        <Button className="w-full rounded-full" onClick={completeValueScreen}>
          Got it!
        </Button>
      </div>
    </div>
  );
}
