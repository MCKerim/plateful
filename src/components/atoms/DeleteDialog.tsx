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
};

export default function DeleteDialog({ onDelete }: Readonly<Props>) {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger>
        <Button className="w-full hover:bg-destructive" variant="ghost">
          <Trash2 size={20} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t("common.deleteTitle")}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col gap-4 py-4">
          <p>{t("common.deleteConfirmation")}</p>

          <div className="flex gap-2">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleDialogOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>

            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {
                onDelete();
                handleDialogOpenChange(false);
              }}
            >
              {t("common.delete")}
            </Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
