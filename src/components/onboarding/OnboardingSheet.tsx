import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useOnboardingSeen } from "@/hooks/general/useOnboardingSeen";
import { useTranslation } from "react-i18next";

type OnboardingSheetProps = {
  storageKey: string;
  titleKey: string;
  descriptionKey: string;
};

export default function OnboardingSheet({
  storageKey,
  titleKey,
  descriptionKey,
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
      <DrawerContent className="max-h-[30vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">{t(titleKey)}</DrawerTitle>

          <DrawerDescription className="text-sm text-muted-foreground">
            {t(descriptionKey)}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="pb-6">
          <Button onClick={dismiss} className="w-full">
            {t("onboarding.gotIt")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
