import OnboardingButton from "@/components/ui/onboarding/onboardingButton/OnboardingButton";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center h-screen px-4 py-10 bg-accent">
      <div className="text-center mb-8 flex-1 w-full flex flex-col justify-center text-primary-foreground overflow-hidden">
        <h1 className="text-4xl md:text-5xl first-font">
          {t("welcome.title")}
        </h1>

        <h2 className="italic text-lg md:text-xl font-semibold second-font">
          {t("welcome.subtitle")}
        </h2>
      </div>

      <NavLink to="/signup" className={"w-full max-w-sm"}>
        <OnboardingButton label={t("welcome.nextButton")} isStart />
      </NavLink>
    </div>
  );
}
