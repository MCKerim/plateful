import { useTranslation } from "react-i18next";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";

export default function SubscribeWeb() {
  const { t } = useTranslation();

  return (
    <OnboardingLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold first-font">
          {t("subscribe.web.title")}
        </h1>

        <p className="text-muted-foreground">
          {t("subscribe.web.description")}
        </p>
      </div>
    </OnboardingLayout>
  );
}
