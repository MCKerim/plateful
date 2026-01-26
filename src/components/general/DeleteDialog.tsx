import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";

type Props = {
  onDelete: () => void;
  customTrigger?: React.ReactNode;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
};

export default function DeleteDialog({
  onDelete,
  customTrigger,
  title,
  description,
  cancelText,
  confirmText,
}: Readonly<Props>) {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dialogTitle = title ?? t("common.deleteTitle");
  const dialogDescription = description ?? t("common.deleteConfirmation");
  const dialogCancelText = cancelText ?? t("common.cancel");
  const dialogConfirmText = confirmText ?? t("common.delete");

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button className="hover:bg-destructive" variant="ghost">
            <Trash2 size={20} />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-4 py-4">
          <p>{dialogDescription}</p>

          <div className="flex gap-2">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleDialogOpenChange(false)}
            >
              {dialogCancelText}
            </Button>

            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {
                onDelete();
                handleDialogOpenChange(false);
              }}
            >
              {dialogConfirmText}
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
