import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import Rive from "@rive-app/react-canvas";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function UpdateDialog({ open, onConfirm, onCancel }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center first-font text-xl">{t("update.title")}</DialogTitle>

          <div className="h-[150px] w-full">
            <Rive src="/plateful-character.riv" artboard="Fly-In" />
          </div>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-4 py-4">
          <p className="text-center second-font">{t("update.updateAvailable")}</p>

          <Button className="w-full" onClick={onConfirm}>
            {t("update.updateNow")}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
