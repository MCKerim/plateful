import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";

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
          <DialogTitle>{t("update.title")}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-4 py-4">
          <p>{t("update.updateAvailable")}</p>

          <div className="flex gap-2">
            <Button className="w-full" variant="secondary" onClick={onCancel}>
              {t("common.cancel")}
            </Button>

            <Button className="w-full" onClick={onConfirm}>
              {t("common.update")}
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
