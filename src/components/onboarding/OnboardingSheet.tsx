import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useOnboardingSeen } from "@/hooks/general/useOnboardingSeen";
import { useTranslation } from "react-i18next";

type OnboardingSheetProps = {
  storageKey: string;
  titleKey: string;
  bulletKeys: string[];
  illustration?: React.ReactNode;
};

export default function OnboardingSheet({
  storageKey,
  titleKey,
  bulletKeys,
  illustration,
}: Readonly<OnboardingSheetProps>) {
  const { t } = useTranslation();
  const { seen, dismiss } = useOnboardingSeen(storageKey);

  if (seen !== false) return null;

  return (
    <Drawer
      open={true}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DrawerContent className="max-h-[85vh]">
        {illustration && (
          <div className="flex items-center justify-center h-[180px] overflow-hidden px-6 pt-2 pointer-events-none">
            {illustration}
          </div>
        )}
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-bold second-font">
            {t(titleKey)}
          </DrawerTitle>
        </DrawerHeader>

        <ul className="flex flex-col gap-2 px-6 pb-2">
          {bulletKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 text-accent-foreground bg-accent rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                {bulletKeys.indexOf(key) + 1}
              </span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        <DrawerFooter className="pb-6">
          <Button onClick={dismiss} className="w-full">
            {t("onboarding.gotIt")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
