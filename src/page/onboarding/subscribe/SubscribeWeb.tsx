import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";
import { APP_STORE_URL, PLAY_STORE_URL, storesForDevice } from "@/lib/appStores";

export default function SubscribeWeb() {
  const { t } = useTranslation();
  const stores = storesForDevice();

  return (
    <OnboardingLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold first-font">{t("subscribe.web.title")}</h1>

        <p className="text-muted-foreground">{t("subscribe.web.description")}</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        {stores.appStore && (
          <StoreButton href={APP_STORE_URL} label={t("subscribe.web.appStore")} />
        )}
        {stores.playStore && (
          <StoreButton href={PLAY_STORE_URL} label={t("subscribe.web.playStore")} />
        )}
      </div>
    </OnboardingLayout>
  );
}

function StoreButton({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <Button asChild className="w-full h-12 rounded-full font-semibold text-base">
      <a href={href} target="_blank" rel="noreferrer">
        <Download size={18} />
        {label}
      </a>
    </Button>
  );
}
