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
import { Pencil, CalendarDays } from "lucide-react";

type Props = {
  isEdit?: boolean;
  id: number;
  initialDays?: number;
  onUpdateDate: (id: number, newDate: Date | null, newDays: number) => void;
  onDeleteDate?: (id: number) => void;
};

export default function PlanDialog({
  isEdit = false,
  id,
  initialDays = 0,
  onUpdateDate,
  onDeleteDate,
}: Readonly<Props>) {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [daysToPlan, setDaysToPlan] = useState<number>(initialDays);

  function saveDate(days: number) {
    onUpdateDate(id, null, days);
    setIsDialogOpen(false);
  }

  function deleteDate() {
    if (!onDeleteDate) {
      return;
    }
    onDeleteDate(id);
    setIsDialogOpen(false);
  }

  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setDaysToPlan(initialDays);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger>
        <Button className="w-full">
          {isEdit ? (
            <Pencil />
          ) : (
            <>
              <CalendarDays />
              {t("recipe.planRecipe")}
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("mealPlanner.selectNumberOfDays")}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="flex flex-col py-4 gap-4">
          <div className="flex gap-2">
            <Button
              className="w-full"
              variant={
                initialDays === 0
                  ? "secondary"
                  : daysToPlan === 1
                  ? "secondary"
                  : "outline"
              }
              onClick={() => saveDate(1)}
            >
              {t("dayWithCount", { count: 1 })}
            </Button>

            <Button
              className="w-full"
              variant={
                initialDays === 0
                  ? "secondary"
                  : daysToPlan === 2
                  ? "secondary"
                  : "outline"
              }
              onClick={() => saveDate(2)}
            >
              {t("dayWithCount", { count: 2 })}
            </Button>
          </div>

          {onDeleteDate && (
            <Button
              className="w-full"
              variant="destructive"
              onClick={deleteDate}
            >
              {t("common.remove")}
            </Button>
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
