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
    disabled?: boolean,
  ) {
    return (
      <Button
        variant="secondary"
        className="w-full h-26 rounded-2xl"
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex flex-col gap-1 items-center">
          {icon}

          <p className="second-font font-medium text-lg">{label}</p>
        </div>
      </Button>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerFooter className="mb-8 mt-4">
          <div className="flex gap-4">
            {renderButton(
              <Camera className="!size-8" />,
              t("common.camera"),
              onCameraSelect,
              !isNative,
            )}

            {renderButton(
              <ImageIcon className="!size-8" />,
              t("common.gallery"),
              onGallerySelect,
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
