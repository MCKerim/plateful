import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerFooter } from "../ui/drawer";
import { Camera, ImageIcon } from "lucide-react";
import { Capacitor } from "@capacitor/core";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCameraSelect: () => void;
  onGallerySelect: () => void;
};

export default function ImageSourceDrawer({
  open,
  onOpenChange,
  onCameraSelect,
  onGallerySelect,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const isNative = Capacitor.isNativePlatform();

  function renderButton(
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    description?: string,
    disabled?: boolean
  ) {
    return (
      <Button
        variant="secondary"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex justify-start gap-4 w-full h-full items-center text-start">
          {icon}

          <div className="flex flex-col justify-start">
            <p className="second-font font-semibold">{label}</p>

            <p className="text-xs font-normal text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </Button>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerFooter className="gap-4 mb-8 mt-4">
          {renderButton(
            <Camera />,
            t("common.imageSourceDrawer.camera.label"),
            onCameraSelect,
            isNative
              ? t("common.imageSourceDrawer.camera.description")
              : t("common.imageSourceDrawer.camera.disabledDescription"),
            !isNative
          )}

          {renderButton(
            <ImageIcon />,
            t("common.imageSourceDrawer.gallery.label"),
            onGallerySelect,
            t("common.imageSourceDrawer.gallery.description")
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
