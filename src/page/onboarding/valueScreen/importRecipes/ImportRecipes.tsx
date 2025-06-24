import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import supabase from "@/utils/supabase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import "./ImportRecipes.css";

export default function ImportRecipes() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();  const [animatedIcons, setAnimatedIcons] = useState<Array<{
    id: number;
    iconUrl: string;
    appName: string;
    startX: number;
    startY: number;
    delay: number;
  }>>([]);

  // Real app icons that will fly into the phone
  const appIcons = [
    { 
      url: 'https://logo.clearbit.com/tiktok.com',
      name: 'TikTok'
    },
    { 
      url: 'https://logo.clearbit.com/instagram.com',
      name: 'Instagram'
    },
    { 
      url: 'https://logo.clearbit.com/pinterest.com',
      name: 'Pinterest'
    },
    { 
      url: 'https://logo.clearbit.com/youtube.com',
      name: 'YouTube'
    },
    { 
      url: 'https://logo.clearbit.com/facebook.com',
      name: 'Facebook'
    },
    { 
      url: 'https://logo.clearbit.com/twitter.com',
      name: 'Twitter'
    },
    { 
      url: 'https://logo.clearbit.com/reddit.com',
      name: 'Reddit'
    },
    { 
      url: 'https://logo.clearbit.com/allrecipes.com',
      name: 'AllRecipes'
    }
  ];
  useEffect(() => {
    const createIcon = () => {
      const selectedApp = appIcons[Math.floor(Math.random() * appIcons.length)];
      return {
        id: Date.now(),
        iconUrl: selectedApp.url,
        appName: selectedApp.name,
        startX: Math.random() * window.innerWidth,
        startY: Math.random() * window.innerHeight,
        delay: 0,
      };
    };

    const addIcon = () => {
      const icon = createIcon();
      setAnimatedIcons(prev => [...prev, icon]);
      
      setTimeout(() => {
        setAnimatedIcons(prev => prev.filter(item => item.id !== icon.id));
      }, 3000);
    };

    const interval = setInterval(addIcon, 1500);
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
    <div className="flex flex-col items-center justify-between h-screen w-screen max-w-xs mx-auto py-10 px-4 relative overflow-hidden">      {/* Flying app icons */}
      {animatedIcons.map((icon) => (
        <div
          key={icon.id}
          className="flying-icon"
          style={{
            left: `${icon.startX}px`,
            top: `${icon.startY}px`,
            animationDelay: `${icon.delay}ms`,
          }}
        >
          <img 
            src={icon.iconUrl} 
            alt={icon.appName}
            className="w-8 h-8 rounded-lg shadow-lg"
            onError={(e) => {
              // Fallback to a generic icon if the image fails to load
              e.currentTarget.src = 'https://via.placeholder.com/32x32/4F46E5/white?text=📱';
            }}
          />
        </div>
      ))}

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Import Recipes <br />
          <span className="italic text-2xl">from everywhere</span>
        </h1>

        <p className="text-gray-600 mb-8">
          Just Share to Plateful from any app, and we'll save it for you.
        </p>
      </div>

      {/* Phone Screen Mockup */}
      <div className="w-64 bg-gray-900 rounded-[2.2rem] p-2 shadow-2xl relative z-20">
        <img
          src="/importRecipesScreenshot.png"
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
