import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingLayout from "@/components/layout/onboardingLayout/OnboardingLayout";

const APP_STORE_URL = "https://apps.apple.com/app/id6788850965";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.kblanks.plateful";

function storesForDevice() {
  const ua = navigator.userAgent;
  // iPadOS Safari sends a Mac user agent; only the touch points give it away.
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return {
    appStore: isIOS || !/Android/.test(ua),
    playStore: !isIOS,
  };
}

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
