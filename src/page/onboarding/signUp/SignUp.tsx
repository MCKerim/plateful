import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import supabase from "@/utils/supabase";
import { useTranslation } from "react-i18next";
import { useRive } from '@rive-app/react-canvas';
import { useEffect } from 'react';

export default function SignUp() {
  const { t } = useTranslation();

  const { rive, RiveComponent } = useRive({
    src: "public/plateful-character.riv",
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

  const replayAnimation = () => {
    if (rive) {
      rive.reset({ artboard: "Fly-In" });
      rive.play();
    }
  };

  const signUp = async () => {
    const environment = import.meta.env.VITE_NODE_ENV;

    let redirectUri;
    switch (environment) {
      case "development":
        redirectUri = "http://localhost:5173/";
        break;

      case "codespace":
        redirectUri =
          "https://automatic-space-yodel-4rpxjgp5w9ph7qjx-5173.app.github.dev/";
        break;

      case "preview":
        redirectUri =
          "https://plateful-git-staging-mckerims-projects.vercel.app/";
        break;

      case "production":
        redirectUri = "https://www.plateful.cloud/";
        break;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
      },
    });
  };

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10">
      <div className="text-center mb-8 flex-1 w-full flex flex-col justify-center">
        <h1
          className="text-7xl font-bold"
          style={{
            fontFamily: "Modak",
          }}
        >
          {t("signup.title")}
        </h1>

        <p className="text-sm text-muted-foreground italic">
          {t("signup.subtitle")}
        </p>
      </div>

      <RiveComponent onClick={replayAnimation} />

      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
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
      </div>
    </div>
  );
}
