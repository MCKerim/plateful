import OnboardingButton from "@/components/onboarding/onboardingButton/OnboardingButton";
import { useSupabase } from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { useRive } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";
import CircleTransition from "@/components/general/CircleTransition";
import { openBrowser } from "@/utils/nativeBrowser";
import { useNavigate } from "react-router";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { toast } from "sonner";

export default function SignUp() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showTransition, setShowTransition] = useState(true);

  const { rive, RiveComponent } = useRive({
    src: "/plateful-character.riv",
    artboard: "Fly-In",
    autoplay: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rive) {
        rive.play();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [rive]);

  const handleTransitionComplete = () => {
    setShowTransition(false);
  };

  const replayAnimation = () => {
    if (rive) {
      rive.reset({ artboard: "Fly-In" });
      rive.play();
    }
  };

  const signUp = async () => {
    try {
      const currentUrl = globalThis.location.origin;
      let redirectUri: string;

      // Determine the correct redirect URI based on platform
      if (
        globalThis.location.hostname === "localhost" ||
        globalThis.location.hostname === "127.0.0.1" ||
        globalThis.location.hostname ===
          "plateful-git-staging-mckerims-projects.vercel.app"
      ) {
        // Development environment
        redirectUri = currentUrl;
      } else {
        // Production
        redirectUri = "https://app.plateful.cloud/";
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        toast.error("Authentication failed. Please try again.");
      }

      await openBrowser(data?.url || "");
    } catch (error) {
      console.error("Unexpected error during sign up:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <CircleTransition
        isVisible={showTransition}
        onComplete={handleTransitionComplete}
        duration={1.2}
      />

      <div className="flex flex-col items-center h-screen px-4 py-10">
        <div className="flex flex-col justify-center flex-1 w-full mb-8 text-center">
          <h1 className="font-bold text-7xl first-font">{t("signup.title")}</h1>

          <p className="text-sm text-muted-foreground second-font">
            {t("signup.subtitle")}
          </p>
        </div>

        <RiveComponent onClick={replayAnimation} />

        <div className="flex flex-col w-full max-w-sm gap-2">
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            {t("signup.termsAndConditions")}
          </div>

          <OnboardingButton
            label={t("signup.continueWithGoogle")}
            onClick={signUp}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
            }
          />

          <OnboardingButton
            label={t("signup.continueWithEMail")}
            variant="secondary"
            onClick={() => navigate("/signup/email")}
            icon={<EmailOutlinedIcon />}
          />
        </div>
      </div>
    </>
  );
}
